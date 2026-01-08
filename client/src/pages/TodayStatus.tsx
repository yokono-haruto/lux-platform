import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  FileText,
  Gavel,
  Users,
  Building2,
  Activity,
  Zap,
  RefreshCw
} from "lucide-react";

export default function TodayStatus() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const statusQuery = trpc.systemStatus.getTodayStatus.useQuery(undefined, {
    retry: 2,
    refetchInterval: 60000,
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

  const getHealthConfig = () => {
    if (!status) return { icon: Activity, text: "確認中...", color: "indigo" };
    
    switch (status.systemHealth) {
      case "healthy":
        return { icon: CheckCircle, text: "正常に稼働しています", color: "emerald" };
      case "warning":
        return { icon: AlertTriangle, text: "注意が必要な項目があります", color: "amber" };
      case "critical":
        return { icon: XCircle, text: "緊急対応が必要です", color: "rose" };
      default:
        return { icon: Activity, text: "確認中...", color: "indigo" };
    }
  };

  const healthConfig = getHealthConfig();
  const HealthIcon = healthConfig.icon;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", iconBg: "bg-emerald-500/20" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", iconBg: "bg-amber-500/20" },
      rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", iconBg: "bg-rose-500/20" },
      indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400", iconBg: "bg-indigo-500/20" },
      cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", iconBg: "bg-cyan-500/20" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", iconBg: "bg-purple-500/20" },
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", iconBg: "bg-blue-500/20" },
    };
    return colors[color] || colors.indigo;
  };

  if (statusQuery.isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
          <p className="text-white/70">状況を確認しています...</p>
        </div>
      </div>
    );
  }

  const activityStats = [
    { label: "新規案件", value: status?.summary.newAppointmentsToday || 0, icon: FileText, color: "indigo" },
    { label: "新規入札", value: status?.summary.newBidsToday || 0, icon: Gavel, color: "emerald" },
    { label: "承認待ち", value: status?.summary.pendingAppointments || 0, icon: Clock, color: "amber" },
    { label: "公開中", value: status?.summary.activeAppointments || 0, icon: Activity, color: "purple" },
  ];

  const registrationStats = [
    { label: "営業部隊", value: status?.summary.salesCount || 0, icon: Users, color: "cyan" },
    { label: "アクティブ営業", value: status?.summary.activeSalesCount || 0, icon: Users, color: "emerald" },
    { label: "電力会社", value: status?.summary.powerCompanyCount || 0, icon: Building2, color: "purple" },
    { label: "アクティブ電力", value: status?.summary.activePowerCompanyCount || 0, icon: Building2, color: "indigo" },
  ];

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => navigate("/admin/dashboard")}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">今日の状況</h1>
                <p className="text-xs text-white/40 hidden sm:block">System Status Overview</p>
              </div>
            </div>
            
            <button
              onClick={() => statusQuery.refetch()}
              disabled={statusQuery.isFetching}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${statusQuery.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* System Health */}
        {(() => {
          const colors = getColorClasses(healthConfig.color);
          return (
            <div className={`glass-card p-6 sm:p-8 mb-6 sm:mb-8 ${colors.border} border-2`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className={`w-16 h-16 rounded-2xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <HealthIcon className={`w-8 h-8 ${colors.text}`} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    システムの状態
                  </h2>
                  <p className={`text-lg ${colors.text}`}>{healthConfig.text}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Activity Stats */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-500" />
            本日の活動概要
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {activityStats.map((stat, i) => {
              const colors = getColorClasses(stat.color);
              const Icon = stat.icon;
              return (
                <div key={i} className="stat-card">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-white/50">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registration Stats */}
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-500" />
            登録状況
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {registrationStats.map((stat, i) => {
              const colors = getColorClasses(stat.color);
              const Icon = stat.icon;
              return (
                <div key={i} className="stat-card">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-white/50">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Issues */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-500" />
            対応が必要な事項
          </h3>
          
          {!status?.issues || status.issues.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-lg font-semibold text-white mb-2">
                現在、対応が必要な問題はありません
              </p>
              <p className="text-white/50 text-sm">
                システムは正常に稼働しています
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {status.issues.map((issue, index) => (
                <div
                  key={index}
                  className="p-4 sm:p-5 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          issue.severity === "info" ? "badge-info" :
                          issue.severity === "warning" ? "badge-warning" : "badge-error"
                        }`}>
                          {issue.severity === "info" && "情報"}
                          {issue.severity === "warning" && "注意"}
                          {issue.severity === "critical" && "緊急"}
                        </span>
                        {issue.actionRequired && (
                          <span className="badge-warning">対応必要</span>
                        )}
                      </div>
                      <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                        {issue.title}
                      </h4>
                      <p className="text-white/70 text-sm mb-3">{issue.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                        <span>影響範囲: {issue.impact}</span>
                        <span>対応状況: {issue.status}</span>
                      </div>
                    </div>
                  </div>
                  {issue.actionRequired && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleApprove(issue.id)}
                        disabled={processingId === issue.id}
                        className="btn-premium py-2.5 text-sm disabled:opacity-50"
                      >
                        {processingId === issue.id ? "処理中..." : "承認する"}
                      </button>
                      <button
                        onClick={() => navigate("/admin/dashboard")}
                        className="py-2.5 px-4 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all text-sm"
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
      </main>

      <Footer />
    </div>
  );
}
