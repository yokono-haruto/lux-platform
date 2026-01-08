import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExportButton } from "@/components/ExportButton";
import { AdminHeader } from "@/components/AdminHeader";
import { Edit, Trash2, X } from "lucide-react";

export default function AppointmentManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    industry: "",
    scale: "",
    area: "",
    bidPrice: 0,
    monthlyAmount: 0,
    description: "",
    status: "active" as "active" | "sold" | "archived",
  });

  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  const utils = trpc.useUtils();
  const appointmentsQuery = trpc.appointments.list.useQuery({});
  
  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("アポイント案件を作成しました");
      resetForm();
      appointmentsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "案件作成に失敗しました");
    },
  });

  const updateAppointmentMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      toast.success("案件を更新しました");
      resetForm();
      appointmentsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "更新に失敗しました");
    },
  });

  const deleteAppointmentMutation = trpc.appointments.delete.useMutation({
    onSuccess: () => {
      toast.success("案件を削除しました");
      appointmentsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "削除に失敗しました");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      industry: "",
      scale: "",
      area: "",
      bidPrice: 0,
      monthlyAmount: 0,
      description: "",
      status: "active",
    });
    setShowCreateForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateAppointmentMutation.mutate({ id: editingId, data: formData });
    } else {
      createAppointmentMutation.mutate(formData);
    }
  };

  const handleEdit = (apt: any) => {
    setFormData({
      title: apt.title,
      industry: apt.industry,
      scale: apt.scale,
      area: apt.area,
      bidPrice: apt.price || 0,
      monthlyAmount: apt.monthlyAmount || 0,
      description: apt.description || "",
      status: apt.status as any,
    });
    setEditingId(apt.id);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("本当にこの案件を削除しますか？")) {
      deleteAppointmentMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <AdminHeader title="アポイント案件管理" subtitle="LUX アポイント取引プラットフォーム" />

      <div className="container max-w-6xl mx-auto py-8 px-8">
        {/* Actions Bar */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            {appointmentsQuery.data && appointmentsQuery.data.length > 0 && (
              <ExportButton data={appointmentsQuery.data} filename="appointments" />
            )}
          </div>
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/50"
            >
              + 新規案件作成
            </button>
          ) : (
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-all flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              キャンセル
            </button>
          )}
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="mb-12 bg-[#0f2847] border border-cyan-500/30 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">
              {editingId ? "案件を編集" : "新規アポイント案件作成"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-cyan-300 mb-2">案件タイトル *</label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">業種 *</label>
                  <Input
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">企業規模 *</label>
                  <Input
                    required
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">地域 *</label>
                  <Input
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">アポイント価格 (JPY) *</label>
                  <Input
                    required
                    type="number"
                    value={formData.bidPrice}
                    onChange={(e) => setFormData({ ...formData, bidPrice: parseInt(e.target.value) || 0 })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400 font-bold text-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">月額料金 (JPY)</label>
                  <Input
                    type="number"
                    value={formData.monthlyAmount}
                    onChange={(e) => setFormData({ ...formData, monthlyAmount: parseInt(e.target.value) || 0 })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400 font-bold text-cyan-400"
                  />
                </div>
                {editingId && (
                  <div>
                    <label className="block text-sm font-bold text-cyan-300 mb-2">ステータス</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-[#0a1628] border border-cyan-500/50 rounded-md px-3 py-2 text-white focus:border-cyan-400 outline-none"
                    >
                      <option value="active">公開中</option>
                      <option value="sold">成約済み</option>
                      <option value="archived">アーカイブ</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-cyan-300 mb-2">詳細説明</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400 min-h-[120px]"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="submit"
                  disabled={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/50 disabled:opacity-50"
                >
                  {editingId ? "更新する" : "案件を作成"}
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
                      <span className="text-cyan-400 font-bold">¥{(appointment.price || 0).toLocaleString()}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(appointment)}
                          className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(appointment.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
