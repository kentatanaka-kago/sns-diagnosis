import axios from 'axios';

// APIキーから余分な空白や改行を除去
const difyApiKey = (process.env.DIFY_API_KEY || '').trim();
const difyApiUrl = (process.env.DIFY_API_URL || '').trim();

if (!difyApiKey) {
  throw new Error('Missing DIFY_API_KEY environment variable');
}

if (!difyApiUrl) {
  throw new Error('Missing DIFY_API_URL environment variable. Please set DIFY_API_URL in .env.local');
}

// APIキーの形式を検証
if (!difyApiKey.startsWith('app-')) {
  console.warn('Warning: Dify API key should start with "app-"');
}

// 接続先URLをログ出力
console.log('接続先URL:', difyApiUrl);

export interface DifyChatMessageRequest {
  inputs: {
    profile_context: string;
  };
  query?: string;
  user: string;
  response_mode?: 'blocking' | 'streaming';
}

export interface DifyChatMessageResponse {
  answer: string;
  [key: string]: unknown;
}

export async function sendDifyChatMessage(
  request: DifyChatMessageRequest
): Promise<string> {
  try {
    // ワークフローアプリ用のリクエストボディを構築
    // queryは必須パラメータなので、明示的に設定
    const requestBody = {
      inputs: request.inputs,
      query: request.query || 'このアカウントのInstagram診断をお願いします。', // 必須パラメータ
      user: request.user || 'api-user', // デフォルト値を設定
      response_mode: request.response_mode || 'blocking', // デフォルト値を設定
    };

    // リクエストヘッダーを構築
    const headers = {
      Authorization: `Bearer ${difyApiKey}`,
      'Content-Type': 'application/json',
    };

    // エンドポイントURLを構築（末尾に/chat-messagesを追加）
    const endpointUrl = difyApiUrl.endsWith('/chat-messages') 
      ? difyApiUrl 
      : `${difyApiUrl.replace(/\/$/, '')}/chat-messages`;

    console.log('Dify API request:', {
      url: endpointUrl,
      baseUrl: difyApiUrl,
      hasApiKey: !!difyApiKey,
      apiKeyPrefix: difyApiKey.substring(0, 4), // 最初の4文字だけ表示（セキュリティ）
      apiKeyLength: difyApiKey.length,
      authorizationHeader: `Bearer ${difyApiKey.substring(0, 4)}...`, // 確認用（最初の4文字のみ）
      inputs: Object.keys(request.inputs),
      hasQuery: !!requestBody.query,
    });

    const response = await axios.post<DifyChatMessageResponse>(
      endpointUrl,
      requestBody,
      {
        headers,
      }
    );

    console.log('Dify API response status:', response.status);
    console.log('Dify API response data keys:', Object.keys(response.data));
    
    // レスポンスからanswerを取得（複数の形式に対応）
    const answer = response.data.answer || (response.data as any).text || '';
    
    if (!answer) {
      console.warn('Dify API response does not contain answer field:', response.data);
    }
    
    return answer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || error.message;
      
      console.error('Dify API error details:', {
        status,
        errorMessage,
        errorData,
        hasApiKey: !!difyApiKey,
        apiKeyPrefix: difyApiKey.substring(0, 4),
      });

      if (status === 401) {
        // APIキーの詳細をログに出力（デバッグ用、最初の4文字のみ）
        console.error('API Key validation:', {
          exists: !!difyApiKey,
          length: difyApiKey.length,
          startsWithApp: difyApiKey.startsWith('app-'),
          firstChars: difyApiKey.substring(0, 8),
          lastChars: difyApiKey.substring(difyApiKey.length - 4),
          hasWhitespace: difyApiKey !== difyApiKey.trim(),
        });

        throw new Error(
          `Dify API認証エラー: APIキーが無効または設定されていません。\n` +
          `確認事項:\n` +
          `1. .env.localファイルのDIFY_API_KEYが正しく設定されているか（余分な空白や改行がないか）\n` +
          `2. APIキーは "app-" で始まる形式か（例: app-xxxxxxxxxxxxx）\n` +
          `3. Difyダッシュボードの「APIアクセス」から正しいAPIキーをコピーしているか\n` +
          `4. 開発サーバーを再起動したか\n` +
          `5. .env.localファイルのDIFY_API_KEYの前後に余分な空白や引用符がないか確認\n` +
          `現在のAPIキー長: ${difyApiKey.length}文字`
        );
      }

      throw new Error(
        `Dify API error: ${status} - ${errorMessage}`
      );
    }
    throw error;
  }
}
