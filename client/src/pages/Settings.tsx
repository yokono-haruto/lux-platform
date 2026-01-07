import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, User, Lock, Save } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function Settings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("パスワードを変更しました");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("新しいパスワードが一致しません");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("パスワードは6文字以上必要です");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex flex-col">
      <header className="bg-[#0f2847] border-b border-cyan-500/30 py-4 px-8 sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()} className="p-2 text-gray-400 hover:text-cyan-400">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-cyan-400">設定</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto py-8 px-8 flex-1">
        {/* Profile */}
        <div className="bg-[#0f2847] border border-cyan-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <User className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold">プロフィール</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">ユーザー名</p>
              <p className="font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-400">ユーザーID</p>
              <p className="font-semibold">{user.username}</p>
            </div>
            <div>
              <p className="text-gray-400">役割</p>
              <p className="font-semibold">{user.role === "admin" ? "管理者" : user.role === "sales" ? "営業部隊" : "電力会社"}</p>
            </div>
            <div>
              <p className="text-gray-400">会社名</p>
              <p className="font-semibold">{user.companyName || "-"}</p>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-[#0f2847] border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <Lock className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold">パスワード変更</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">現在のパスワード</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">新しいパスワード</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">新しいパスワード（確認）</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {changePasswordMutation.isPending ? "変更中..." : "パスワードを変更"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
