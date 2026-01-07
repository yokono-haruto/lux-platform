import { trpc } from "@/lib/trpc";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";

export function NotificationBell() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery();
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery();
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => utils.notifications.invalidate(),
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => utils.notifications.invalidate(),
  });

  const formatDate = (date: Date | string | number) => {
    const d = new Date(date);
    // 異常な日付（57988年など）の場合は現在時刻を表示
    if (isNaN(d.getTime()) || d.getFullYear() > 3000 || d.getFullYear() < 2000) {
      return new Date().toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      });
    }
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    });
  };

  const handleNotificationClick = (n: { id: number; isRead: boolean }) => {
    if (!n.isRead) {
      markAsReadMutation.mutate(n.id);
    }
    setLocation(`/notifications/${n.id}`);
  };

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
          <span className="text-xs text-gray-400">{unreadCount || 0}</span>
        </div>
        {unreadCount && unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-cyan-500/20">
            <button 
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-cyan-400 hover:underline"
            >
              すべて既読にする
            </button>
          </div>
        )}
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
                  className={`p-4 border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer ${!n.isRead ? 'bg-cyan-500/10' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm">{n.title}</span>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
