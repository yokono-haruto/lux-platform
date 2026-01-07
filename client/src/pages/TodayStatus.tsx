import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { AdminHeader } from "@/components/AdminHeader";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

export default function TodayStatus() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 管理者以外はアクセス不可
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const statusQuery = trpc.systemStatus.getTodayStatus.useQuery(undefined, {
    retry: 2,
    refetchInterval: 60000, // 1分ごとに自動更新
    refetchOnWindowFocus: true,
  });
  const status = statusQuery.data;

  const approveIssueMutation = trpc.systemStatus.approveIssue.useMutation({
    onSuccess: () => {
      toast.success("承認しました");
      statusQuery.refetch();
      setProcessingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "承認に失敗しました");
      setProcessingId(null);
    },
  });

  const handleApprove = (issueId: string) => {
    if (window.confirm("この操作を承認しますか？")) {
      setProcessingId(issueId);
      approveIssueMutation.mutate({ issueId });
    }
  };

  const getHealthIcon = () => {
    if (!status) return null;
    
    switch (status.systemHealth) {
      case "healthy":
        return <CheckCircle className="w-12 h-12 text-green-400" />;
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-yellow-400" />;
      case "critical":
        return <XCircle className="w-12 h-12 text-red-400" />;
    }
  };

  const getHealthText = () => {
    if (!status) return "";
    
    switch (status.systemHealth) {
      case "healthy":
        return "正常に稼働しています";
      case "warning":
        return "注意が必要な項目があります";
      case "critical":
        return "緊急対応が必要です";
    }
  };

  const getHealthColor = () => {
    if (!status) return "bg-[#0f2847]/50 border-cyan-500/20";
    
    switch (status.systemHealth) {
      case "healthy":
        return "bg-green-500/10 border-green-500/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "critical":
        return "bg-red-500/10 border-red-500/30";
    }
  };

  const getSeverityBadge = (severity: "info" | "warning" | "critical") => {
    switch (severity) {
      case "info":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "critical":
        return "bg-red-500/20 text-red-300 border-red-500/30";
    }
  };

  if (statusQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">状況を確認しています...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <AdminHeader title="今日の状況" subtitle="System Status Overview" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* システムの健全性 */}
        <div className={`rounded-xl border-2 p-8 mb-8 ${getHealthColor()}`}>
          <div className="flex items-center space-x-4">
            {getHealthIcon()}
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                システムの状態
              </h2>
              <p className="text-lg text-gray-300">{getHealthText()}</p>
            </div>
          </div>
        </div>

        {/* 本日の概要 */}
        <div className="bg-[#0f2847]/80 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 mb-8 shadow-xl">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">本日の活動概要</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">新規案件</p>
              <p className="text-3xl font-bold text-blue-400">
                {status?.summary.newAppointmentsToday || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">件</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">新規入札</p>
              <p className="text-3xl font-bold text-green-400">
                {status?.summary.newBidsToday || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">件</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">承認待ち</p>
              <p className="text-3xl font-bold text-yellow-400">
                {status?.summary.pendingAppointments || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">件</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">公開中の案件</p>
              <p className="text-3xl font-bold text-purple-400">
                {status?.summary.activeAppointments || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">件</p>
            </div>
          </div>
        </div>

        {/* 登録状況 */}
        <div className="bg-[#0f2847]/80 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 mb-8 shadow-xl">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">登録状況</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">営業部隊数</p>
              <p className="text-3xl font-bold text-indigo-400">
                {status?.summary.salesCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">社</p>
            </div>
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">アクティブ営業部隊</p>
              <p className="text-3xl font-bold text-teal-400">
                {status?.summary.activeSalesCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">社</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">電力会社数</p>
              <p className="text-3xl font-bold text-orange-400">
                {status?.summary.powerCompanyCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">社</p>
            </div>
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">アクティブ電力会社</p>
              <p className="text-3xl font-bold text-pink-400">
                {status?.summary.activePowerCompanyCount || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">社</p>
            </div>
          </div>
        </div>

        {/* 重要事項・判断が必要な項目 */}
        <div className="bg-[#0f2847]/80 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">
            対応が必要な事項
          </h3>
          
          {!status?.issues || status.issues.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-white mb-2">
                現在、対応が必要な問題はありません
              </p>
              <p className="text-gray-400">
                システムは正常に稼働しています
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {status.issues.map((issue, index) => (
                <div
                  key={index}
                  className="border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-500/40 transition-all bg-[#0a1628]/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-3 py-1 border rounded-full text-xs font-semibold ${getSeverityBadge(issue.severity)}`}>
                          {issue.severity === "info" && "情報"}
                          {issue.severity === "warning" && "注意"}
                          {issue.severity === "critical" && "緊急"}
                        </span>
                        {issue.actionRequired && (
                          <span className="px-3 py-1 border rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border-orange-500/30">
                            対応必要
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {issue.title}
                      </h4>
                      <p className="text-gray-300 mb-2">{issue.description}</p>
                      <p className="text-sm text-gray-400">影響範囲: {issue.impact}</p>
                      <p className="text-sm text-gray-400">対応状況: {issue.status}</p>
                    </div>
                  </div>
                  {issue.actionRequired && (
                    <div className="mt-4 pt-4 border-t border-cyan-500/20 flex gap-2">
                      <button
                        onClick={() => handleApprove(issue.id)}
                        disabled={processingId === issue.id}
                        className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingId === issue.id ? "処理中..." : "✓ 承認"}
                      </button>
                      <button
                        onClick={() => navigate("/admin/dashboard")}
                        className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg transition-all font-bold"
                      >
                        詳細を確認
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
