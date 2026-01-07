import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageSquare, TrendingUp, FileText, ArrowLeft } from "lucide-react";

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
  const [showForm, setShowForm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  const appointmentsQuery = trpc.appointments.list.useQuery({ status: "active" }, { retry: false });
  const dashboardStatsQuery = trpc.dashboard.salesStats.useQuery(undefined, { retry: false });

  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("案件を登録しました");
      reset();
      setShowForm(false);
      appointmentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "エラーが発生しました");
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  const stats = dashboardStatsQuery.data || { totalSubmitted: 0, activeCount: 0, closedCount: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-blue-500/30 py-4 px-8 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">LUX SALES</h1>
            <p className="text-xs text-gray-400">営業部隊ダッシュボード</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()} className="p-2 text-gray-300 hover:text-blue-400 transition-colors" title="戻る">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <NotificationBell />
            <button onClick={() => navigate("/messages")} className="p-2 text-gray-300 hover:text-blue-400 transition-colors" title="メッセージ">
              <MessageSquare className="h-5 w-5" />
            </button>
            <button onClick={handleLogout} disabled={isLoggingOut} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {isLoggingOut ? "..." : "ログアウト"}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-8">
        {/* Welcome */}
        <div className="bg-slate-800/30 border border-blue-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-2">ようこそ、{user.name || "営業部隊"}様</h2>
          <p className="text-gray-300 text-sm">このダッシュボードから案件の投入や管理を行うことができます。</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-blue-400">{stats.totalSubmitted}</div>
                <div className="text-gray-400 text-xs">投入済み案件</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🌐</div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.activeCount}</div>
                <div className="text-gray-400 text-xs">公開中</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-yellow-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{stats.closedCount}</div>
                <div className="text-gray-400 text-xs">成約数</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-purple-400">今月</div>
                <div className="text-gray-400 text-xs">月別統計</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            <span className="text-xl">📝</span> {showForm ? "フォームを閉じる" : "新規案件を投入"}
          </button>
          <button onClick={() => navigate("/messages")} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            <MessageSquare className="h-5 w-5" /> 管理者にメッセージ
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">新規案件登録</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">タイトル *</label>
                <input {...register("title")} type="text" className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" placeholder="案件タイトル" />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">業種 *</label>
                  <input {...register("industry")} type="text" className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" placeholder="製造業" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">規模 *</label>
                  <select {...register("scale")} className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white">
                    <option value="">選択</option>
                    <option value="small">小</option>
                    <option value="medium">中</option>
                    <option value="large">大</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">エリア *</label>
                  <input {...register("area")} type="text" className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" placeholder="東京都" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">入札設定価格 (円) *</label>
                  <input {...register("bidPrice", { valueAsNumber: true })} type="number" className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" placeholder="50000" />
                  <p className="text-xs text-gray-500 mt-1">電力会社への販売価格</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">月額料金/使用量 (円) *</label>
                  <input {...register("monthlyAmount", { valueAsNumber: true })} type="number" className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" placeholder="500000" />
                  <p className="text-xs text-gray-500 mt-1">案件の規模感</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">詳細説明</label>
                <textarea {...register("description")} className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white h-20" placeholder="オプション" />
              </div>
              <button type="submit" disabled={createAppointmentMutation.isPending} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50">
                {createAppointmentMutation.isPending ? "登録中..." : "✅ 登録する"}
              </button>
            </form>
          </div>
        )}

        {/* Appointments List */}
        <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">投入済み案件一覧</h3>
          {appointmentsQuery.isLoading ? (
            <div className="text-center text-gray-400 py-8">読み込み中...</div>
          ) : appointmentsQuery.data?.length === 0 ? (
            <div className="text-center text-gray-400 py-8">案件がまだ登録されていません</div>
          ) : (
            <div className="space-y-3">
              {appointmentsQuery.data?.map((apt) => (
                <div key={apt.id} className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-white">{apt.title}</h4>
                    <p className="text-xs text-gray-400">{apt.industry} | {apt.area} | {apt.scale}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-400 font-bold">¥{apt.price?.toLocaleString()}</div>
                    <span className={`text-xs px-2 py-1 rounded ${apt.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {apt.status === 'active' ? '公開中' : apt.status}
                    </span>
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
