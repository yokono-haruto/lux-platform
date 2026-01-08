import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageBell } from "@/components/MessageBell";
import { Footer } from "@/components/Footer";
import { 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Plus,
  MessageSquare,
  LogOut,
  ChevronRight,
  Zap,
  X
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";

const appointmentSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  industry: z.string().min(1, "業種は必須です"),
  scale: z.string().min(1, "規模は必須です"),
  area: z.string().min(1, "エリアは必須です"),
  bidPrice: z.number().min(0, "入札設定価格は0以上"),
  monthlyAmount: z.number().min(0, "月額料金は0以上"),
  description: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function SalesDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { bidPrice: 0, monthlyAmount: 0 },
  });

  const dashboardStatsQuery = trpc.dashboard.salesStats.useQuery(undefined, {
    retry: false,
  });

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("案件を登録しました");
      reset();
      setShowForm(false);
      dashboardStatsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const onSubmit = (data: AppointmentFormData) => createMutation.mutate(data);

  if (!user) {
    navigate("/login");
    return null;
  }

  const stats = dashboardStatsQuery.data || { totalSubmitted: 0, activeCount: 0, closedCount: 0 };

  const monthlyData = [
    { month: "8月", submitted: 5, closed: 2 },
    { month: "9月", submitted: 8, closed: 4 },
    { month: "10月", submitted: 12, closed: 6 },
    { month: "11月", submitted: 15, closed: 8 },
    { month: "12月", submitted: stats.totalSubmitted || 10, closed: stats.closedCount || 5 },
  ];

  const statCards = [
    { label: "投入済み案件", value: stats.totalSubmitted, icon: FileText, color: "indigo" },
    { label: "公開中", value: stats.activeCount, icon: Clock, color: "emerald" },
    { label: "成約済み", value: stats.closedCount, icon: CheckCircle, color: "amber" },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400" },
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
    };
    return colors[color] || colors.indigo;
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5">
        <div className="container max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LUX Sales</h1>
                <p className="text-xs text-white/40">営業部隊ダッシュボード</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <MessageBell />
              
              <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || "S"}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/40">営業部隊</p>
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
            案件の投入状況と成約実績を確認しましょう
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">月別投入案件数</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
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
                />
                <Area type="monotone" dataKey="submitted" stroke="#6366f1" fill="url(#colorSubmitted)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">月別成約数</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
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
                />
                <Area type="monotone" dataKey="closed" stroke="#10b981" fill="url(#colorClosed)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => setShowForm(true)}
            className="btn-premium flex items-center justify-center gap-3 py-5"
          >
            <Plus className="w-5 h-5" />
            <span>新規案件を投入</span>
          </button>
          <button 
            onClick={() => navigate("/messages")}
            className="glass-card flex items-center justify-center gap-3 py-5 text-white hover:bg-white/5 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            <span>管理者にメッセージ</span>
          </button>
        </div>
      </main>

      <Footer />

      {/* New Appointment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">新規案件登録</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">タイトル *</label>
                  <input {...register("title")} className="input-premium" placeholder="案件タイトル" />
                  {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">業種 *</label>
                  <input {...register("industry")} className="input-premium" placeholder="例: 製造業" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">規模 *</label>
                  <select {...register("scale")} className="input-premium">
                    <option value="">選択してください</option>
                    <option value="small">小規模</option>
                    <option value="medium">中規模</option>
                    <option value="large">大規模</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">エリア *</label>
                  <input {...register("area")} className="input-premium" placeholder="例: 東京都" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">入札設定価格 (円)</label>
                  <input 
                    type="number" 
                    {...register("bidPrice", { valueAsNumber: true })} 
                    className="input-premium" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">月額料金 (円)</label>
                  <input 
                    type="number" 
                    {...register("monthlyAmount", { valueAsNumber: true })} 
                    className="input-premium" 
                    placeholder="0" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">詳細説明</label>
                <textarea 
                  {...register("description")} 
                  className="input-premium min-h-[100px]" 
                  placeholder="案件の詳細を入力してください"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 btn-premium disabled:opacity-50"
                >
                  {createMutation.isPending ? "登録中..." : "案件を登録"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
