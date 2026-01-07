import { trpc } from "@/lib/trpc";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Link } from "wouter";

export function NotificationBell() {
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery();
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery();
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => utils.notifications.invalidate(),
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => utils.notifications.invalidate(),
  });

  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-cyan-400">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 ? (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#001529]">
              {unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-[#0f2847] border-cyan-500/30 text-white" align="end">
        <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center">
          <h3 className="font-bold">通知</h3>
          {unreadCount && unreadCount > 0 && (
            <button 
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-cyan-400 hover:underline"
            >
              すべて既読にする
            </button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">読み込み中...</div>
          ) : notifications?.length === 0 ? (
            <div className="p-4 text-center text-gray-400">通知はありません</div>
          ) : (
            <div className="flex flex-col">
              {notifications?.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors ${!n.isRead ? 'bg-cyan-500/10' : ''}`}
                  onClick={() => !n.isRead && markAsReadMutation.mutate(n.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm">{n.title}</span>
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ja })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mb-2">{n.content}</p>
                  {n.link && (
                    <Link href={n.link}>
                      <a className="text-[10px] text-cyan-400 hover:underline">詳細を見る</a>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
