import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/NotificationBell";
import { Trash2 } from "lucide-react";

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
    if (window.confirm("本当にこのユーザーを完全に削除しますか？この操作は取り消せません。")) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/30 py-6 px-8 bg-gradient-to-r from-[#0a1628] to-[#0f2847]">
        <div className="container max-w-6xl flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard">
              <a className="text-cyan-400 hover:text-cyan-300 transition-colors">
                <span className="text-2xl">←</span>
              </a>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-cyan-400 mb-1">LUX ユーザー管理</h1>
              <p className="text-sm text-gray-400">企業ユーザーのアカウント作成・管理</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-sm text-right">
              <p className="font-bold text-cyan-300">{user.name}</p>
              <p className="text-gray-400">管理者</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto py-8 px-8">
        {/* Create Button */}
        <div className="mb-8 flex justify-end">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/50"
          >
            {showCreateForm ? "キャンセル" : "+ 新規ユーザー作成"}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-12 bg-[#0f2847] border border-cyan-500/30 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">新規ユーザー作成</h2>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">メールアドレス *</label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">名前 *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">パスワード *</label>
                  <Input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-[#0a1628] border-cyan-500/50 text-white focus:border-cyan-400"
                    placeholder="8文字以上"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-cyan-300 mb-2">ロール *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-[#0a1628] border border-cyan-500/50 rounded-md px-3 py-2 text-white focus:border-cyan-400 outline-none"
                  >
                    <option value="power_company">電力会社</option>
                    <option value="sales">営業部隊</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/50 disabled:opacity-50"
                >
                  {createUserMutation.isPending ? "作成中..." : "ユーザーを作成"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-[#0f2847] border border-cyan-500/30 rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">登録済みユーザー一覧</h2>
          {usersQuery.isLoading ? (
            <div className="text-center py-12 text-gray-400">読み込み中...</div>
          ) : usersQuery.data && usersQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cyan-500/30 bg-[#0a1628]/50">
                    <th className="py-4 px-6 text-cyan-300 font-bold uppercase text-xs tracking-wider">名前 / メール</th>
                    <th className="py-4 px-6 text-cyan-300 font-bold uppercase text-xs tracking-wider">ロール</th>
                    <th className="py-4 px-6 text-cyan-300 font-bold uppercase text-xs tracking-wider">ステータス</th>
                    <th className="py-4 px-6 text-cyan-300 font-bold uppercase text-xs tracking-wider text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data.map((u: any) => (
                    <tr key={u.id} className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase border border-cyan-500/30 rounded">
                          {u.role === "power_company" ? "電力会社" : u.role === "sales" ? "営業部隊" : "管理者"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.isActive ? (
                          <span className="text-green-400 text-sm font-bold">● 有効</span>
                        ) : (
                          <span className="text-red-400 text-sm font-bold">● 無効</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">ユーザーが見つかりません</div>
          )}
        </div>
      </div>
    </div>
  );
}
