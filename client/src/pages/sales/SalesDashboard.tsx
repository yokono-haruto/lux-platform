import { useLocation } from "wouter";
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
import { MessageSquare, TrendingUp, FileText, ArrowLeft, User, Home } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showMonthlyDetails, setShowMonthlyDetails] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStatLabel, setSelectedStatLabel] = useState<string | null>(null);

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
    onError: () => {},
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

  // 月別データ生成
  const monthlyData = [
    { month: "8月", submitted: 5, closed: 2 },
    { month: "9月", submitted: 8, closed: 4 },
    { month: "10月", submitted: 12, closed: 6 },
    { month: "11月", submitted: 15, closed: 8 },
    { month: "12月", submitted: stats.totalSubmitted || 10, closed: stats.closedCount || 5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-blue-500/30 py-4 px-8 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">LUX SALES</h1>
            <p className="text-xs text-gray-400">営業部隊ダッシュボード</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sales/dashboard">
              <a className="p-2 text-gray-300 hover:text-blue-400 transition-colors" title="ホーム">
                <Home className="h-5 w-5" />
              </a>
            </Link>
            <button onClick={() => window.history.back()} className="p-2 text-gray-300 hover:text-blue-400 transition-colors" title="戻る">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <NotificationBell />
            <MessageBell />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-400">{user.name}</p>
                <p className="text-xs text-gray-400">営業部隊</p>
              </div>
            </div>
            <button onClick={handleLogout} disabled={isLoggingOut} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {isLoggingOut ? "..." : "ログアウト"}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-8 flex-1">
        {/* Welcome */}
        <div className="bg-slate-800/30 border border-blue-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-2">ようこそ、{user.name || "営業部隊"}様</h2>
          <p className="text-gray-300 text-sm">このダッシュボードから案件の投入や管理を行うことができます。</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div 
            onClick={() => {
              setSelectedStatLabel("投入済み案件");
              setShowStatsModal(true);
            }}
            className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-5 cursor-pointer hover:border-blue-500/60 transition-all">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-blue-400">{stats.totalSubmitted}</div>
                <div className="text-gray-400 text-xs">投入済み案件</div>
              </div>
            </div>
          </div>
          <div 
            onClick={() => {
              setSelectedStatLabel("公開中");
              setShowStatsModal(true);
            }}
            className="bg-slate-800/50 border border-green-500/30 rounded-xl p-5 cursor-pointer hover:border-green-500/60 transition-all">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🌐</div>
              <div>
                <div className="text-2xl font-bold text-green-400">{stats.activeCount}</div>
                <div className="text-gray-400 text-xs">公開中</div>
              </div>
            </div>
          </div>
          <div 
            onClick={() => {
              setSelectedStatLabel("成約済み");
              setShowStatsModal(true);
            }}
            className="bg-slate-800/50 border border-orange-500/30 rounded-xl p-5 cursor-pointer hover:border-orange-500/60 transition-all">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{stats.closedCount}</div>
                <div className="text-gray-400 text-xs">成約済み</div>
              </div>
            </div>
          </div>
          <div 
            onClick={() => {
              setSelectedStatLabel("月別統計");
              setShowStatsModal(true);
            }}
            className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-5 cursor-pointer hover:border-purple-500/60 transition-all">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-purple-400">今月</div>
                <div className="text-gray-400 text-xs">月別統計</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-blue-400">月別投入案件数</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} onClick={(data) => {
                if (data && data.activePayload) {
                  setSelectedMonth(data.activePayload[0].payload.month);
                  setShowMonthlyDetails(true);
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }} />
                <Bar dataKey="submitted" fill="#3b82f6" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 text-blue-400">月別成約数</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData} onClick={(data) => {
                if (data && data.activePayload) {
                  setSelectedMonth(data.activePayload[0].payload.month);
                  setShowMonthlyDetails(true);
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }} />
                <Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} cursor="pointer" />
              </LineChart>
            </ResponsiveContainer>
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
            <h3 className="text-lg font-bold mb-4">新規案件登録</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">タイトル</label>
                  <input {...register("title")} className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">業種</label>
                  <input {...register("industry")} className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">規模</label>
                  <select {...register("scale")} className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white">
                    <option value="">選択してください</option>
                    <option value="small">小</option>
                    <option value="medium">中</option>
                    <option value="large">大</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">エリア</label>
                  <input {...register("area")} className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">入札設定価格（円）</label>
                  <input type="number" {...register("bidPrice", { valueAsNumber: true })} className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">月額料金（円）</label>
                  <input type="number" {...register("monthlyAmount", { valueAsNumber: true })} className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">説明</label>
                <textarea {...register("description")} rows={3} className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white" />
              </div>
              <button type="submit" disabled={createMutation.isPending} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50">
                {createMutation.isPending ? "登録中..." : "登録する"}
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />

      {/* Stats Modal */}
      {showStatsModal && selectedStatLabel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-400">{selectedStatLabel}の詳細</h3>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedStatLabel(null);
                }}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-400">現在、該当するデータがありません。</p>
              <p className="text-gray-500 text-sm mt-2">案件が登録されると、ここに表示されます。</p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Details Modal */}
      {showMonthlyDetails && selectedMonth && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-400">{selectedMonth}の案件一覧</h3>
              <button
                onClick={() => {
                  setShowMonthlyDetails(false);
                  setSelectedMonth(null);
                }}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-700/50 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-bold text-lg mb-2">サンプル案件 1</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">業種</p>
                    <p className="font-semibold">製造業</p>
                  </div>
                  <div>
                    <p className="text-gray-400">ステータス</p>
                    <p className="font-semibold text-green-400">成約済み</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-400 py-4">実際の案件データがここに表示されます</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
