import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AIPricePrediction } from "@/components/AIPricePrediction";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageSquare, ArrowLeft, Home } from "lucide-react";

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
    search: "",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
  });
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [showBidForm, setShowBidForm] = useState(false);

  const appointmentsQuery = trpc.appointments.list.useQuery({
    industry: filters.industry || undefined,
    scale: filters.scale || undefined,
    area: filters.area || undefined,
    search: filters.search || undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  });
  const userBidsQuery = trpc.bids.getByUser.useQuery();

  const createBidMutation = trpc.bids.create.useMutation({
    onSuccess: () => {
      toast.success("入札が完了しました");
      setShowBidForm(false);
      setSelectedAppointmentId(null);
      userBidsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "入札に失敗しました");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
  });

  const onSubmit = (data: BidFormData) => {
    if (!selectedAppointmentId) return;
    createBidMutation.mutate({
      appointmentId: selectedAppointmentId,
      bidAmount: data.bidAmount,
      notes: data.notes,
    });
  };

  const handleBidClick = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setShowBidForm(true);
    reset();
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2847] to-[#1a3a5c]">
      {/* Header */}
      <header className="border-b border-cyan-500/20 bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl py-4 px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-1">LUX マーケットプレイス</h1>
            <p className="text-sm text-gray-400">アポイント取引プラットフォーム</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-300 hover:text-cyan-400 transition-colors"
              title="戻る"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate(`/${user.role}/dashboard`)}
              className="p-2 text-gray-300 hover:text-cyan-400 transition-colors"
              title="ホーム"
            >
              <Home className="h-5 w-5" />
            </button>
            <NotificationBell />
            <button
              onClick={() => navigate("/messages")}
              className="p-2 text-gray-300 hover:text-cyan-400 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider">キーワード検索</label>
              <input
                type="text"
                className="w-full bg-[#0a1628] border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:border-cyan-400 outline-none transition-all"
                placeholder="案件タイトルで検索..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
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
              <label className="block text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider">価格範囲 (最小)</label>
              <input
                type="number"
                className="w-full bg-[#0a1628] border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:border-cyan-400 outline-none transition-all"
                placeholder="0"
                value={filters.minPrice || ""}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider">価格範囲 (最大)</label>
              <input
                type="number"
                className="w-full bg-[#0a1628] border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:border-cyan-400 outline-none transition-all"
                placeholder="1,000,000"
                value={filters.maxPrice || ""}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ industry: "", scale: "", area: "", search: "", minPrice: undefined, maxPrice: undefined })}
                className="w-full px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all font-bold"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Appointments List */}
      <section className="py-8 px-8">
        <div className="container max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-gradient-to-b from-cyan-400 to-blue-500"></div>
            <h2 className="text-2xl font-bold text-white">利用可能な案件</h2>
          </div>

          {appointmentsQuery.isLoading ? (
            <div className="text-center py-12 text-gray-400">読み込み中...</div>
          ) : appointmentsQuery.error ? (
            <div className="text-center py-12 text-red-400">エラーが発生しました</div>
          ) : appointmentsQuery.data && appointmentsQuery.data.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border border-dashed border-cyan-500/30 rounded-lg">
              該当する案件が見つかりませんでした
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appointmentsQuery.data?.map((appointment) => {
                const userBid = userBidsQuery.data?.find((bid) => bid.appointmentId === appointment.id);
                const hasBid = !!userBid;

                return (
                  <div
                    key={appointment.id}
                    className="bg-[#0a1628]/60 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white">{appointment.title}</h3>
                      <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-bold text-cyan-400">
                        {appointment.scale}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4 text-sm">
                      <p className="text-gray-300">
                        <span className="text-cyan-400 font-bold">業種:</span> {appointment.industry}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-cyan-400 font-bold">エリア:</span> {appointment.area}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-cyan-400 font-bold">入札設定価格:</span> ¥{appointment.price.toLocaleString()}
                      </p>
                      {appointment.monthlyAmount && (
                        <p className="text-gray-300">
                          <span className="text-cyan-400 font-bold">月額料金:</span> ¥{appointment.monthlyAmount.toLocaleString()}
                        </p>
                      )}
                      <p className="text-gray-300">
                        <span className="text-cyan-400 font-bold">ステータス:</span> {appointment.status}
                      </p>
                    </div>

                    {hasBid ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="text-green-400 font-bold mb-2">✓ 入札済み</p>
                        <p className="text-sm text-gray-300">
                          入札額: ¥{userBid.bidAmount.toLocaleString()}
                        </p>
                        {userBid.notes && (
                          <p className="text-sm text-gray-400 mt-1">備考: {userBid.notes}</p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBidClick(appointment.id)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-bold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/20"
                      >
                        入札する
                      </button>
                    )}

                    <AIPricePrediction
                      industry={appointment.industry}
                      scale={appointment.scale}
                      area={appointment.area}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bid Form Modal */}
      {showBidForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] border border-cyan-500/30 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">入札情報を入力</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-cyan-300 mb-2">入札額 *</label>
                <input
                  type="number"
                  {...register("bidAmount", { valueAsNumber: true })}
                  className="w-full bg-[#0f2847] border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:border-cyan-400 outline-none transition-all"
                  placeholder="例: 500000"
                />
                {errors.bidAmount && (
                  <p className="text-red-400 text-sm mt-1">{errors.bidAmount.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-cyan-300 mb-2">備考（任意）</label>
                <textarea
                  {...register("notes")}
                  className="w-full bg-[#0f2847] border border-cyan-500/30 rounded-lg px-4 py-2 text-white focus:border-cyan-400 outline-none transition-all h-24"
                  placeholder="補足情報があれば入力してください"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBidForm(false);
                    setSelectedAppointmentId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500/10 border border-gray-500/30 rounded-lg text-gray-400 hover:bg-gray-500/20 hover:border-gray-500/50 transition-all font-bold"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={createBidMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-bold hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createBidMutation.isPending ? "送信中..." : "入札する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
