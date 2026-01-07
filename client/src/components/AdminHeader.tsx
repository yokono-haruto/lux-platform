import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Home, Activity } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { MessageBell } from "./MessageBell";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AdminHeader({ title = "LUX ADMIN", subtitle = "Management System" }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  
  const systemStatusQuery = trpc.systemStatus.getTodayStatus.useQuery(undefined, {
    enabled: user?.role === "admin",
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });

  // 対応が必要な事項の数を計算
  const actionRequiredCount = systemStatusQuery.data?.issues?.filter(issue => issue.actionRequired).length || 0;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <header className="border-b border-cyan-500/30 py-8 px-8 bg-gradient-to-r from-[#0a1628] to-[#0f2847] sticky top-0 z-50 backdrop-blur-md">
      <div className="container max-w-6xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-cyan-400 tracking-tighter mb-1">{title}</h1>
          <p className="text-[10px] text-cyan-500/70 uppercase tracking-[0.3em] font-bold">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <a className="p-2 text-gray-300 hover:text-cyan-400 transition-colors" title="ホーム">
              <Home className="h-5 w-5" />
            </a>
          </Link>
          <button onClick={() => window.history.back()} className="p-2 text-gray-300 hover:text-cyan-400 transition-colors" title="戻る">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link href="/today-status">
            <a className="relative p-2 text-gray-300 hover:text-cyan-400 transition-colors" title="今日の状況">
              <Activity className="h-5 w-5" />
              {actionRequiredCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {actionRequiredCount}
                </span>
              )}
            </a>
          </Link>
          <NotificationBell />
          <MessageBell />
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-cyan-300">{user?.name}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">System Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm font-bold"
          >
            🚪 ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
