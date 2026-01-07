import { trpc } from "@/lib/trpc";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function MessageBell() {
  const [, setLocation] = useLocation();
  const { data: unreadCount } = trpc.messages.unreadCount.useQuery();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative text-gray-300 hover:text-cyan-400"
      onClick={() => setLocation("/messages")}
    >
      <MessageSquare className="h-5 w-5" />
      {unreadCount && unreadCount > 0 ? (
        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#001529]">
          {unreadCount}
        </span>
      ) : null}
    </Button>
  );
}
