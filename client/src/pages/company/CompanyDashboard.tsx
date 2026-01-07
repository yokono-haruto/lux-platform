import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageSquare, TrendingUp, ShoppingCart, ArrowLeft } from "lucide-react";

export default function CompanyDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const appointmentsQuery = trpc.appointments.list.useQuery({ status: "active" }, { retry: false });
  const bidsQuery = trpc.bids.myBids.useQuery(undefined, { retry: false });

  const myBids = bidsQuery.data || [];
  const monthlyTotal = myBids.reduce((sum, bid) => sum + Number(bid.bidAmount || 0), 0);
  const monthlyCount = myBids.length;

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#000b1d] text-white">
      {/* Header */}
      <header className="bg-[#001529] border-b border-[#003a70] py-4 px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#00a3ff]">LUX MARKETPLACE</h1>
            <p className="text-xs text-gray-400">電力会社ダッシュボード</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()} className="p-2 text-gray-300 hover:text-[#00a3ff] transition-colors" title="戻る">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <NotificationBell />
            <button onClick={() => navigate("/messages")} className="p-2 text-gray-300 hover:text-[#00a3ff] transition-colors" title="メッセージ">
              <MessageSquare className="h-5 w-5" />
            </button>
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

      <main className="max-w-7xl mx-auto py-8 px-8">
        {/* Welcome */}
        <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-2">ようこそ、{user.name || "電力会社"}様</h2>
          <p className="text-gray-400 text-sm">公開されている案件を閲覧し、入札することができます。</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📋</div>
              <div>
                <div className="text-2xl font-bold text-[#00a3ff]">{appointmentsQuery.data?.length || 0}</div>
                <div className="text-gray-400 text-xs">公開案件数</div>
              </div>
            </div>
          </div>
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <div className="text-2xl font-bold text-green-400">{monthlyCount}</div>
                <div className="text-gray-400 text-xs">今月の入札数</div>
              </div>
            </div>
          </div>
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-purple-400">{myBids.filter(b => b.status === 'accepted').length}</div>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button onClick={() => navigate("/marketplace")} className="bg-[#00a3ff] hover:bg-[#0088cc] text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            <span className="text-xl">🔍</span> 案件を探す
          </button>
          <button onClick={() => navigate("/messages")} className="bg-[#001529] border border-[#003a70] hover:border-[#00a3ff] text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            <MessageSquare className="h-5 w-5" /> メッセージ
          </button>
        </div>

        {/* Public Appointments */}
        <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">公開案件一覧</h3>
          {appointmentsQuery.isLoading ? (
            <div className="text-center text-gray-400 py-8">読み込み中...</div>
          ) : appointmentsQuery.data?.length === 0 ? (
            <div className="text-center text-gray-400 py-8">現在公開されている案件はありません</div>
          ) : (
            <div className="space-y-3">
              {appointmentsQuery.data?.slice(0, 5).map((apt) => (
                <div key={apt.id} className="bg-[#000b1d] border border-[#003a70] rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-white">{apt.title}</h4>
                    <p className="text-xs text-gray-400">{apt.industry} | {apt.area} | {apt.scale}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[#00a3ff] font-bold">¥{apt.price?.toLocaleString()}</div>
                    <button onClick={() => navigate("/marketplace")} className="text-xs text-[#00a3ff] hover:underline">詳細を見る</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
