import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
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

  const dashboardStatsQuery = trpc.dashboard.stats.useQuery();

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b-4 border-black py-6 px-8">
        <div className="container max-w-6xl flex justify-between items-center">
          <h1 className="text-headline">営業部隊ダッシュボード</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-bold">{user.name}</p>
              <p className="text-gray-600">{user.companyName}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? "ログアウト中..." : "🚪 ログアウト"}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      {dashboardStatsQuery.data && (
        <section className="py-12 px-8 border-b-4 border-black">
          <div className="container max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="card-brutalist text-center">
                <div className="text-4xl font-bold mb-2">
                  {dashboardStatsQuery.data.totalAppointments}
                </div>
                <p className="text-sm font-bold">登録案件数</p>
              </div>
              <div className="card-brutalist text-center">
                <div className="text-4xl font-bold mb-2">
                  {dashboardStatsQuery.data.activeAppointments}
                </div>
                <p className="text-sm font-bold">公開中</p>
              </div>
              <div className="card-brutalist text-center">
                <div className="text-4xl font-bold mb-2">
                  {dashboardStatsQuery.data.totalBids}
                </div>
                <p className="text-sm font-bold">入札数</p>
              </div>
              <div className="card-brutalist text-center">
                <div className="text-4xl font-bold mb-2">
                  ¥{dashboardStatsQuery.data.totalRevenue.toLocaleString()}
                </div>
                <p className="text-sm font-bold">売上</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12 px-8">
        <div className="container max-w-6xl">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-headline">登録案件一覧</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-brutalist"
            >
              {showForm ? "キャンセル" : "新規登録"}
            </button>
          </div>

          {/* Registration Form */}
          {showForm && (
            <div className="card-brutalist mb-12">
              <h3 className="text-subheading mb-8">新規案件登録</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">タイトル</label>
                  <input
                    {...register("title")}
                    type="text"
                    className="input-brutalist"
                    placeholder="案件タイトルを入力"
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">業種</label>
                    <input
                      {...register("industry")}
                      type="text"
                      className="input-brutalist"
                      placeholder="例: 製造業"
                    />
                    {errors.industry && (
                      <p className="text-red-600 text-sm mt-1">{errors.industry.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">規模</label>
                    <select {...register("scale")} className="input-brutalist">
                      <option value="">選択してください</option>
                      <option value="small">小</option>
                      <option value="medium">中</option>
                      <option value="large">大</option>
                    </select>
                    {errors.scale && (
                      <p className="text-red-600 text-sm mt-1">{errors.scale.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">エリア</label>
                    <input
                      {...register("area")}
                      type="text"
                      className="input-brutalist"
                      placeholder="例: 東京都"
                    />
                    {errors.area && (
                      <p className="text-red-600 text-sm mt-1">{errors.area.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">詳細説明</label>
                  <textarea
                    {...register("description")}
                    className="input-brutalist h-24"
                    placeholder="案件の詳細を入力（オプション）"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                  className="btn-brutalist w-full"
                >
                  {createAppointmentMutation.isPending ? "登録中..." : "登録する"}
                </button>
              </form>
            </div>
          )}

          {/* Appointments List */}
          <div className="space-y-4">
            {appointmentsQuery.isLoading ? (
              <div className="text-center py-12">
                <p className="text-lg">読み込み中...</p>
              </div>
            ) : appointmentsQuery.data && appointmentsQuery.data.length > 0 ? (
              appointmentsQuery.data.map((apt) => (
                <div key={apt.id} className="card-brutalist">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-subheading mb-2">{apt.title}</h3>
                      <div className="flex gap-4 text-sm font-bold">
                        <span>業種: {apt.industry}</span>
                        <span>規模: {apt.scale}</span>
                        <span>エリア: {apt.area}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-4 py-2 border-2 border-black font-bold text-sm">
                        {apt.status === "active" ? "公開中" : "終了"}
                      </span>
                    </div>
                  </div>
                  {apt.description && (
                    <p className="text-base mb-4">{apt.description}</p>
                  )}
                  <div className="text-xs text-gray-600">
                    登録日: {new Date(apt.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 card-brutalist">
                <p className="text-lg">案件がまだ登録されていません</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
