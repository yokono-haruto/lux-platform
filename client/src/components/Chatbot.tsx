import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MessageCircle, X, Send } from "lucide-react";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([]);

  const chatMutation = trpc.chatbot.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    },
    onError: (error) => {
      setMessages((prev) => [...prev, { role: "bot", text: error.message }]);
    },
  });

  const handleSend = () => {
    if (!message.trim() || chatMutation.isPending) return;

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
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group"
        >
          <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-slate-800 border border-blue-500/30 rounded-xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-white" />
              <h3 className="text-white font-bold">LUX サポート</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p className="mb-2">👋 こんにちは！</p>
                <p className="text-sm">何かお困りですか？<br />お気軽にご質問ください。</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700 text-gray-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-slate-700 text-gray-100 px-4 py-2 rounded-lg">
                  <p className="text-sm">入力中...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="質問を入力..."
                className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
                disabled={chatMutation.isPending}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || chatMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">1分間に3回まで質問できます</p>
          </div>
        </div>
      )}
    </>
  );
}
