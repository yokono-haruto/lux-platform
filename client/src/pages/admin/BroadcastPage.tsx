import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Home, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export default function BroadcastPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState("all");

  const broadcastMutation = trpc.notifications.broadcast.useMutation({
    onSuccess: () => {
      toast.success("一斉周知を送信しました");
      setTitle("");
      setContent("");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("タイトルと内容を入力してください");
      return;
    }
    broadcastMutation.mutate({ title, content, targetRole });
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <header className="border-b border-cyan-500/30 py-4 px-8 bg-[#0f2847] sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/admin/dashboard")} className="p-2 text-gray-400 hover:text-cyan-400">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">一斉周知</h1>
              <p className="text-xs text-gray-400">Broadcast Notification</p>
            </div>
          </div>
          <button onClick={() => navigate("/")} className="p-2 text-gray-400 hover:text-green-400">
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto py-8 px-8">
        <div className="bg-[#0f2847] border border-cyan-500/20 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">送信対象</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
              >
                <option value="all">全ユーザー</option>
                <option value="sales">営業部隊のみ</option>
                <option value="company">電力会社のみ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">タイトル *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white"
                placeholder="お知らせのタイトル"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">内容 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white h-40"
                placeholder="お知らせの内容を入力してください"
              />
            </div>

            <button
              type="submit"
              disabled={broadcastMutation.isPending}
              className="w-full py-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="h-5 w-5" />
              {broadcastMutation.isPending ? "送信中..." : "一斉周知を送信"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
