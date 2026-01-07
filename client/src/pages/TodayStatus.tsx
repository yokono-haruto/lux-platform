import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

export default function TodayStatus() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // 管理者以外はアクセス不可
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const { data: status, isLoading } = trpc.systemStatus.getTodayStatus.useQuery();

  const getHealthIcon = () => {
    if (!status) return null;
    
    switch (status.systemHealth) {
      case "healthy":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case "critical":
        return <XCircle className="w-12 h-12 text-red-500" />;
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
    if (!status) return "bg-gray-100";
    
    switch (status.systemHealth) {
      case "healthy":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "critical":
        return "bg-red-50 border-red-200";
    }
  };

  const getSeverityBadge = (severity: "info" | "warning" | "critical") => {
    switch (severity) {
      case "info":
        return "bg-blue-100 text-blue-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">状況を確認しています...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">今日の状況</h1>
            </div>
            <div className="text-sm text-gray-500">
              最終更新: {status ? new Date(status.lastUpdated).toLocaleTimeString('ja-JP') : '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* システムの健全性 */}
        <div className={`rounded-lg border-2 p-8 mb-8 ${getHealthColor()}`}>
          <div className="flex items-center space-x-4">
            {getHealthIcon()}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                システムの状態
              </h2>
              <p className="text-lg text-gray-700">{getHealthText()}</p>
            </div>
          </div>
        </div>

        {/* 本日の概要 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">本日の活動概要</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">新規案件</p>
              <p className="text-3xl font-bold text-blue-600">
                {status?.summary.newAppointmentsToday || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">件</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">新規入札</p>
              <p className="text-3xl font-bold text-green-600">
                {status?.summary.newBidsToday || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">件</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">承認待ち</p>
              <p className="text-3xl font-bold text-yellow-600">
                {status?.summary.pendingAppointments || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">件</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">公開中の案件</p>
              <p className="text-3xl font-bold text-purple-600">
                {status?.summary.activeAppointments || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">件</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">総ユーザー数</p>
              <p className="text-3xl font-bold text-indigo-600">
                {status?.summary.totalUsers || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">人</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">アクティブユーザー</p>
              <p className="text-3xl font-bold text-teal-600">
                {status?.summary.activeUsers || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">人</p>
            </div>
          </div>
        </div>

        {/* 重要事項・判断が必要な項目 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            対応が必要な事項
          </h3>
          
          {!status?.issues || status.issues.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">
                現在、対応が必要な問題はありません
              </p>
              <p className="text-gray-600">
                システムは正常に稼働しています
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {status.issues.map((issue, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityBadge(issue.severity)}`}>
                          {issue.severity === "info" && "情報"}
                          {issue.severity === "warning" && "注意"}
                          {issue.severity === "critical" && "緊急"}
                        </span>
                        {issue.actionRequired && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                            対応必要
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {issue.title}
                      </h4>
                      <p className="text-gray-700">{issue.description}</p>
                    </div>
                  </div>
                  {issue.actionRequired && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => navigate("/admin/dashboard")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        確認する
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
