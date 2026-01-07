import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  const { data: notifications } = trpc.notifications.list.useQuery();
  const notification = notifications?.find(n => n.id === Number(params.id));
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  
  // Mark as read when viewing
  if (notification && !notification.isRead) {
    markAsReadMutation.mutate(notification.id);
  }

  const formatDate = (date: Date | string | number) => {
    const d = new Date(date);
    if (isNaN(d.getTime()) || d.getFullYear() > 3000) {
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

  const handleBack = () => {
    window.history.back();
  };

  if (!notification) {
    return (
      <div className="min-h-screen bg-[#000b18] text-white p-6">
        <Button onClick={handleBack} variant="ghost" className="mb-4 text-cyan-400">
          <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
        </Button>
        <p>通知が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000b18] text-white">
      <header className="bg-gradient-to-r from-[#001c36] to-[#002a4d] p-4 border-b border-[#003a70]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="ghost" size="icon" className="text-cyan-400 hover:bg-cyan-500/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">通知詳細</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <Card className="bg-[#001c36] border-[#003a70]">
          <CardHeader className="border-b border-[#003a70]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-full">
                <Bell className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-white mb-2">{notification.title}</CardTitle>
                <p className="text-sm text-gray-400">{formatDate(notification.createdAt)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-200 whitespace-pre-wrap text-lg leading-relaxed">
              {notification.content}
            </p>
            {notification.link && (
              <Button 
                onClick={() => setLocation(notification.link!)}
                className="mt-6 bg-cyan-500 hover:bg-cyan-600"
              >
                詳細を見る
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button onClick={handleBack} variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> 戻る
          </Button>
        </div>
      </main>
    </div>
  );
}
