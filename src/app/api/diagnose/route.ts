import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apifyClient } from '@/lib/apify';
import { sendDifyChatMessage } from '@/lib/dify';

interface InstagramCache {
  id: string;
  username: string;
  diagnosis_result: string;
  created_at: string;
}

interface ApifyInstagramData {
  profile?: {
    biography?: string;
    fullName?: string;
  };
  posts?: Array<{
    caption?: string;
    text?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, mode = 'medium' } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'username is required' },
        { status: 400 }
      );
    }

    // モードの検証
    const validMode = mode === 'mild' ? 'mild' : mode === 'medium' ? 'medium' : 'spicy';

    // ユーザー名から @ を除去
    const cleanUsername = username.replace(/^@/, '').trim();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: 'Invalid username' },
        { status: 400 }
      );
    }

    // 1. Supabaseでキャッシュを確認（24時間以内、同じモード）
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: cacheData, error: cacheError } = await supabase
      .from('instagram_cache')
      .select('diagnosis_result, created_at')
      .eq('username', cleanUsername)
      .eq('mode', validMode) // モードも条件に追加
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') {
      // PGRST116 は "no rows returned" エラーなので、キャッシュがないことを意味する
      console.error('Supabase cache check error:', cacheError);
    }

    // キャッシュがあれば返す
    if (cacheData && cacheData.diagnosis_result) {
      return NextResponse.json({
        result: cacheData.diagnosis_result,
        cached: true,
      });
    }

    // 2. ApifyでInstagramデータを取得
    console.log(`Fetching Instagram data for: ${cleanUsername}`);

    let apifyData: any = null;

    try {
      // Apifyアクターを実行
      console.log('Starting Apify actor for username:', cleanUsername);
      
      // Apify公式のinstagram-profile-scraperアクターのパラメータを設定
      // usernamesパラメータを使用（公式推奨、ログイン壁にぶつかりにくい）
      const inputParams = {
        usernames: [cleanUsername], // IDを直接渡す
      };
      
      console.log('Apify input parameters:', JSON.stringify(inputParams, null, 2));
      console.log('Using actor: apify/instagram-profile-scraper');
      
      // apify/instagram-profile-scraper を使用（Apify公式で最も安定）
      const run = await apifyClient.actor('apify/instagram-profile-scraper').call(inputParams);

      console.log('Apify run started, ID:', run.id);

      // 実行が完了するまで待機
      const finishedRun = await apifyClient.run(run.id).waitForFinish();
      
      console.log('Apify run completed, status:', finishedRun.status);

      if (finishedRun.status !== 'SUCCEEDED') {
        const errorMsg = (finishedRun as any).statusMessage || 'Unknown error';
        throw new Error(`Apify run ${finishedRun.status}: ${errorMsg}`);
      }

      // データセットからアイテムを取得
      const dataset = await apifyClient.dataset(finishedRun.defaultDatasetId).listItems();
      console.log('Apify dataset items count:', dataset.items?.length || 0);

      if (dataset.items && dataset.items.length > 0) {
        // レスポンス形式を確認するためにログ出力
        console.log('First item structure:', JSON.stringify(dataset.items[0], null, 2).substring(0, 500));
        
        // 複数の形式に対応
        const firstItem = dataset.items[0];
        
        // エラーレスポンスのチェック
        if (firstItem.error) {
          const errorDesc = firstItem.errorDescription || firstItem.error || 'Unknown error';
          console.log('Apify returned error:', errorDesc);
          
          // より詳細なエラーメッセージ
          let userMessage = 'このアカウントは非公開か、ユーザー名が正しくない可能性があります。';
          if (errorDesc.includes('private')) {
            userMessage = 'このアカウントは非公開アカウントのため、データを取得できませんでした。';
          } else if (errorDesc.includes('Empty')) {
            userMessage = 'このアカウントのデータが見つかりませんでした。ユーザー名が正しいか確認してください。';
          }
          
          return NextResponse.json(
            {
              error: 'No Instagram data found for this username',
              details: userMessage,
              technicalDetails: errorDesc,
            },
            { status: 404 }
          );
        }
        
        // 形式1: 直接プロフィールと投稿が含まれている
        if (firstItem.profile || firstItem.posts) {
          apifyData = firstItem;
        }
        // 形式2: 配列の最初の要素がプロフィールデータ
        else if (Array.isArray(firstItem) && firstItem[0]) {
          apifyData = firstItem[0];
        }
        // 形式3: そのまま使用
        else {
          apifyData = firstItem;
        }
      }
    } catch (apifyError) {
      console.error('Apify error:', apifyError);
      return NextResponse.json(
        {
          error: 'Failed to fetch Instagram data',
          details: apifyError instanceof Error ? apifyError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Apifyデータが空の場合
    console.log('Apify data structure:', apifyData ? Object.keys(apifyData) : 'null');
    
    if (!apifyData) {
      return NextResponse.json(
        {
          error: 'No Instagram data found for this username',
          details: 'The account may be private or the username may be incorrect.',
        },
        { status: 404 }
      );
    }

    // プロフィール情報の存在を確認（instagram-profile-scraperは投稿データを返さない）
    // データは直接プロパティとして返される（profileオブジェクトではない）
    const hasProfile = apifyData.biography || apifyData.fullName || apifyData.username;

    if (!hasProfile) {
      console.log('No extractable profile data found in Apify response');
      return NextResponse.json(
        {
          error: 'No Instagram data found for this username',
          details: 'The account may be private or the username may be incorrect.',
        },
        { status: 404 }
      );
    }

    // 3. データ整形：プロフィール情報のみを抽出（instagram-profile-scraperは投稿データを返さない）
    // データは直接プロパティとして返されるため、profileオブジェクトを経由しない
    const profileText = apifyData.biography || '';
    const profileName = apifyData.fullName || '';
    const profileUsername = apifyData.username || cleanUsername;
    const followersCount = apifyData.followersCount ?? null;
    const followsCount = apifyData.followsCount ?? null;

    // プロフィール情報をまとめる
    const profileInfo = [
      profileUsername ? `ユーザー名: ${profileUsername}` : '',
      profileName ? `表示名: ${profileName}` : '',
      profileText ? `プロフィール文: ${profileText}` : '',
      followersCount !== null ? `フォロワー数: ${followersCount.toLocaleString()}` : '',
      followsCount !== null ? `フォロー数: ${followsCount.toLocaleString()}` : '',
    ]
      .filter((text) => text.trim().length > 0)
      .join('\n');

    // 投稿データを抽出（latestPostsから最新5件）
    let postsText = '';
    if (apifyData.latestPosts && Array.isArray(apifyData.latestPosts) && apifyData.latestPosts.length > 0) {
      const latestPosts = apifyData.latestPosts.slice(0, 5); // 最新5件のみ
      
      const postsData = latestPosts.map((post: any, index: number) => {
        const likesCount = post.likesCount || post.likeCount || 0;
        const commentsCount = post.commentsCount || post.commentCount || 0;
        let caption = post.caption || post.text || '';
        
        // キャプションが100文字を超える場合はカット
        if (caption.length > 100) {
          caption = caption.substring(0, 100) + '...';
        }
        
        return `投稿${index + 1}: ❤️${likesCount} 💬${commentsCount} 「${caption}」`;
      });
      
      postsText = `【直近の投稿データ】\n${postsData.join('\n')}`;
    }

    // Difyに送るプロンプト用テキスト
    const combinedText = `【プロフィール情報】
${profileInfo}${postsText ? `\n\n${postsText}` : ''}`;

    if (!combinedText.trim()) {
      return NextResponse.json(
        {
          error: 'No extractable text found in Instagram data',
        },
        { status: 404 }
      );
    }

    // 4. Dify APIで診断を実行
    console.log('Sending request to Dify API...');

    let diagnosisResult: string;

    try {
      // Dify APIに診断リクエストを送信
      // モードに合わせてqueryを変更
      let queryText = 'このアカウントのInstagram診断をお願いします。';
      if (validMode === 'mild') {
        queryText = 'このアカウントのInstagram診断をお願いします。優しく診断してください。';
      } else if (validMode === 'medium') {
        queryText = 'このアカウントのInstagram診断をお願いします。バランスの取れた診断をお願いします。';
      }
      
      diagnosisResult = await sendDifyChatMessage({
        inputs: {
          profile_context: combinedText,
          mode: validMode,
        },
        query: queryText,
        user: 'api-user',
        response_mode: 'blocking',
      });
    } catch (difyError) {
      console.error('Dify API error:', difyError);
      return NextResponse.json(
        {
          error: 'Failed to get diagnosis from AI',
          details: difyError instanceof Error ? difyError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    if (!diagnosisResult || !diagnosisResult.trim()) {
      return NextResponse.json(
        {
          error: 'Empty diagnosis result from AI',
        },
        { status: 500 }
      );
    }

    // 5. 結果をSupabaseに保存
    try {
      const { error: insertError } = await supabase
        .from('instagram_cache')
        .insert({
          username: cleanUsername,
          mode: validMode, // モードも保存
          diagnosis_result: diagnosisResult,
        });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        // 保存エラーでも診断結果は返す
      }
    } catch (saveError) {
      console.error('Failed to save to cache:', saveError);
      // 保存エラーでも診断結果は返す
    }

    // 6. レスポンスを返す
    return NextResponse.json({
      result: diagnosisResult,
      cached: false,
    });
  } catch (error) {
    console.error('Unexpected error in diagnose route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
