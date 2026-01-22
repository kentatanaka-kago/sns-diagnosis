"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function HomePage() {
  const [instagramId, setInstagramId] = useState("");
  const [mode, setMode] = useState<"spicy" | "medium" | "mild">("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = async () => {
    const id = instagramId.trim();
    
    if (!id) {
      setError("Instagram IDを入力してください");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: id, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "診断に失敗しました");
      }

      setResult(data.result);
    } catch (err) {
      console.error("診断エラー:", err);
      setError(
        err instanceof Error
          ? err.message
          : "診断中にエラーが発生しました。しばらくしてから再度お試しください。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ヒーローセクション */}
      <header className="border-b border-slate-100 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 pb-10 pt-12 text-white">
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
      <section className="mx-auto w-full max-w-md px-4 pb-10 pt-6 sm:max-w-lg">
        <Card className="border-slate-100 shadow-lg">
          <CardContent className="p-5 sm:p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDiagnose();
              }}
              className="flex flex-col gap-3"
            >
              <label className="text-sm font-medium text-slate-800" htmlFor="instagramId">
                Instagram ID
              </label>
              <Input
                id="instagramId"
                placeholder="@username"
                value={instagramId}
                onChange={(e) => setInstagramId(e.target.value)}
                className="h-11"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={isLoading}
              />
              
              {/* モード選択 */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("spicy")}
                  disabled={isLoading}
                  className={`flex-1 h-11 rounded-lg border-2 font-semibold text-sm transition-all ${
                    mode === "spicy"
                      ? "bg-gradient-to-r from-red-500 via-purple-600 to-red-500 text-white border-red-500 shadow-md"
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
                      ? "bg-gradient-to-r from-blue-500 via-teal-500 to-blue-500 text-white border-blue-500 shadow-md"
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
                      ? "bg-gradient-to-r from-pink-400 via-orange-400 to-pink-400 text-white border-pink-400 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  💖 甘口
                </button>
              </div>
              
              <Button
                type="button"
                onClick={handleDiagnose}
                disabled={!instagramId.trim() || isLoading}
                className="mt-1 h-11 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white shadow-sm hover:opacity-95 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    診断中...
                  </>
                ) : (
                  "診断する"
                )}
              </Button>
              {error && (
                <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              {result && (() => {
                // ハッシュタグセクションを検出して分割
                // 複数のパターンに対応: "## ハッシュタグ", "## ハッシュタグ:", "ハッシュタグ:", "ハッシュタグ："など
                const hashtagPattern = /(##\s*)?ハッシュタグ[：:]\s*/i;
                const hashtagIndex = result.search(hashtagPattern);
                
                let visibleText = result;
                let hasHashtagSection = false;
                
                if (hashtagIndex !== -1) {
                  visibleText = result.substring(0, hashtagIndex).trim();
                  hasHashtagSection = true;
                }
                
                return (
                  <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">診断結果</h3>
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
                        <div className="mt-6 relative rounded-lg border-2 border-dashed border-pink-300 bg-gradient-to-br from-pink-50 to-purple-50 p-6 overflow-hidden">
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
      <section className="mx-auto w-full max-w-md px-4 pb-16 sm:max-w-lg">
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
