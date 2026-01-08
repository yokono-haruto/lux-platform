import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([]);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [requestCount, setRequestCount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = trpc.chatbot.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    },
    onError: (error) => {
      setMessages((prev) => [...prev, { role: "bot", text: "エラーが発生しました。もう一度お試しください。" }]);
      toast.error(error.message || "エラーが発生しました");
    },
  });

  const handleSend = () => {
    if (!message.trim() || chatMutation.isPending) return;

    const now = Date.now();
    if (now - lastRequestTime < 60000) {
      if (requestCount >= 3) {
        toast.error("質問は1分間に3回までです。少し待ってから再度お試しください。");
        return;
      }
      setRequestCount(requestCount + 1);
    } else {
      setLastRequestTime(now);
      setRequestCount(1);
    }

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    chatMutation.mutate({ message });
    setMessage("");
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-lg transition-all flex items-center justify-center z-50 group overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
            boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4)"
          }}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform relative z-10" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 w-[360px] sm:w-[400px] h-[520px] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          style={{
            background: "rgba(15, 15, 35, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          {/* Header */}
          <div 
            className="p-4 flex justify-between items-center"
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">LUX AI アシスタント</h3>
                <p className="text-xs text-white/50">いつでもお手伝いします</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(99, 102, 241, 0.1)" }}>
                  <Bot className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-white font-medium mb-2">こんにちは！</p>
                <p className="text-white/50 text-sm">
                  LUXプラットフォームについて<br />何でもお聞きください。
                </p>
                <div className="mt-6 space-y-2">
                  {["案件の登録方法は？", "入札の仕方を教えて", "料金体系について"].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMessage(q);
                        setTimeout(() => handleSend(), 100);
                      }}
                      className="block w-full px-4 py-2 rounded-xl text-sm text-left text-white/70 hover:text-white hover:bg-white/5 transition-all"
                      style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" 
                    ? "bg-indigo-500" 
                    : "bg-white/10"
                }`}>
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-indigo-500 text-white rounded-tr-md"
                      : "bg-white/5 text-white/90 rounded-tl-md"
                  }`}
                  style={msg.role === "bot" ? { border: "1px solid rgba(255, 255, 255, 0.1)" } : {}}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/5" style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="メッセージを入力..."
                className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/40 text-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
                maxLength={500}
                disabled={chatMutation.isPending}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || chatMutation.isPending}
                className="p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: message.trim() ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(255, 255, 255, 0.05)",
                  boxShadow: message.trim() ? "0 4px 14px rgba(99, 102, 241, 0.4)" : "none"
                }}
              >
                <Send className={`h-5 w-5 ${message.trim() ? "text-white" : "text-white/30"}`} />
              </button>
            </div>
            <p className="text-xs text-white/30 mt-2 text-center">
              Powered by AI • 1分間に3回まで
            </p>
          </div>
        </div>
      )}
    </>
  );
}
