import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AdminHeader } from "@/components/AdminHeader";
import { AlertTriangle, CheckCircle, Code, FileCode, Loader } from "lucide-react";

export default function ErrorFixManagement() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [errorLog, setErrorLog] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  useEffect(() => {
    // ローディング完了後に管理者でなければリダイレクト
    if (!isLoading && user?.role !== "admin") {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const analyzeErrorMutation = trpc.autoFix.analyzeError.useMutation({
    onSuccess: (data) => {
      setFixResult(data);
      setAnalyzing(false);
      toast.success("エラー分析が完了しました");
    },
    onError: (error: any) => {
      setAnalyzing(false);
      toast.error(error.message || "エラー分析に失敗しました");
    },
  });

  const applyFixMutation = trpc.autoFix.applyFix.useMutation({
    onSuccess: () => {
      toast.success("修正を適用しました");
      setFixResult(null);
      setErrorLog("");
      setStackTrace("");
    },
    onError: (error: any) => {
      toast.error(error.message || "修正の適用に失敗しました");
    },
  });

  const handleAnalyze = () => {
    if (!errorLog.trim() || !stackTrace.trim()) {
      toast.error("エラーログとスタックトレースを入力してください");
      return;
    }

    setAnalyzing(true);
    analyzeErrorMutation.mutate({
      errorLog,
      stackTrace,
    });
  };

  const handleApplyFix = () => {
    if (!fixResult) return;

    if (window.confirm("この修正を適用しますか？\n\n注意: コードが自動的に変更されます。")) {
      applyFixMutation.mutate({
        fixId: fixResult.fixId,
        filePath: fixResult.filePath,
        fixCode: fixResult.fixCode,
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "high":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  // ローディング中はローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] text-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // 管理者でなければ何も表示しない（useEffectでリダイレクト）
  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <AdminHeader title="自動エラー修正" subtitle="AI-Powered Error Fix System" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* エラー入力セクション */}
        <div className="bg-[#0f2847]/80 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 mb-8 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-cyan-400">エラー情報を入力</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                エラーログ
              </label>
              <textarea
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                placeholder="エラーメッセージを入力..."
                className="w-full h-32 bg-[#0a1628] border border-cyan-500/20 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                スタックトレース
              </label>
              <textarea
                value={stackTrace}
                onChange={(e) => setStackTrace(e.target.value)}
                placeholder="スタックトレースを入力..."
                className="w-full h-48 bg-[#0a1628] border border-cyan-500/20 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !errorLog.trim() || !stackTrace.trim()}
              className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  AI分析中...
                </>
              ) : (
                <>
                  <Code className="w-5 h-5" />
                  AIで分析して修正案を生成
                </>
              )}
            </button>
          </div>
        </div>

        {/* 修正案表示セクション */}
        {fixResult && (
          <div className="bg-[#0f2847]/80 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-cyan-400">修正案</h3>
              </div>
              <span className={`px-3 py-1 border rounded-full text-xs font-semibold ${getSeverityColor(fixResult.severity)}`}>
                {fixResult.severity === "low" && "低"}
                {fixResult.severity === "medium" && "中"}
                {fixResult.severity === "high" && "高"}
              </span>
            </div>

            <div className="space-y-4">
              {/* 分析結果 */}
              <div className="bg-[#0a1628]/50 border border-cyan-500/10 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">エラー分析</h4>
                <p className="text-gray-300">{fixResult.analysis}</p>
              </div>

              {/* ファイルパス */}
              <div className="bg-[#0a1628]/50 border border-cyan-500/10 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  修正対象ファイル
                </h4>
                <p className="text-cyan-400 font-mono text-sm">{fixResult.filePath}</p>
              </div>

              {/* 修正コード */}
              <div className="bg-[#0a1628]/50 border border-cyan-500/10 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">修正後のコード</h4>
                <pre className="text-xs text-gray-300 overflow-x-auto bg-black/30 p-4 rounded border border-cyan-500/10 max-h-96">
                  {fixResult.fixCode}
                </pre>
              </div>

              {/* アクションボタン */}
              <div className="flex gap-4">
                <button
                  onClick={handleApplyFix}
                  disabled={applyFixMutation.isPending}
                  className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applyFixMutation.isPending ? "適用中..." : "✓ 修正を承認して適用"}
                </button>
                <button
                  onClick={() => setFixResult(null)}
                  className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg transition-all font-bold"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
