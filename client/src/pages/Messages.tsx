import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Send, User, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Messages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: allMessages, isLoading: isLoadingMessages } = trpc.messages.list.useQuery(undefined, {
    refetchInterval: 3000,
  });
  
  const { data: conversation, isLoading: isLoadingChat } = trpc.messages.getConversation.useQuery(selectedUserId!, {
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

  // 会話相手のリストを作成
  const chatPartners = allMessages ? Array.from(new Set(
    allMessages.map(m => m.senderId === user?.id ? m.receiverId : m.senderId)
  )).map(id => {
    const lastMsg = allMessages.find(m => m.senderId === id || m.receiverId === id);
    return { id, lastMsg };
  }) : [];

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

  return (
    <div className="min-h-screen bg-[#000b18] text-white">
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

      <div className="container max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-80px)] flex gap-6">
        {/* Sidebar */}
        <div className="w-1/3 bg-[#001529] border border-[#003a70] rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#003a70] bg-[#001c36]">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="text-cyan-400" />
              メッセージ
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {chatPartners.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                会話履歴はありません
              </div>
            ) : (
              chatPartners.map(partner => (
                <button
                  key={partner.id}
                  onClick={() => setSelectedUserId(partner.id)}
                  className={`w-full p-4 text-left border-b border-[#003a70]/50 hover:bg-cyan-500/5 transition-colors ${selectedUserId === partner.id ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <User className="text-cyan-400 w-5 h-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-bold text-sm">ユーザー #{partner.id}</div>
                      <div className="text-xs text-gray-400 truncate">{partner.lastMsg?.content}</div>
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
                <div className="font-bold">ユーザー #{selectedUserId} との会話</div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                  {conversation?.map((msg) => (
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
                <Button onClick={handleSend} className="bg-cyan-500 hover:bg-cyan-600">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p>会話を選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
