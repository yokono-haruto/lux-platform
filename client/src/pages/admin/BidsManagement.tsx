import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Home, ArrowLeft, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

export default function BidsManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<string>("all");

  const bidsQuery = trpc.bids.list.useQuery(undefined, { retry: false });
  const updateBidMutation = trpc.bids.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("ステータスを更新しました");
      bidsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  const bids = bidsQuery.data || [];
  const filteredBids = filter === "all" ? bids : bids.filter(b => b.status === filter);

  const handleStatusChange = (bidId: number, status: string) => {
    updateBidMutation.mutate({ bidId, status });
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <header className="border-b border-cyan-500/30 py-4 px-8 bg-[#0f2847] sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/admin/dashboard")} className="p-2 text-gray-400 hover:text-cyan-400">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">入札対応管理</h1>
              <p className="text-xs text-gray-400">Bid Management</p>
            </div>
          </div>
          <button onClick={() => navigate("/")} className="p-2 text-gray-400 hover:text-green-400">
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto py-8 px-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "すべて", color: "cyan" },
            { value: "pending", label: "未対応", color: "yellow" },
            { value: "accepted", label: "承認済", color: "green" },
            { value: "rejected", label: "却下", color: "red" },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === tab.value
                  ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/50`
                  : "bg-slate-800 text-gray-400 border border-slate-700 hover:border-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bids List */}
        <div className="space-y-4">
          {bidsQuery.isLoading ? (
            <div className="text-center text-gray-400 py-12">読み込み中...</div>
          ) : filteredBids.length === 0 ? (
            <div className="text-center text-gray-400 py-12 bg-[#0f2847] rounded-xl border border-cyan-500/20">
              入札データがありません
            </div>
          ) : (
            filteredBids.map((bid) => (
              <div key={bid.id} className="bg-[#0f2847] border border-cyan-500/20 rounded-xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">入札 #{bid.id}</h3>
                    <p className="text-sm text-gray-400">案件ID: {bid.appointmentId} | 入札者ID: {bid.bidderId}</p>
                    <p className="text-cyan-400 font-bold mt-2">¥{Number(bid.bidAmount).toLocaleString()}</p>
                    {bid.notes && <p className="text-sm text-gray-500 mt-1">備考: {bid.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      bid.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      bid.status === "accepted" ? "bg-green-500/20 text-green-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {bid.status === "pending" ? "未対応" : bid.status === "accepted" ? "承認済" : "却下"}
                    </span>
                    {bid.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleStatusChange(bid.id, "accepted")}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> 承認
                        </button>
                        <button
                          onClick={() => handleStatusChange(bid.id, "rejected")}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> 却下
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
