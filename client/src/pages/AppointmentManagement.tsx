import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { ExportButton } from "@/components/ExportButton";
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  FileText,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Zap
} from "lucide-react";

// 日付をフォーマットする関数（秒/ミリ秒の両方に対応）
function formatDate(timestamp: number | string | Date): string {
  if (!timestamp) return "-";
  
  let date: Date;
  if (typeof timestamp === "number") {
    // 秒かミリ秒かを判定（1970年から50年以上経過していればミリ秒）
    date = timestamp > 100000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
  } else {
    date = new Date(timestamp);
  }
  
  if (isNaN(date.getTime())) return "-";
  
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

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

  const appointmentsQuery = trpc.appointments.list.useQuery({});
  
  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("案件を作成しました");
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
      bidPrice: apt.price || apt.bidPrice || 0,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="badge-success">公開中</span>;
      case "sold":
        return <span className="badge-info">成約済み</span>;
      case "archived":
        return <span className="badge-default">アーカイブ</span>;
      default:
        return <span className="badge-default">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => navigate("/admin/dashboard")}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">案件データ管理</h1>
                <p className="text-xs text-white/40 hidden sm:block">Appointment Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {appointmentsQuery.data && appointmentsQuery.data.length > 0 && (
                <div className="hidden sm:block">
                  <ExportButton data={appointmentsQuery.data} filename="appointments" />
                </div>
              )}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-premium flex items-center gap-2 py-2.5 px-4 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">新規作成</span>
                </button>
              ) : (
                <button
                  onClick={resetForm}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="glass-card p-6 sm:p-8 mb-6 sm:mb-8">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingId ? "案件を編集" : "新規案件作成"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-white/70 mb-2">案件タイトル *</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-premium"
                    placeholder="案件タイトルを入力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">業種 *</label>
                  <input
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="input-premium"
                    placeholder="例: 製造業"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">企業規模 *</label>
                  <select
                    required
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    className="input-premium"
                  >
                    <option value="">選択してください</option>
                    <option value="小規模">小規模</option>
                    <option value="中規模">中規模</option>
                    <option value="大企業">大企業</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">地域 *</label>
                  <input
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="input-premium"
                    placeholder="例: 東京都"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">アポイント価格 (円) *</label>
                  <input
                    required
                    type="number"
                    value={formData.bidPrice}
                    onChange={(e) => setFormData({ ...formData, bidPrice: parseInt(e.target.value) || 0 })}
                    className="input-premium"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">月額料金 (円)</label>
                  <input
                    type="number"
                    value={formData.monthlyAmount}
                    onChange={(e) => setFormData({ ...formData, monthlyAmount: parseInt(e.target.value) || 0 })}
                    className="input-premium"
                    placeholder="0"
                  />
                </div>
                {editingId && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">ステータス</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="input-premium"
                    >
                      <option value="active">公開中</option>
                      <option value="sold">成約済み</option>
                      <option value="archived">アーカイブ</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">詳細説明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-premium min-h-[120px]"
                  placeholder="案件の詳細を入力してください"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-3 px-6 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all order-2 sm:order-1"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
                  className="btn-premium py-3 disabled:opacity-50 order-1 sm:order-2 sm:ml-auto"
                >
                  {editingId ? "更新する" : "案件を作成"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appointments List */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-500" />
            登録済み案件
            {appointmentsQuery.data && (
              <span className="text-sm text-white/40 ml-2">({appointmentsQuery.data.length}件)</span>
            )}
          </h2>
          
          {appointmentsQuery.isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-white/50">読み込み中...</p>
            </div>
          ) : appointmentsQuery.data && appointmentsQuery.data.length > 0 ? (
            <div className="space-y-4">
              {appointmentsQuery.data.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="p-4 sm:p-5 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(appointment.status)}
                        <span className="text-xs text-white/40">ID: #{appointment.id}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white truncate">{appointment.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-indigo-400">
                        ¥{(appointment.price || appointment.bidPrice || 0).toLocaleString()}
                      </span>
                      <button 
                        onClick={() => handleEdit(appointment)}
                        className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(appointment.id)}
                        className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-white/30" />
                      <div>
                        <p className="text-xs text-white/40">業種</p>
                        <p className="text-sm text-white">{appointment.industry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-white/30" />
                      <div>
                        <p className="text-xs text-white/40">規模</p>
                        <p className="text-sm text-white">{appointment.scale}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white/30" />
                      <div>
                        <p className="text-xs text-white/40">地域</p>
                        <p className="text-sm text-white">{appointment.area}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/30" />
                      <div>
                        <p className="text-xs text-white/40">作成日</p>
                        <p className="text-sm text-white">{formatDate(appointment.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50 mb-2">案件がありません</p>
              <p className="text-white/30 text-sm">新規作成ボタンから案件を登録してください</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
