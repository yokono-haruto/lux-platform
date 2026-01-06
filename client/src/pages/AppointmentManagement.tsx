import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AppointmentManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    industry: "",
    scale: "",
    area: "",
    price: 0,
    description: "",
  });

  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  const appointmentsQuery = trpc.appointments.list.useQuery({});
  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("アポイント案件を作成しました");
      setFormData({
        title: "",
        industry: "",
        scale: "",
        area: "",
        price: 0,
        description: "",
      });
      setShowCreateForm(false);
      appointmentsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "案件作成に失敗しました");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAppointmentMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/30 py-6 px-8 bg-gradient-to-r from-[#0a1628] to-[#0f2847]">
        <div className="container max-w-6xl flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-1">アポイント案件管理</h1>
            <p className="text-sm text-gray-400">LUX アポイント取引プラットフォーム</p>
          </div>
          <div className="text-sm text-right">
            <p className="font-bold text-cyan-300">{user.name}</p>
            <p className="text-gray-400">管理者</p>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto py-8 px-8">
        {/* Create Button */}
        <div className="mb-8 flex justify-end">
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/50"
            >
              + 新規案件作成
            </button>
          )}
          {showCreateForm && (
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-all"
            >
              キャンセル
            </button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-12 bg-[#0f2847] border border-cyan-500/30 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">新規アポイント案件作成</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-cyan-300 mb-2">
                    案件タイトル *
                  </label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                    placeholder="例: 東京都内の大手企業へのアポイント"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">
                    業種 *
                  </label>
                  <Input
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                    placeholder="例: 製造業、IT、金融"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">
                    企業規模 *
                  </label>
                  <Input
                    required
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                    placeholder="例: 大企業、中小企業"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">
                    地域 *
                  </label>
                  <Input
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                    placeholder="例: 東京都、大阪府"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">
                    アポイント価格 (JPY) *
                  </label>
                  <Input
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400 font-bold text-cyan-400"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-cyan-300 mb-2">
                  詳細説明
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400 min-h-[120px]"
                  placeholder="案件の詳細情報を入力してください"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/50 disabled:opacity-50"
                >
                  {createAppointmentMutation.isPending ? "作成中..." : "案件を作成"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appointments List */}
        <div className="bg-[#0f2847] border border-cyan-500/30 rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">登録済みアポイント案件</h2>
          {appointmentsQuery.isLoading ? (
            <div className="text-center py-12 text-gray-400">読み込み中...</div>
          ) : appointmentsQuery.data && appointmentsQuery.data.length > 0 ? (
            <div className="space-y-4">
              {appointmentsQuery.data.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="bg-[#0a1628] border border-cyan-500/20 rounded-lg p-6 hover:border-cyan-400/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-cyan-300">{appointment.title}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-400 font-bold">¥{appointment.price.toLocaleString()}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          appointment.status === "active"
                            ? "bg-green-500/20 text-green-400 border border-green-500/50"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/50"
                        }`}
                      >
                        {appointment.status === "active" ? "公開中" : "非公開"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">業種</p>
                      <p className="text-sm text-white font-medium">{appointment.industry}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">規模</p>
                      <p className="text-sm text-white font-medium">{appointment.scale}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">地域</p>
                      <p className="text-sm text-white font-medium">{appointment.area}</p>
                    </div>
                  </div>
                  {appointment.description && (
                    <p className="text-sm text-gray-300 mb-4">{appointment.description}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>作成日: {new Date(appointment.createdAt).toLocaleDateString("ja-JP")}</span>
                    <span>案件ID: #{appointment.id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">まだアポイント案件が登録されていません</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-bold rounded-lg transition-all border border-cyan-500/50"
              >
                最初の案件を作成する
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
