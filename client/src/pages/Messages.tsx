import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { Send, User, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/Footer";

export default function Messages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 会話可能なユーザー一覧を取得
  const { data: availableUsers } = trpc.messages.getAvailableUsers.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: conversation } = trpc.messages.getConversation.useQuery(selectedUserId!, {
    enabled: !!selectedUserId,
    refetchInterval: 3000,
  });

  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      utils.messages.getConversation.invalidate(selectedUserId!);
    },
  });

  const utils = trpc.useUtils();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleSend = () => {
    if (!messageText.trim() || !selectedUserId) return;
    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: messageText,
    });
  };

  const goBack = () => {
    if (user.role === "admin") setLocation("/admin/dashboard");
    else if (user.role === "sales") setLocation("/sales/dashboard");
    else if (user.role === "power_company") setLocation("/company/dashboard");
    else setLocation("/");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "管理者";
      case "sales": return "営業部隊";
      case "power_company": return "電力会社";
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "text-cyan-400 bg-cyan-500/20";
      case "sales": return "text-blue-400 bg-blue-500/20";
      case "power_company": return "text-green-400 bg-green-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#000b18] text-white flex flex-col">
      {/* Header */}
      <header className="bg-[#001529] border-b border-[#003a70] py-4 px-8 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 text-gray-400 hover:text-cyan-400">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-cyan-400">メッセージ</h1>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-6 flex-1 flex gap-6">
        {/* Sidebar - 会話可能なユーザー一覧 */}
        <div className="w-1/3 bg-[#001529] border border-[#003a70] rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#003a70] bg-[#001c36]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="text-cyan-400 h-5 w-5" />
              連絡先
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {user.role === "admin" ? "全ユーザーと会話可能" : "管理者と会話可能"}
            </p>
          </div>
          <ScrollArea className="flex-1">
            {!availableUsers || availableUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                連絡可能なユーザーがいません
              </div>
            ) : (
              availableUsers.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full p-4 text-left border-b border-[#003a70]/50 hover:bg-cyan-500/5 transition-colors ${selectedUserId === u.id ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleColor(u.role)}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-bold text-sm">{u.name}</div>
                      <div className="text-xs text-gray-400">{getRoleLabel(u.role)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#001529] border border-[#003a70] rounded-xl overflow-hidden flex flex-col">
          {selectedUserId ? (
            <>
              <div className="p-4 border-b border-[#003a70] bg-[#001c36] flex justify-between items-center">
                <div className="font-bold">
                  {availableUsers?.find((u: any) => u.id === selectedUserId)?.name || "ユーザー"} との会話
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                  {conversation?.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`max-w-[80%] p-3 rounded-xl text-sm ${
                        msg.senderId === user.id
                          ? "self-end bg-cyan-600 text-white rounded-tr-none"
                          : "self-start bg-[#002a4d] text-gray-200 rounded-tl-none border border-[#003a70]"
                      }`}
                    >
                      {msg.content}
                      <div className={`text-[10px] mt-1 ${msg.senderId === user.id ? "text-cyan-200" : "text-gray-500"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <div className="p-4 bg-[#001c36] border-t border-[#003a70] flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="メッセージを入力..."
                  className="bg-[#000b18] border-[#003a70] text-white"
                />
                <Button onClick={handleSend} disabled={sendMessageMutation.isPending} className="bg-cyan-500 hover:bg-cyan-600">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>左のリストからユーザーを選択してください</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
