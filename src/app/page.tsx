"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Sparkles, TrendingUp, Loader2, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function HomePage() {
  const [instagramId, setInstagramId] = useState("");
  const [mode, setMode] = useState<"spicy" | "medium" | "mild">("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [competitorId, setCompetitorId] = useState("");
  const [isCompetitorExpanded, setIsCompetitorExpanded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [tipIndex, setTipIndex] = useState(0);
  const [shuffledTips, setShuffledTips] = useState<string[]>([]);
  const [dataTimestamp, setDataTimestamp] = useState<Date | null>(null);
  const [isSegodon, setIsSegodon] = useState(false);
  const [ashParticles, setAshParticles] = useState<Array<{ id: number; left: number; duration: number; delay: number; size: number }>>([]);
  const [languageTab, setLanguageTab] = useState<'standard' | 'segodon'>('standard');
  const [displayMode, setDisplayMode] = useState<'standard' | 'segodon'>('standard');

  // 桜島背景コンポーネント（激しい噴火バージョン）
  const SakurajimaBackground = () => {
    // 噴煙パーティクル（数を増やしてランダム性を強化）
    const particles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: 40 + Math.random() * 20 + "%", // 火口付近（中央）から
      delay: Math.random() * 2 + "s",
      duration: 2 + Math.random() * 2 + "s", // より高速化（2-4秒）
      size: 15 + Math.random() * 35 + "px", // より大きなサイズ範囲
    }));

    return (
      <div className="absolute top-[180px] left-0 right-0 z-0 pointer-events-none overflow-hidden flex items-end justify-center">
        {/* 噴煙レイヤー（山より奥） */}
        <div className="absolute bottom-[10%] w-full h-full flex justify-center items-end">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-gradient-to-t from-gray-700 to-gray-500 opacity-0 animate-eruption"
              style={{
                left: p.left,
                bottom: "10%", // 山の頂上付近から発生
                width: p.size,
                height: p.size,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>

        {/* 山レイヤー（手前）: ゴツゴツした暗いシルエット */}
        <svg
          className="w-full h-[120px] md:h-[160px] text-gray-800 drop-shadow-2xl"
          viewBox="0 0 400 150"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a2a" stopOpacity="1" />
              <stop offset="50%" stopColor="#2d4a3a" stopOpacity="1" />
              <stop offset="100%" stopColor="#1a1a1a" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d="M0,150 L0,120 Q50,120 100,80 L160,30 Q200,10 240,30 L300,80 Q350,120 400,120 L400,150 Z"
            fill="url(#mountainGradient)"
            className="drop-shadow-2xl"
          />
          {/* マグマの輝き（火口付近） */}
          <circle cx="200" cy="30" r="15" className="fill-red-600 blur-xl opacity-80 animate-pulse" />
        </svg>
        
        {/* 前景のフォグ（奥行き出し） */}
        <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-white via-white/80 to-transparent" />
      </div>
    );
  };

  // インスタ豆知識のリスト（25個）
  const instagramTips = [
    "保存数が多い投稿ほど、発見タブに載りやすくなる",
    "プロフィールのアイコンは、顔写真の方が信頼性が3倍上がる",
    "自己紹介文の最初の3行で、フォローされるかどうかが決まる",
    "ハッシュタグは「ビッグワード」と「スモールワード」を混ぜるのがコツ",
    "リール動画は最初の1.5秒で離脱が決まる！結論から見せよう",
    "ストーリーズのアンケート機能は、親密度（シグナル）を上げる最強ツール",
    "投稿の「場所（ジオタグ）」を追加すると、近隣ユーザーに見つかりやすくなる",
    "コメントには1時間以内に返信すると、アルゴリズム的に優遇される",
    "フィード投稿は「正方形」より「縦長（4:5）」の方が、画面占有率が高く有利",
    "キャプションの1行目は「続きを読ませる」ための釣り針（フック）を置け",
    "ハイライトは「お店のメニュー表」。初めて来た人に見せたい情報を置こう",
    "フォロワー数より「エンゲージメント率」の方が、AIは重視している",
    "毎日投稿がつらいなら、ストーリーズだけは毎日動かそう",
    "文字入れ投稿は、左上に「目線を集めるタイトル」を置くと読まれやすい",
    "「保存して後で見返してね」という一言があるだけで、保存率は変わる",
    "ライブ配信をすると、ストーリーズの列で一番左に表示される",
    "カルーセル（複数枚）投稿は、滞在時間が伸びやすいのでおすすめ",
    "同業者の投稿に「いいね」やコメントをすると、認知が広がるきっかけになる",
    "プロフィールリンクは lit.link などを活用して、導線を整理しよう",
    "流行りの音源（Trending Audio）を使うと、リールの再生回数が伸びやすい",
    "写真は「明るさ」と「彩度」を少し上げるだけで、クリック率が変わる",
    "質問箱への回答は、ユーザーの悩みを知る宝の山",
    "自分の投稿をストーリーズでシェアする時は、スタンプで一部を隠してタップさせよう",
    "分析ツール（インサイト）は、数字よりも「何がウケたか」の傾向を見よう",
    "結局一番大事なのは、小手先のテクニックより「継続すること」",
  ];

  // Fisher-Yatesアルゴリズムでシャッフル
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // ローディングメッセージの更新
  useEffect(() => {
    if (!isLoading) {
      setLoadingMessage("");
      return;
    }

    // ローディング開始時刻を記録
    const startTime = Date.now();

    // 鹿児島あるあるメッセージ
    const kagoshimaMessages = [
      "桜島の灰を払いながら分析中...",
      "黒豚しゃぶしゃぶを煮込むくらいの時間お待ちください...",
      "AIが「しろくま」を食べて頭を冷やしています...",
      "錦江湾を泳いでデータを取得中...",
      "焼酎のお湯割りを準備中...",
      "西郷どんが城山から見守っています...",
    ];

    const updateMessage = () => {
      const elapsed = (Date.now() - startTime) / 1000; // 秒

      if (isSegodon || displayMode === 'segodon') {
        // 西郷どんモードの場合、鹿児島あるあるメッセージをランダム表示
        const randomIndex = Math.floor(Math.random() * kagoshimaMessages.length);
        setLoadingMessage(kagoshimaMessages[randomIndex]);
      } else {
        // 通常モード
        if (elapsed < 10) {
          setLoadingMessage("Instagramからデータを取得中... 📡");
        } else if (elapsed < 20) {
          setLoadingMessage("投稿のエンゲージメントを分析中... 📊");
        } else if (elapsed < 30) {
          setLoadingMessage("AI脳が辛口コメントを生成中... 🧠");
        } else {
          setLoadingMessage("仕上げに毒を盛っています... ☠️");
        }
      }
    };

    // 初回更新
    updateMessage();

    // 1秒ごとにメッセージを更新
    const messageInterval = setInterval(updateMessage, 1000);

    return () => {
      clearInterval(messageInterval);
    };
  }, [isLoading, displayMode, isSegodon]);

  // 豆知識のシャッフルと切り替え
  useEffect(() => {
    if (!isLoading) {
      setTipIndex(0);
      return;
    }

    // ローディング開始時にシャッフル
    const shuffled = shuffleArray(instagramTips);
    setShuffledTips(shuffled);
    setTipIndex(0);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => {
        const nextIndex = prev + 1;
        // シャッフルされた配列の長さでループ
        return nextIndex % shuffled.length;
      });
    }, 4000);

    return () => {
      clearInterval(tipInterval);
    };
  }, [isLoading]);

  // 火山灰パーティクルの生成
  useEffect(() => {
    if (displayMode !== 'segodon') {
      setAshParticles([]);
      return;
    }

    // 火山灰パーティクルを生成（30個程度）
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // 0-100%のランダムな位置
      duration: 5 + Math.random() * 5, // 5-10秒のランダムな速度
      delay: Math.random() * 2, // 0-2秒のランダムな遅延
      size: 2 + Math.random() * 4, // 2-6pxのランダムなサイズ
    }));

    setAshParticles(particles);
  }, [displayMode]);

  const handleDiagnose = async () => {
    const id = instagramId.trim();
    
    if (!id) {
      setError("Instagram IDを入力してください");
      return;
    }

    // メインIDのバリデーション: @ で始まっているかチェック
    if (!id.startsWith("@")) {
      setError("IDは @ から始まる形式で入力してください（例: @username）");
      return;
    }

    // 競合IDのバリデーション（入力がある場合のみ）
    const competitorIdTrimmed = competitorId.trim();
    if (competitorIdTrimmed && !competitorIdTrimmed.startsWith("@")) {
      setError("ライバルアカウントIDも @ から始まる形式で入力してください（例: @rival_account）");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setDataTimestamp(null);
    // せごどんモードの場合は鹿児島弁タブを初期表示
    if (isSegodon) {
      setLanguageTab('segodon');
      setDisplayMode('segodon');
    } else {
      setLanguageTab('standard');
      setDisplayMode('standard');
    }

    try {
      const requestBody: { username: string; mode: string; competitorId?: string; isSegodon?: boolean } = {
        username: id,
        mode,
        isSegodon,
      };
      
      // ライバルIDが入力されていれば追加
      if (competitorId.trim()) {
        requestBody.competitorId = competitorId.trim();
      }

      // タイムアウトを90秒に設定（Vercelの60秒制限より長く設定して、タイムアウトエラーを検出）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90秒

      let response;
      try {
        response = await fetch("/api/diagnose", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          setError("診断に時間がかかりすぎています。しばらくしてから再度お試しください。");
          setIsLoading(false);
          return;
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!response.ok) {
        // アカウントが存在しない場合のエラーハンドリング
        const errorMessage = data.error || "";
        const errorDetails = data.details || "";
        
        if (
          response.status === 404 ||
          errorMessage.includes("No Instagram data found") ||
          errorMessage.includes("アカウント") ||
          errorMessage.includes("private") ||
          errorMessage.includes("Empty")
        ) {
          setError("アカウントが存在しません");
          setIsLoading(false);
          return;
        }
        
        // Dify APIエラーの場合、詳細なメッセージを表示
        if (errorMessage.includes("AI診断") || errorMessage.includes("Failed to get diagnosis")) {
          const displayMessage = errorDetails 
            ? `${errorMessage}\n${errorDetails}`
            : errorMessage;
          setError(displayMessage);
          setIsLoading(false);
          return;
        }
        
        throw new Error(errorMessage || "診断に失敗しました");
      }

      setResult(data.result);
      
      // 区切り文字で分割されている場合、タブと表示モードを設定
      if (data.result && data.result.includes('<<<SEGODON_SPLIT>>>')) {
        // せごどんモードの場合は鹿児島弁タブを初期表示
        if (isSegodon) {
          setLanguageTab('segodon');
          setDisplayMode('segodon');
        } else {
          setLanguageTab('standard');
          setDisplayMode('standard');
        }
      }
      
      // データの日時をセット（キャッシュの場合）
      if (data.createdAt) {
        setDataTimestamp(new Date(data.createdAt));
      } else {
        setDataTimestamp(null);
      }
    } catch (err) {
      console.error("診断エラー:", err);
      const errorMessage = err instanceof Error ? err.message : "診断中にエラーが発生しました。しばらくしてから再度お試しください。";
      
      // タイムアウトエラーのチェック
      if (
        err instanceof Error &&
        (err.name === "AbortError" ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("タイムアウト") ||
          errorMessage.includes("504") ||
          errorMessage.includes("Gateway Timeout"))
      ) {
        setError("診断に時間がかかりすぎています。しばらくしてから再度お試しください。");
      }
      // アカウントが存在しない場合のエラーメッセージをチェック
      else if (errorMessage.includes("No Instagram data found") || errorMessage.includes("アカウント")) {
        setError("アカウントが存在しません");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = async () => {
    if (!result) return;

    // 区切り文字で分割されている場合、現在選択されているタブのテキストを使用
    let textToCopy = result;
    if (result.includes('<<<SEGODON_SPLIT>>>')) {
      const parts = result.split('<<<SEGODON_SPLIT>>>');
      if (parts.length >= 2) {
        textToCopy = languageTab === 'segodon' 
          ? parts.slice(1).join('<<<SEGODON_SPLIT>>>').trim()
          : parts[0].trim();
      }
    }

    // ハッシュタグセクションより前の部分だけを抽出
    const hashtagPattern = /(##\s*)?ハッシュタグ[：:]\s*/i;
    const hashtagIndex = textToCopy.search(hashtagPattern);
    const finalTextToCopy = hashtagIndex !== -1 
      ? textToCopy.substring(0, hashtagIndex).trim()
      : textToCopy;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus("copied");
      setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);
    } catch (err) {
      console.error("コピーに失敗しました:", err);
    }
  };

  return (
    <main className={`min-h-screen text-slate-900 relative ${displayMode === 'segodon' ? 'bg-gradient-to-b from-sky-200 via-blue-300 to-blue-800' : 'bg-white'}`}>
      {/* 火山灰パーティクル */}
      {displayMode === 'segodon' && ashParticles.map((particle) => (
        <div
          key={particle.id}
          className="ash-particle"
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      
      {/* ヒーローセクション */}
      <header className={`relative z-10 border-b border-slate-100 pb-10 pt-12 text-white ${
        displayMode === 'segodon'
          ? 'bg-gradient-to-r from-blue-900 via-teal-800 to-emerald-900' 
          : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'
      }`}>
        <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 text-center sm:max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-4 w-4" />
            AIインスタ診断
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            あなたのインスタ力を
            <br />
            AIが辛口診断
          </h1>
          <p className="mt-3 text-sm text-white/85">
            プロフィールと投稿の「伸びしろ」を、AIがズバッとスコアリング。
          </p>
        </div>
      </header>

      {/* フォームカード */}
      <section className="relative z-10 mx-auto w-full max-w-md px-4 pb-10 pt-6 sm:max-w-lg">
        <Card className="border-slate-100 shadow-lg relative overflow-hidden">
          <CardContent className="p-5 sm:p-6 relative">
            {/* 桜島背景（西郷どんモード時、常に表示） */}
            {(isSegodon || displayMode === 'segodon') && <SakurajimaBackground />}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDiagnose();
              }}
              className="flex flex-col gap-3 relative z-10"
            >
              <label className="text-sm font-medium text-slate-800" htmlFor="instagramId">
                Instagram ID
              </label>
              <Input
                id="instagramId"
                placeholder="@username"
                value={instagramId}
                onChange={(e) => setInstagramId(e.target.value)}
                className="h-11 relative z-10"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={isLoading}
              />
              
              {/* 西郷どんモード切替 */}
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 bg-slate-50 relative z-10">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={isSegodon}
                    onChange={(e) => setIsSegodon(e.target.checked)}
                    disabled={isLoading}
                    className="w-5 h-5 rounded border-2 border-slate-300 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    西郷どんモード（鹿児島弁）
                  </span>
                </label>
              </div>
              
              {/* モード選択 */}
              <div className="flex gap-2 relative z-10">
                <button
                  type="button"
                  onClick={() => setMode("spicy")}
                  disabled={isLoading}
                  className={`flex-1 h-11 rounded-lg border-2 font-semibold text-sm transition-all ${
                    mode === "spicy"
                      ? (isSegodon || displayMode === 'segodon')
                        ? "bg-gradient-to-r from-red-500/70 via-purple-600/70 to-red-500/70 text-white border-red-500 shadow-md backdrop-blur-sm"
                        : "bg-gradient-to-r from-red-500 via-purple-600 to-red-500 text-white border-red-500 shadow-md"
                      : (isSegodon || displayMode === 'segodon')
                        ? "bg-white/60 text-slate-700 border-slate-300 hover:border-slate-400 backdrop-blur-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  💀 辛口
                </button>
                <button
                  type="button"
                  onClick={() => setMode("medium")}
                  disabled={isLoading}
                  className={`flex-1 h-11 rounded-lg border-2 font-semibold text-sm transition-all ${
                    mode === "medium"
                      ? (isSegodon || displayMode === 'segodon')
                        ? "bg-gradient-to-r from-blue-500/70 via-teal-500/70 to-blue-500/70 text-white border-blue-500 shadow-md backdrop-blur-sm"
                        : "bg-gradient-to-r from-blue-500 via-teal-500 to-blue-500 text-white border-blue-500 shadow-md"
                      : (isSegodon || displayMode === 'segodon')
                        ? "bg-white/60 text-slate-700 border-slate-300 hover:border-slate-400 backdrop-blur-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  👔 標準
                </button>
                <button
                  type="button"
                  onClick={() => setMode("mild")}
                  disabled={isLoading}
                  className={`flex-1 h-11 rounded-lg border-2 font-semibold text-sm transition-all ${
                    mode === "mild"
                      ? (isSegodon || displayMode === 'segodon')
                        ? "bg-gradient-to-r from-pink-400/70 via-orange-400/70 to-pink-400/70 text-white border-pink-400 shadow-md backdrop-blur-sm"
                        : "bg-gradient-to-r from-pink-400 via-orange-400 to-pink-400 text-white border-pink-400 shadow-md"
                      : (isSegodon || displayMode === 'segodon')
                        ? "bg-white/60 text-slate-700 border-slate-300 hover:border-slate-400 backdrop-blur-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  💖 甘口
                </button>
              </div>
              
              {/* 競合比較アコーディオン */}
              <div className="mt-2 relative z-10">
                <button
                  type="button"
                  onClick={() => setIsCompetitorExpanded(!isCompetitorExpanded)}
                  disabled={isLoading}
                  className="w-full h-11 rounded-lg border-2 border-slate-300 bg-gradient-to-r from-yellow-50 via-pink-50 to-purple-50 text-slate-700 font-semibold text-sm hover:border-slate-400 transition-all relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-pink-400/10 to-purple-400/10" />
                  <div className="relative flex items-center justify-center gap-2">
                    <span>🔍</span>
                    <span>競合比較</span>
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-yellow-400 to-pink-400 px-2 py-0.5 text-xs font-bold text-white">
                      PREMIUM
                    </span>
                    <span className={`text-xs transition-transform ${isCompetitorExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>
                
                {/* ライバルID入力欄（アコーディオン展開時） */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isCompetitorExpanded
                      ? "max-h-40 opacity-100 mt-3"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="rounded-lg border-2 border-dashed border-pink-300 bg-gradient-to-br from-pink-50 via-purple-50 to-yellow-50 p-4">
                    <label className="text-sm font-medium text-slate-800 block mb-2" htmlFor="competitorId">
                      ライバルアカウント ID
                    </label>
                    <Input
                      id="competitorId"
                      placeholder="@rival_account"
                      value={competitorId}
                      onChange={(e) => setCompetitorId(e.target.value)}
                      className="h-11 bg-white"
                      inputMode="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      disabled={isLoading}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      比較したいアカウントのIDを入力すると、診断結果に競合比較が含まれます
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                onClick={handleDiagnose}
                disabled={!instagramId.trim() || isLoading}
                className={`mt-1 w-full text-white shadow-sm hover:opacity-95 disabled:opacity-60 transition-all duration-300 relative z-10 ${
                  isSegodon
                    ? "bg-red-600/80 bg-[url('/sakurajima.png')] bg-cover bg-center bg-no-repeat relative overflow-hidden min-h-[64px] py-4 border-2 border-orange-500/80"
                    : "bg-gradient-to-r from-purple-500/90 via-pink-500/90 to-orange-500/90 h-11"
                }`}
                style={isSegodon ? {} : {}}
              >
                {isSegodon && (
                  <div className="absolute inset-0 bg-black/20 z-0" />
                )}
                <span className={`relative z-10 flex items-center justify-center gap-2 ${
                  isSegodon 
                    ? 'text-white font-bold text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' 
                    : ''
                }`}>
                  {isLoading ? (
                    <>
                      <Loader2 className={`${isSegodon ? 'h-5 w-5' : 'h-4 w-4'} animate-spin`} />
                      診断中...
                    </>
                  ) : (
                    <>
                      {isSegodon && <span className="text-xl">🌋</span>}
                      {isSegodon ? "診断するでごわす" : "診断する"}
                    </>
                  )}
                </span>
              </Button>
              
              {/* リッチなローディング画面 */}
              {isLoading && (
                <div className="mt-6 animate-in fade-in duration-300 relative z-10">
                  <div className={`flex flex-col items-center justify-center rounded-lg border-2 p-8 backdrop-blur-sm ${
                    displayMode === 'segodon'
                      ? 'border-blue-300/50 bg-white/60'
                      : 'border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50'
                  }`}>
                    {/* スピナー（パルスアニメーション） */}
                    <div className="relative mb-6">
                      <div className={`h-20 w-20 animate-pulse rounded-full opacity-75 ${
                        displayMode === 'segodon'
                          ? 'bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600'
                          : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'
                      }`}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-white" />
                      </div>
                    </div>
                    
                    {/* 進捗メッセージ */}
                    <p className="mb-6 text-center text-lg font-bold text-slate-800">
                      {loadingMessage || "診断を開始しています..."}
                    </p>
                    
                    {/* 豆知識エリア */}
                    <div className={`w-full max-w-md rounded-lg border p-4 shadow-sm backdrop-blur-sm ${
                      displayMode === 'segodon'
                        ? 'border-blue-300/50 bg-white/70'
                        : 'border-purple-200 bg-white/80'
                    }`}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <span className={`text-sm font-semibold ${
                          displayMode === 'segodon' ? 'text-blue-700' : 'text-purple-700'
                        }`}>
                          今日のインスタ豆知識
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700 animate-in fade-in duration-500">
                        {shuffledTips.length > 0 ? shuffledTips[tipIndex] : instagramTips[0]}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3 relative z-10">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              {result && (() => {
                // 区切り文字で分割（常にチェック）
                let standardText = result;
                let segodonText = '';
                let hasLanguageSplit = false;
                
                if (result.includes('<<<SEGODON_SPLIT>>>')) {
                  const parts = result.split('<<<SEGODON_SPLIT>>>');
                  if (parts.length >= 2) {
                    standardText = parts[0].trim();
                    segodonText = parts.slice(1).join('<<<SEGODON_SPLIT>>>').trim();
                    hasLanguageSplit = true;
                  }
                }
                
                // 表示するテキストを選択
                const displayText = hasLanguageSplit && languageTab === 'segodon' ? segodonText : standardText;
                
                // ハッシュタグセクションを検出して分割
                // 複数のパターンに対応: "## ハッシュタグ", "## ハッシュタグ:", "ハッシュタグ:", "ハッシュタグ："など
                const hashtagPattern = /(##\s*)?ハッシュタグ[：:]\s*/i;
                const hashtagMatch = displayText.match(hashtagPattern);
                const hashtagIndex = hashtagMatch ? displayText.search(hashtagPattern) : -1;
                
                let visibleText = displayText;
                let hasHashtagSection = false;
                let hashtagTitle = '';
                
                if (hashtagIndex !== -1) {
                  visibleText = displayText.substring(0, hashtagIndex).trim();
                  hasHashtagSection = true;
                  // ハッシュタグのタイトル部分を抽出（改行まで、または次の行まで）
                  const afterHashtag = displayText.substring(hashtagIndex);
                  const titleMatch = afterHashtag.match(/^(##\s*)?ハッシュタグ[：:]\s*/i);
                  if (titleMatch) {
                    hashtagTitle = titleMatch[0].trim();
                  }
                }
                
                // モードの表示名を取得
                const modeLabels = {
                  spicy: '💀 辛口モード',
                  medium: '👔 標準モード',
                  mild: '💖 甘口モード',
                };
                
                // 日時フォーマット関数
                const formatDateTime = (date: Date): string => {
                  const month = date.getMonth() + 1;
                  const day = date.getDate();
                  const hours = date.getHours();
                  const minutes = date.getMinutes().toString().padStart(2, '0');
                  return `${month}月${day}日 ${hours}:${minutes}`;
                };
                
                // 次回診断可能日時を計算（診断日時 + 6時間）
                const getNextAvailableTime = (date: Date): string => {
                  const nextDate = new Date(date);
                  nextDate.setHours(nextDate.getHours() + 6);
                  return formatDateTime(nextDate);
                };
                
                return (
                  <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-4 relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-900">診断結果</h3>
                      {/* コピーボタン */}
                      <button
                        type="button"
                        onClick={handleCopyResult}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors"
                      >
                        {copyStatus === "copied" ? (
                          <>
                            <span>✅</span>
                            <span>コピーしました！</span>
                          </>
                        ) : (
                          <>
                            <span>📋</span>
                            <span>結果をコピー</span>
                          </>
                        )}
                      </button>
                    </div>
                    {/* アカウント名とモードを先頭に表示 */}
                    {/* 言語切り替えタブ（分割されている場合のみ） */}
                    {hasLanguageSplit && (
                      <div className="mb-4 flex gap-2 border-b border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setLanguageTab('standard');
                            setDisplayMode('standard');
                          }}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            languageTab === 'standard'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          標準語
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLanguageTab('segodon');
                            setDisplayMode('segodon');
                          }}
                          className={`px-4 py-2 text-sm font-medium transition-colors ${
                            languageTab === 'segodon'
                              ? 'text-orange-600 border-b-2 border-orange-600'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          鹿児島弁
                        </button>
                      </div>
                    )}
                    
                    {/* データ日時インフォメーション */}
                    {dataTimestamp && (
                      <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-blue-800 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-xs text-blue-800">
                            <p className="font-medium mb-1">
                              ⏳ 前回の診断結果（{formatDateTime(dataTimestamp)}） を表示しています
                            </p>
                            <p className="text-blue-700 mb-1">
                              次回のAI診断は {getNextAvailableTime(dataTimestamp)} 以降に可能です
                            </p>
                            <p className="text-blue-600">
                              💡 同じアカウントでも、違うモード（辛口/標準/甘口）なら今すぐ診断できます
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-4 pb-3 border-b border-slate-200">
                      <div className="flex flex-col gap-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">アカウント:</span>
                          <span className="text-slate-900">@{instagramId.replace(/^@/, '')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">モード:</span>
                          <span className="text-slate-900">{modeLabels[mode]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-700">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-bold mt-4 mb-2 text-slate-900">
                              {children}
                            </h2>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-5 my-2 space-y-1">
                              {children}
                            </ul>
                          ),
                          li: ({ children }) => (
                            <li className="leading-relaxed">
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-pink-600 font-semibold">
                              {children}
                            </strong>
                          ),
                          b: ({ children }) => (
                            <b className="text-pink-600 font-semibold">
                              {children}
                            </b>
                          ),
                          p: ({ children }) => (
                            <p className="leading-relaxed mb-4">
                              {children}
                            </p>
                          ),
                        }}
                      >
                        {visibleText}
                      </ReactMarkdown>
                      
                      {/* ハッシュタグセクションのぼかし表示 */}
                      {hasHashtagSection && (
                        <div className="mt-6 rounded-lg border-2 border-dashed border-pink-300 bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden">
                          {/* ハッシュタグのタイトル部分（見えるように表示） */}
                          {hashtagTitle && (
                            <div className="px-6 pt-4 pb-2">
                              <h2 className="text-lg font-bold text-slate-900">
                                {hashtagTitle.replace(/^##\s*/, '')}
                              </h2>
                            </div>
                          )}
                          
                          {/* タグ部分のぼかし表示 */}
                          <div className="relative p-6 overflow-hidden">
                            {/* ぼかしたダミーハッシュタグ */}
                            <div className="blur-sm select-none pointer-events-none">
                              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                                <span className="px-2 py-1 bg-white/50 rounded">#ビジネス</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#集客</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#Instagram</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#マーケティング</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#SNS運用</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#フォロワー増加</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#コンテンツ</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#ブランディング</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#エンゲージメント</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#インフルエンサー</span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-2">
                                <span className="px-2 py-1 bg-white/50 rounded">#SEO対策</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#コンバージョン</span>
                                <span className="px-2 py-1 bg-white/50 rounded">#リーチ拡大</span>
                              </div>
                            </div>
                            
                            {/* ロックアイコンとメッセージ */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                              <div className="text-center">
                                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 text-white text-sm font-semibold mb-3 shadow-lg">
                                  <span>🔒</span>
                                  <span>ここから先はプレミアムプラン限定</span>
                                </div>
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 px-6 py-2.5 text-white text-sm font-semibold shadow-md opacity-90 cursor-not-allowed"
                                >
                                  プレミアムプランで最適なタグを見る
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </form>
          </CardContent>
        </Card>
      </section>

      {/* 3つの診断ポイント */}
      <section className="relative z-10 mx-auto w-full max-w-md px-4 pb-16 sm:max-w-lg">
        <h2 className="text-lg font-bold text-slate-900">3つの診断ポイント</h2>
        <p className="mt-2 text-xs text-slate-500">
          「なんとなく投稿」を卒業して、伸びるアカウントの型に近づけます。
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="mt-0.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-2 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">プロフィールの伸びしろ診断</p>
              <p className="mt-1 text-xs text-slate-600">
                一言紹介・肩書き・リンク導線など、フォロー率に直結するポイントをチェック。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 border-dashed bg-slate-50/50 px-4 py-3 opacity-60">
            <div className="mt-0.5 rounded-xl bg-slate-300 p-2 text-slate-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-500">投稿デザイン・世界観診断</p>
                <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                  準備中
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                色味・トーン・構図の一貫性をチェックし、タイムラインでの映え度をスコアリング。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 border-dashed bg-slate-50/50 px-4 py-3 opacity-60">
            <div className="mt-0.5 rounded-xl bg-slate-300 p-2 text-slate-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-500">発信軸・コンテンツ軸診断</p>
                <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                  準備中
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                「誰に」「何を」届けたいアカウントなのかを分析し、ブレているポイントを可視化。
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>
  );
}
