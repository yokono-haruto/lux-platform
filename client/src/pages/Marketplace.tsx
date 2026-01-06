import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const bidSchema = z.object({
  bidAmount: z.number().positive("金額は正の数値である必要があります"),
  notes: z.string().optional(),
});

type BidFormData = z.infer<typeof bidSchema>;

export default function Marketplace() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  };
  const [filters, setFilters] = useState({
    industry: "",
    scale: "",
    area: "",
  });
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [showBidForm, setShowBidForm] = useState(false);

  const appointmentsQuery = trpc.appointments.list.useQuery(filters);
  const userBidsQuery = trpc.bids.getByUser.useQuery();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
  });

  const createBidMutation = trpc.bids.create.useMutation({
    onSuccess: () => {
      toast.success("入札が完了しました");
      reset();
      setShowBidForm(false);
      setSelectedAppointmentId(null);
      userBidsQuery.refetch();
      appointmentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "入札に失敗しました");
    },
  });

  const onSubmit = (data: BidFormData) => {
    if (!selectedAppointmentId) return;
    createBidMutation.mutate({
      appointmentId: selectedAppointmentId,
      bidAmount: data.bidAmount,
      notes: data.notes,
    });
  };

  if (!user) {
    navigate("/");
    return null;
  }

  const userBidIds = userBidsQuery.data?.map((bid) => bid.appointmentId) || [];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/30 py-6 px-8 bg-gradient-to-r from-[#0a1628] to-[#0f2847]">
        <div className="container max-w-6xl flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-1">LUX マーケットプレイス</h1>
            <p className="text-sm text-gray-400">アポイント取引プラットフォーム</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-bold text-cyan-300">{user.name}</p>
              <p className="text-gray-400">{user.companyName}</p>
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

      {/* Filters */}
      <section className="py-8 px-8 border-b border-cyan-500/20 bg-[#0f2847]/50">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider">業種</label>
              <input
                type="text"
                className="w-full bg-[#0a1628] border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:border-cyan-400 outline-none transition-all"
                placeholder="例: 製造業"
                value={filters.industry}
                onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider">規模</label>
              <select
                className="w-full bg-[#0a1628] border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:border-cyan-400 outline-none transition-all"
                value={filters.scale}
                onChange={(e) => setFilters({ ...filters, scale: e.target.value })}
              >
                <option value="">すべて</option>
                <option value="small">小規模</option>
                <option value="medium">中規模</option>
                <option value="large">大規模</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider">エリア</label>
              <input
                type="text"
                className="w-full bg-[#0a1628] border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:border-cyan-400 outline-none transition-all"
                placeholder="例: 東京都"
                value={filters.area}
                onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ industry: "", scale: "", area: "" })}
                className="w-full px-4 py-2 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 rounded-lg font-bold transition-all"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-8">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-cyan-400 mb-8 flex items-center">
            <span className="w-2 h-8 bg-cyan-500 mr-4 rounded-full"></span>
            利用可能な案件
          </h2>

          {/* Bid Form Modal */}
          {showBidForm && selectedAppointmentId && (
            <div className="mb-12 bg-[#0f2847] border border-cyan-500/50 rounded-xl p-8 shadow-2xl shadow-cyan-500/10 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-xl font-bold text-cyan-300 mb-6">入札フォーム</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">入札金額 (JPY)</label>
                  <input
                    {...register("bidAmount", { valueAsNumber: true })}
                    type="number"
                    className="w-full bg-[#0a1628] border border-cyan-500/30 rounded-lg px-4 py-3 text-white text-xl font-bold focus:border-cyan-400 outline-none"
                    placeholder="0"
                  />
                  {errors.bidAmount && (
                    <p className="text-red-400 text-sm mt-1">{errors.bidAmount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">備考（オプション）</label>
                  <textarea
                    {...register("notes")}
                    className="w-full bg-[#0a1628] border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 outline-none h-24"
                    placeholder="特記事項があれば入力してください"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={createBidMutation.isPending}
                    className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50"
                  >
                    {createBidMutation.isPending ? "処理中..." : "入札を確定する"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBidForm(false);
                      setSelectedAppointmentId(null);
                      reset();
                    }}
                    className="flex-1 py-3 border border-gray-600 text-gray-400 hover:bg-gray-800 rounded-lg font-bold transition-all"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Appointments List */}
          <div className="grid grid-cols-1 gap-6">
            {appointmentsQuery.isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">案件を読み込み中...</p>
              </div>
            ) : appointmentsQuery.data && appointmentsQuery.data.length > 0 ? (
              appointmentsQuery.data.map((apt) => {
                const alreadyBid = userBidIds.includes(apt.id);
                return (
                  <div key={apt.id} className="bg-[#0f2847] border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/50 transition-all group">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest border border-cyan-500/30 rounded">
                            #{apt.id}
                          </span>
                          <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{apt.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                          <span className="flex items-center gap-1">
                            <span className="text-cyan-500">●</span> 業種: {apt.industry}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-cyan-500">●</span> 規模: {apt.scale}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-cyan-500">●</span> エリア: {apt.area}
                          </span>
                        </div>
                        {apt.description && (
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{apt.description}</p>
                        )}
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                          登録日: {new Date(apt.createdAt).toLocaleDateString("ja-JP")}
                        </div>
                      </div>
                      <div className="w-full md:w-auto text-right">
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 mb-1 uppercase tracking-tighter">アポイント価格</p>
                          <p className="text-2xl font-bold text-cyan-400">¥{apt.price.toLocaleString()}</p>
                        </div>
                        {alreadyBid ? (
                          <div className="w-full md:w-32 py-3 bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-center rounded-lg text-sm ml-auto">
                            入札済み
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAppointmentId(apt.id);
                              setShowBidForm(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full md:w-32 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-center rounded-lg text-sm transition-all shadow-lg shadow-cyan-500/20 ml-auto"
                          >
                            入札する
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-[#0f2847]/30 border border-dashed border-cyan-500/30 rounded-xl">
                <p className="text-gray-400">現在、利用可能な案件はありません</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* My Bids Section */}
      <section className="py-16 px-8 border-t border-cyan-500/20 bg-[#0a1628]">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-cyan-400 mb-8 flex items-center">
            <span className="w-2 h-8 bg-cyan-500 mr-4 rounded-full"></span>
            あなたの入札履歴
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userBidsQuery.isLoading ? (
              <p className="text-gray-400">読み込み中...</p>
            ) : userBidsQuery.data && userBidsQuery.data.length > 0 ? (
              userBidsQuery.data.map((bid) => (
                <div key={bid.id} className="bg-[#0f2847]/30 border border-cyan-500/10 rounded-xl p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-cyan-500 font-bold uppercase tracking-widest mb-2">案件ID: #{bid.appointmentId}</p>
                      <p className="text-2xl font-bold text-white mb-1">¥{parseFloat(bid.bidAmount.toString()).toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${bid.status === 'accepted' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        <span className="text-sm text-gray-400 capitalize">{bid.status === 'pending' ? '審査中' : bid.status}</span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-gray-500 uppercase tracking-widest">
                      {new Date(bid.createdAt).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 bg-[#0f2847]/10 border border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-500">まだ入札履歴がありません</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
