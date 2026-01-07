import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageBell } from "@/components/MessageBell";
import { Footer } from "@/components/Footer";
import { MessageSquare, TrendingUp, ShoppingCart, ArrowLeft, User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

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
    onError: () => {},
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const bids = bidsQuery.data || [];
  const monthlyPurchases = bids.filter(b => b.status === "accepted").length;
  const monthlyTotal = bids.filter(b => b.status === "accepted").reduce((sum, b) => sum + (b.bidAmount || 0), 0);

  // 月別データ生成
  const monthlyData = [
    { month: "8月", amount: 120000, count: 3 },
    { month: "9月", amount: 180000, count: 5 },
    { month: "10月", amount: 250000, count: 7 },
    { month: "11月", amount: 320000, count: 9 },
    { month: "12月", amount: monthlyTotal || 150000, count: monthlyPurchases || 4 },
  ];

  return (
    <div className="min-h-screen bg-[#000b18] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#001529] border-b border-[#003a70] py-4 px-8 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#00a3ff]">LUX MARKETPLACE</h1>
            <p className="text-xs text-gray-400">電力会社ダッシュボード</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()} className="p-2 text-gray-300 hover:text-[#00a3ff] transition-colors" title="戻る">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <NotificationBell />
            <MessageBell />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00a3ff]/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-[#00a3ff]" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#00a3ff]">{user.name}</p>
                <p className="text-xs text-gray-400">{user.companyName || "電力会社"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {isLoggingOut ? "..." : "ログアウト"}
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-8 px-8 flex-1">
        {/* Welcome */}
        <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-2">ようこそ、{user.name || "電力会社"}様</h2>
          <p className="text-gray-300 text-sm">公開されている案件を閲覧し、入札することができます。</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📋</div>
              <div>
                <div className="text-2xl font-bold text-[#00a3ff]">{bids.length}</div>
                <div className="text-gray-400 text-xs">入札済み案件</div>
              </div>
            </div>
          </div>
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <div className="text-2xl font-bold text-green-400">{bids.filter(b => b.status === "pending").length}</div>
                <div className="text-gray-400 text-xs">入札中</div>
              </div>
            </div>
          </div>
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-purple-400">{monthlyPurchases}</div>
                <div className="text-gray-400 text-xs">今月の購入数</div>
              </div>
            </div>
          </div>
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-yellow-400">¥{monthlyTotal.toLocaleString()}</div>
                <div className="text-gray-400 text-xs">今月の購入金額</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-[#00a3ff]">月別購入金額</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#003a70" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: "#001529", border: "1px solid #003a70" }} />
                <Bar dataKey="amount" fill="#00a3ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-[#00a3ff]">月別購入案件数</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#003a70" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: "#001529", border: "1px solid #003a70" }} />
                <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button onClick={() => navigate("/marketplace")} className="bg-[#00a3ff] hover:bg-[#0088cc] text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            <span className="text-xl">🔍</span> 案件を探す
          </button>
          <button onClick={() => navigate("/messages")} className="bg-[#001529] border border-[#003a70] hover:border-[#00a3ff] text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            <MessageSquare className="h-5 w-5" /> メッセージ
          </button>
        </div>

        {/* Bid History */}
        <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">入札履歴</h3>
          {bids.length === 0 ? (
            <p className="text-gray-400 text-center py-8">入札履歴はありません</p>
          ) : (
            <div className="space-y-3">
              {bids.slice(0, 5).map((bid: any) => (
                <div key={bid.id} className="bg-[#000b18] border border-[#003a70] rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{bid.appointmentTitle || "案件"}</p>
                    <p className="text-sm text-gray-400">入札額: ¥{bid.bidAmount?.toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    bid.status === "accepted" ? "bg-green-500/20 text-green-400" :
                    bid.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {bid.status === "accepted" ? "成約" : bid.status === "rejected" ? "却下" : "入札中"}
                  </span>
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
