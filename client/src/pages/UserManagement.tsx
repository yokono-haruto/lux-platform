import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/Footer";
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Trash2, 
  Users,
  Building2,
  Briefcase,
  Shield,
  Mail,
  User
} from "lucide-react";

export default function UserManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "power_company" as "sales" | "power_company",
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyIndustry: "",
  });

  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  const usersQuery = trpc.admin.listUsers.useQuery();
  
  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("ユーザーを作成しました");
      setFormData({
        email: "",
        name: "",
        password: "",
        role: "power_company",
        companyName: "",
        companyAddress: "",
        companyPhone: "",
        companyIndustry: "",
      });
      setShowCreateForm(false);
      usersQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "ユーザー作成に失敗しました");
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("ユーザーを削除しました");
      usersQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "削除に失敗しました");
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.password) {
      toast.error("必須項目を入力してください");
      return;
    }
    createUserMutation.mutate(formData);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm("本当にこのユーザーを削除しますか？この操作は取り消せません。")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
            <Shield className="w-3 h-3" />
            管理者
          </span>
        );
      case "power_company":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <Building2 className="w-3 h-3" />
            電力会社
          </span>
        );
      case "sales":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Briefcase className="w-3 h-3" />
            営業部隊
          </span>
        );
      default:
        return <span className="badge-default">{role}</span>;
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
                <h1 className="text-lg sm:text-xl font-bold text-white">ユーザー管理</h1>
                <p className="text-xs text-white/40 hidden sm:block">User Management</p>
              </div>
            </div>
            
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
                onClick={() => setShowCreateForm(false)}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Create Form */}
        {showCreateForm && (
          <div className="glass-card p-6 sm:p-8 mb-6 sm:mb-8">
            <h2 className="text-xl font-bold text-white mb-6">新規ユーザー作成</h2>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">ユーザーID *</label>
                  <input
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-premium"
                    placeholder="例: lux_tanaka"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">名前 *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-premium"
                    placeholder="例: 田中太郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">パスワード *</label>
                  <input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-premium"
                    placeholder="8文字以上"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">ロール *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="input-premium"
                  >
                    <option value="power_company">電力会社</option>
                    <option value="sales">営業部隊</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="py-3 px-6 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all order-2 sm:order-1"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="btn-premium py-3 disabled:opacity-50 order-1 sm:order-2 sm:ml-auto"
                >
                  {createUserMutation.isPending ? "作成中..." : "ユーザーを作成"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-cyan-500" />
            登録済みユーザー
            {usersQuery.data && (
              <span className="text-sm text-white/40 ml-2">({usersQuery.data.length}名)</span>
            )}
          </h2>
          
          {usersQuery.isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-white/50">読み込み中...</p>
            </div>
          ) : usersQuery.data && usersQuery.data.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 px-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">ユーザー</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">ロール</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">ステータス</th>
                      <th className="py-3 px-4 text-right text-xs font-medium text-white/50 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersQuery.data.map((u: any) => (
                      <tr key={u.id} className="hover:bg-white/3 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                              {u.name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-medium text-white">{u.name}</p>
                              <p className="text-xs text-white/40">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getRoleBadge(u.role)}
                        </td>
                        <td className="py-4 px-4">
                          {u.isActive ? (
                            <span className="badge-success">有効</span>
                          ) : (
                            <span className="badge-error">無効</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {usersQuery.data.map((u: any) => (
                  <div 
                    key={u.id}
                    className="p-4 rounded-xl bg-white/3 border border-white/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.name}</p>
                          <p className="text-xs text-white/40">{u.email}</p>
                        </div>
                      </div>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(u.role)}
                      {u.isActive ? (
                        <span className="badge-success">有効</span>
                      ) : (
                        <span className="badge-error">無効</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50 mb-2">ユーザーがいません</p>
              <p className="text-white/30 text-sm">新規作成ボタンからユーザーを登録してください</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
