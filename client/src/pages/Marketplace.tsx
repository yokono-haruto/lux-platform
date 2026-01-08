import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AIPricePrediction } from "@/components/AIPricePrediction";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageBell } from "@/components/MessageBell";
import { Footer } from "@/components/Footer";
import { 
  ArrowLeft, 
  Search, 
  Filter,
  X,
  Building2,
  MapPin,
  DollarSign,
  CheckCircle,
  Zap,
  LogOut,
  RefreshCw
} from "lucide-react";

const bidSchema = z.object({
  bidAmount: z.number().positive("金額は正の数値である必要があります"),
  notes: z.string().optional(),
});

type BidFormData = z.infer<typeof bidSchema>;

export default function Marketplace() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  const resetFilters = () => {
    setFilters({ industry: "", scale: "", area: "", search: "", minPrice: undefined, maxPrice: undefined });
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => navigate("/company/dashboard")}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">マーケットプレイス</h1>
                <p className="text-xs text-white/40 hidden sm:block">案件を探して入札</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl border transition-all ${
                  showFilters 
                    ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' 
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <NotificationBell />
              <MessageBell />
              
              <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || "U"}
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

      {/* Search Bar */}
      <div className="border-b border-white/5 bg-black/10">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              className="input-premium pl-12"
              placeholder="案件タイトルで検索..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b border-white/5 bg-black/10">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">業種</label>
                <input
                  type="text"
                  className="input-premium text-sm py-2.5"
                  placeholder="例: 製造業"
                  value={filters.industry}
                  onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">価格 (最小)</label>
                <input
                  type="number"
                  className="input-premium text-sm py-2.5"
                  placeholder="0"
                  value={filters.minPrice || ""}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">価格 (最大)</label>
                <input
                  type="number"
                  className="input-premium text-sm py-2.5"
                  placeholder="1,000,000"
                  value={filters.maxPrice || ""}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full py-2.5 px-4 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all text-sm"
                >
                  リセット
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-500" />
            利用可能な案件
            {appointmentsQuery.data && (
              <span className="text-sm text-white/40 ml-2">({appointmentsQuery.data.length}件)</span>
            )}
          </h2>
          <button
            onClick={() => appointmentsQuery.refetch()}
            disabled={appointmentsQuery.isFetching}
            className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${appointmentsQuery.isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Appointments Grid */}
        {appointmentsQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Search className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-white/50">案件を読み込み中...</p>
          </div>
        ) : appointmentsQuery.error ? (
          <div className="text-center py-12">
            <p className="text-rose-400">エラーが発生しました</p>
          </div>
        ) : appointmentsQuery.data && appointmentsQuery.data.length === 0 ? (
          <div className="text-center py-12 glass-card">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50 mb-2">該当する案件が見つかりませんでした</p>
            <p className="text-white/30 text-sm">検索条件を変更してお試しください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {appointmentsQuery.data?.map((appointment) => {
              const userBid = userBidsQuery.data?.find((bid) => bid.appointmentId === appointment.id);
              const hasBid = !!userBid;

              return (
                <div
                  key={appointment.id}
                  className="glass-card p-5 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-white">{appointment.title}</h3>
                    <span className="badge-info flex-shrink-0">{appointment.scale}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-white/30" />
                      <div>
                        <p className="text-xs text-white/40">業種</p>
                        <p className="text-sm text-white">{appointment.industry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white/30" />
                      <div>
                        <p className="text-xs text-white/40">エリア</p>
                        <p className="text-sm text-white">{appointment.area}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 mb-4">
                    <div>
                      <p className="text-xs text-white/40">入札設定価格</p>
                      <p className="text-xl font-bold text-indigo-400">¥{(appointment.price || 0).toLocaleString()}</p>
                    </div>
                    {appointment.monthlyAmount && appointment.monthlyAmount > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-white/40">月額料金</p>
                        <p className="text-lg font-semibold text-emerald-400">¥{appointment.monthlyAmount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {hasBid ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 text-emerald-400 font-medium mb-2">
                        <CheckCircle className="w-4 h-4" />
                        入札済み
                      </div>
                      <p className="text-sm text-white/70">
                        入札額: ¥{(userBid.bidAmount || 0).toLocaleString()}
                      </p>
                      {userBid.notes && (
                        <p className="text-xs text-white/50 mt-1">備考: {userBid.notes}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBidClick(appointment.id)}
                      className="w-full btn-premium py-3"
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
      </main>

      <Footer />

      {/* Bid Form Modal */}
      {showBidForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 sm:p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">入札情報を入力</h3>
              <button
                onClick={() => {
                  setShowBidForm(false);
                  setSelectedAppointmentId(null);
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">入札額 (円) *</label>
                <input
                  type="number"
                  {...register("bidAmount", { valueAsNumber: true })}
                  className="input-premium"
                  placeholder="例: 500000"
                />
                {errors.bidAmount && (
                  <p className="text-rose-400 text-xs mt-1">{errors.bidAmount.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">備考（任意）</label>
                <textarea
                  {...register("notes")}
                  className="input-premium min-h-[100px]"
                  placeholder="入札に関する補足事項があれば入力してください"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBidForm(false);
                    setSelectedAppointmentId(null);
                  }}
                  className="py-3 px-6 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all order-2 sm:order-1"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={createBidMutation.isPending}
                  className="btn-premium py-3 disabled:opacity-50 order-1 sm:order-2 sm:ml-auto"
                >
                  {createBidMutation.isPending ? "送信中..." : "入札を確定"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
