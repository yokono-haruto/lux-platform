import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageBell } from "@/components/MessageBell";
import { Footer } from "@/components/Footer";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  Gavel, 
  Megaphone, 
  Wrench,
  Activity,
  TrendingUp,
  Building2,
  Briefcase,
  LogOut,
  ChevronRight,
  Zap
} from "lucide-react";

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
  const systemStatusQuery = trpc.systemStatus.getTodayStatus.useQuery();

  const actionRequiredCount = systemStatusQuery.data?.issues?.filter(issue => issue.actionRequired).length || 0;

  const stats = [
    { 
      label: "登録案件数", 
      value: dashboardStatsQuery.data?.totalAppointments || 0, 
      icon: FileText,
      color: "indigo",
      change: "+12%"
    },
    { 
      label: "公開中", 
      value: dashboardStatsQuery.data?.activeAppointments || 0, 
      icon: Activity,
      color: "emerald",
      change: "+5%"
    },
    { 
      label: "入札数", 
      value: dashboardStatsQuery.data?.totalBids || 0, 
      icon: Gavel,
      color: "amber",
      change: "+23%"
    },
    { 
      label: "営業部隊", 
      value: dashboardStatsQuery.data?.salesCount || 0, 
      icon: Briefcase,
      color: "cyan",
      change: null
    },
    { 
      label: "電力会社", 
      value: dashboardStatsQuery.data?.powerCompanyCount || 0, 
      icon: Building2,
      color: "purple",
      change: null
    },
  ];

  const menuItems = [
    {
      title: "案件データ管理",
      description: "案件の登録・編集・公開設定",
      icon: FileText,
      href: "/admin/appointments",
      color: "indigo"
    },
    {
      title: "ユーザー管理",
      description: "アカウント発行・権限管理",
      icon: Users,
      href: "/admin/users",
      color: "cyan"
    },
    {
      title: "取引・請求管理",
      description: "請求書発行・支払い確認",
      icon: CreditCard,
      href: "/admin/transactions",
      color: "emerald"
    },
    {
      title: "入札対応管理",
      description: "入札の確認・承認・却下",
      icon: Gavel,
      href: "/admin/bids",
      color: "amber"
    },
    {
      title: "一斉周知",
      description: "お知らせの配信",
      icon: Megaphone,
      href: "/admin/broadcast",
      color: "purple"
    },
    {
      title: "システム設定",
      description: "エラー監視・自動修正",
      icon: Wrench,
      href: "/admin/error-fix",
      color: "rose"
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400", icon: "text-indigo-400" },
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "text-emerald-400" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", icon: "text-amber-400" },
      cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", icon: "text-cyan-400" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", icon: "text-purple-400" },
      rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", icon: "text-rose-400" },
    };
    return colors[color] || colors.indigo;
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5">
        <div className="container max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LUX Admin</h1>
                <p className="text-xs text-white/40">Management Console</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Link href="/today-status">
                <a className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  <Activity className="w-5 h-5" />
                  {actionRequiredCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {actionRequiredCount}
                    </span>
                  )}
                </a>
              </Link>
              <NotificationBell />
              <MessageBell />
              
              <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || "A"}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/40">管理者</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            おかえりなさい、{user?.name}さん
          </h2>
          <p className="text-white/50">
            本日のシステム状況とタスクを確認しましょう
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {stats.map((stat, i) => {
            const colors = getColorClasses(stat.color);
            const Icon = stat.icon;
            return (
              <div 
                key={i} 
                className="stat-card group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  {stat.change && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-500" />
            <h3 className="text-xl font-bold text-white">統計グラフ</h3>
          </div>
          <div className="glass-card p-6">
            <DashboardCharts />
          </div>
        </div>

        {/* Quick Menu */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-500" />
            <h3 className="text-xl font-bold text-white">クイックメニュー</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item, i) => {
              const colors = getColorClasses(item.color);
              const Icon = item.icon;
              return (
                <Link key={i} href={item.href}>
                  <a className="glass-card p-6 group flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-white/50 mb-3">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-1 text-sm font-medium text-indigo-400">
                        <span>開く</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
