import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageBell } from "@/components/MessageBell";
import { Footer } from "@/components/Footer";
import { 
  FileText, 
  TrendingUp, 
  ShoppingCart,
  Clock,
  Search,
  MessageSquare,
  LogOut,
  ChevronRight,
  Zap,
  DollarSign
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function CompanyDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const bidsQuery = trpc.bids.getByUser.useQuery(undefined, {
    retry: false,
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const bids = bidsQuery.data || [];
  const pendingBids = bids.filter(b => b.status === "pending").length;
  const acceptedBids = bids.filter(b => b.status === "accepted").length;
  const monthlyTotal = bids.filter(b => b.status === "accepted").reduce((sum, b) => sum + (Number(b.bidAmount) || 0), 0);

  const monthlyData = [
    { month: "8月", amount: 120000, count: 3 },
    { month: "9月", amount: 180000, count: 5 },
    { month: "10月", amount: 250000, count: 7 },
    { month: "11月", amount: 320000, count: 9 },
    { month: "12月", amount: monthlyTotal || 150000, count: acceptedBids || 4 },
  ];

  const statCards = [
    { label: "入札済み案件", value: bids.length, icon: FileText, color: "indigo" },
    { label: "入札中", value: pendingBids, icon: Clock, color: "amber" },
    { label: "購入済み", value: acceptedBids, icon: ShoppingCart, color: "emerald" },
    { label: "今月の購入額", value: `¥${monthlyTotal.toLocaleString()}`, icon: DollarSign, color: "purple" },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400" },
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
    };
    return colors[color] || colors.indigo;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <span className="badge-success">成約</span>;
      case "rejected":
        return <span className="badge-error">却下</span>;
      default:
        return <span className="badge-warning">入札中</span>;
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5">
        <div className="container max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LUX Marketplace</h1>
                <p className="text-xs text-white/40">電力会社ダッシュボード</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <MessageBell />
              
              <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || "C"}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/40">{user?.companyName || "電力会社"}</p>
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
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            ようこそ、{user?.name}さん
          </h2>
          <p className="text-white/50">
            公開中の案件を閲覧し、入札を行いましょう
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => {
            const colors = getColorClasses(stat.color);
            const Icon = stat.icon;
            return (
              <div key={i} className="stat-card">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">月別購入金額</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15,15,35,0.9)", 
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px"
                  }}
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, "購入金額"]}
                />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="url(#colorAmount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">月別購入件数</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15,15,35,0.9)", 
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px"
                  }}
                  formatter={(value: number) => [`${value}件`, "購入件数"]}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => navigate("/marketplace")}
            className="btn-premium flex items-center justify-center gap-3 py-5"
          >
            <Search className="w-5 h-5" />
            <span>案件を探す</span>
          </button>
          <button 
            onClick={() => navigate("/messages")}
            className="glass-card flex items-center justify-center gap-3 py-5 text-white hover:bg-white/5 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            <span>メッセージ</span>
          </button>
        </div>

        {/* Bid History */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">入札履歴</h3>
            {bids.length > 5 && (
              <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                すべて見る <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {bids.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50 mb-2">入札履歴はありません</p>
              <p className="text-white/30 text-sm">マーケットプレイスで案件を探して入札しましょう</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bids.slice(0, 5).map((bid: any) => (
                <div 
                  key={bid.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{bid.appointmentTitle || "案件"}</p>
                      <p className="text-sm text-white/50">入札額: ¥{Number(bid.bidAmount).toLocaleString()}</p>
                    </div>
                  </div>
                  {getStatusBadge(bid.status)}
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
