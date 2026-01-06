import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  };

  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  const dashboardStatsQuery = trpc.dashboard.stats.useQuery();

  const stats = [
    { label: "登録案件数", value: dashboardStatsQuery.data?.totalAppointments || 0, icon: "📊" },
    { label: "公開中", value: dashboardStatsQuery.data?.activeAppointments || 0, icon: "🌐" },
    { label: "入札数", value: dashboardStatsQuery.data?.totalBids || 0, icon: "💰" },
    { label: "成約数", value: dashboardStatsQuery.data?.completedBids || 0, icon: "✅" },
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white font-sans">
      {/* Header */}
      <header className="border-b border-cyan-500/30 py-8 px-8 bg-gradient-to-r from-[#0a1628] to-[#0f2847] sticky top-0 z-50 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-cyan-400 tracking-tighter mb-1">LUX ADMIN</h1>
            <p className="text-[10px] text-cyan-500/70 uppercase tracking-[0.3em] font-bold">Management System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-cyan-300">{user?.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">System Administrator</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/10">
              🛡️
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? "ログアウト中..." : "🚪 ログアウト"}
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-12 px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#0f2847]/80 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 shadow-xl hover:border-cyan-500/50 transition-all group relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-2xl mb-4 bg-cyan-500/10 w-10 h-10 flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">{stat.icon}</div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] text-6xl opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Card */}
        {dashboardStatsQuery.data && (
          <div className="bg-gradient-to-br from-cyan-600 to-blue-800 rounded-3xl p-10 mb-16 shadow-2xl shadow-cyan-500/20 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-cyan-100 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-80">Platform Total Revenue</p>
                <p className="text-6xl sm:text-7xl font-black text-white tracking-tighter">
                  ¥{dashboardStatsQuery.data.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center min-w-[200px]">
                <p className="text-cyan-100 text-[10px] font-bold uppercase mb-1">Growth Rate</p>
                <p className="text-2xl font-bold text-white">+12.5%</p>
              </div>
            </div>
            <div className="absolute right-[-20px] top-[-20px] text-[12rem] opacity-10 rotate-12 pointer-events-none">
              💰
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-10">
          <span className="w-2 h-10 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"></span>
          <h2 className="text-3xl font-black text-white tracking-tight">クイックメニュー</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 案件管理 */}
          <Link href="/admin/appointments">
            <a className="group bg-[#0f2847] border border-cyan-500/20 rounded-2xl p-8 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all shadow-xl flex flex-col h-full">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform border border-cyan-500/20">📝</div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">案件データ管理</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-8 flex-grow">
                アポイント案件の新規登録、編集、金額設定、および公開ステータスの管理を行います。
              </p>
              <div className="flex items-center text-cyan-400 font-bold text-sm pt-6 border-t border-cyan-500/10">
                管理画面を開く <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </a>
          </Link>

          {/* ユーザー管理 */}
          <Link href="/admin/users">
            <a className="group bg-[#0f2847] border border-cyan-500/20 rounded-2xl p-8 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all shadow-xl flex flex-col h-full">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform border border-blue-500/20">👥</div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">ユーザー・電力会社管理</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-8 flex-grow">
                電力会社や営業部隊のアカウント発行、権限設定、アクティブ状態の管理を行います。
              </p>
              <div className="flex items-center text-cyan-400 font-bold text-sm pt-6 border-t border-cyan-500/10">
                管理画面を開く <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </a>
          </Link>

          {/* 取引・請求管理 */}
          <Link href="/admin/transactions">
            <a className="group bg-[#0f2847] border border-cyan-500/20 rounded-2xl p-8 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all shadow-xl flex flex-col h-full">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform border border-purple-500/20">💳</div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">取引・請求管理</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-8 flex-grow">
                成約した案件の請求状況、支払い確認、および取引履歴の管理を行います。
              </p>
              <div className="flex items-center text-cyan-400 font-bold text-sm pt-6 border-t border-cyan-500/10">
                管理画面を開く <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </a>
          </Link>
        </div>
      </main>
    </div>
  );
}
