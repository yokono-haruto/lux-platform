import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const appointmentSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  industry: z.string().min(1, "業種は必須です"),
  scale: z.string().min(1, "規模は必須です"),
  area: z.string().min(1, "エリアは必須です"),
  price: z.number().min(0, "価格は0以上である必要があります"),
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

  const appointmentsQuery = trpc.appointments.list.useQuery({
    status: "active",
  });

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

  const dashboardStatsQuery = trpc.dashboard.salesStats.useQuery();

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-blue-500/30 py-4 px-8">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">LUX SALES</h1>
            <p className="text-sm text-gray-400">営業部隊ダッシュボード</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            🛡️ ログアウト
          </button>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="py-8 px-8 bg-slate-800/30 border-b border-blue-500/20">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">ようこそ、営業部隊様</h2>
          <p className="text-gray-300">このダッシュボードから案件の投入や管理を行うことができます。</p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8 px-8">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📝</div>
              <div>
                <div className="text-3xl font-bold text-blue-400">
                  {dashboardStatsQuery.data?.totalSubmitted || 0}
                </div>
                <p className="text-sm text-gray-400">投入済み案件</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 hover:border-green-400/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🌐</div>
              <div>
                <div className="text-3xl font-bold text-green-400">
                  {dashboardStatsQuery.data?.activeCount || 0}
                </div>
                <p className="text-sm text-gray-400">公開中</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-400/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💰</div>
              <div>
                <div className="text-3xl font-bold text-yellow-400">
                  {dashboardStatsQuery.data?.closedCount || 0}
                </div>
                <p className="text-sm text-gray-400">成約数</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 px-8">
        <div className="container mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">クイックアクション</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span className="text-2xl">📝</span>
              <span>{showForm ? "フォームを閉じる" : "新規案件を投入"}</span>
            </button>
            
            <button
              onClick={() => navigate("/marketplace")}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span className="text-2xl">📊</span>
              <span>案件一覧を表示</span>
            </button>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      {showForm && (
        <section className="py-8 px-8">
          <div className="container mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">新規案件登録</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">タイトル *</label>
                  <input
                    {...register("title")}
                    type="text"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="案件タイトルを入力"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">業種 *</label>
                    <input
                      {...register("industry")}
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="例: 製造業"
                    />
                    {errors.industry && (
                      <p className="text-red-400 text-sm mt-1">{errors.industry.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">規模 *</label>
                    <select 
                      {...register("scale")} 
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="small">小</option>
                      <option value="medium">中</option>
                      <option value="large">大</option>
                    </select>
                    {errors.scale && (
                      <p className="text-red-400 text-sm mt-1">{errors.scale.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">エリア *</label>
                    <input
                      {...register("area")}
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="例: 東京都"
                    />
                    {errors.area && (
                      <p className="text-red-400 text-sm mt-1">{errors.area.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">価格 (円) *</label>
                  <input
                    {...register("price", { valueAsNumber: true })}
                    type="number"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="例: 1000000"
                  />
                  {errors.price && (
                    <p className="text-red-400 text-sm mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">詳細説明</label>
                  <textarea
                    {...register("description")}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none h-32"
                    placeholder="案件の詳細を入力（オプション）"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createAppointmentMutation.isPending ? "登録中..." : "✅ 登録する"}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Appointments List */}
      <section className="py-8 px-8">
        <div className="container mx-auto">
          <h3 className="text-xl font-bold text-white mb-4">投入済み案件一覧</h3>
          <div className="space-y-4">
            {appointmentsQuery.isLoading ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl">
                <p className="text-gray-400">読み込み中...</p>
              </div>
            ) : appointmentsQuery.data && appointmentsQuery.data.length > 0 ? (
              appointmentsQuery.data.map((apt) => (
                <div key={apt.id} className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{apt.title}</h4>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full">業種: {apt.industry}</span>
                        <span className="px-3 py-1 bg-green-600/20 text-green-300 rounded-full">規模: {apt.scale}</span>
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full">エリア: {apt.area}</span>
                        <span className="px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded-full">¥{apt.price?.toLocaleString() || "未設定"}</span>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                      apt.status === "active" ? "bg-green-600/20 text-green-300" : "bg-gray-600/20 text-gray-300"
                    }`}>
                      {apt.status === "active" ? "🟢 公開中" : "⚫ 終了"}
                    </span>
                  </div>
                  {apt.description && (
                    <p className="text-gray-300 mb-4">{apt.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    登録日: {new Date(apt.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl">
                <p className="text-gray-400">案件がまだ登録されていません</p>
                <p className="text-sm text-gray-500 mt-2">「新規案件を投入」ボタンから案件を登録してください</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
