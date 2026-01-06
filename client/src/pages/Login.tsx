import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("ログインしました");
      const user = data.user;
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "sales") {
        navigate("/sales/dashboard");
      } else if (user.role === "power_company") {
        navigate("/marketplace");
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast.error("ログインに失敗しました");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("ユーザーIDとパスワードを入力してください");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  const isLoading = loginMutation.isPending;

  return (
    <div className="min-h-screen bg-[#000b1d] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#001529] border border-[#003a70] rounded-2xl p-8 shadow-2xl">
        {/* Logo & Header */}
        <div className="mb-10 text-center">
          <img 
            src="/lux-logo.png" 
            alt="LUX Logo" 
            className="h-24 mx-auto mb-6 object-contain"
          />
          <h1 className="text-2xl font-bold tracking-wider text-[#00a3ff]">LOGIN</h1>
          <p className="text-sm text-gray-400 mt-2">LUX アポイント取引プラットフォーム</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
              User ID
            </label>
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lux_yokono"
              className="w-full bg-[#000b1d] border-[#003a70] focus:border-[#00a3ff] text-white rounded-xl px-4 py-6"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#000b1d] border-[#003a70] focus:border-[#00a3ff] text-white rounded-xl px-4 py-6"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00a3ff] hover:bg-[#0082cc] text-white font-bold py-6 rounded-xl transition-all duration-300 shadow-lg shadow-[#00a3ff]/20"
          >
            {isLoading ? "AUTHENTICATING..." : "SIGN IN"}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[#003a70] text-center">
          <p className="text-xs text-gray-500">
            © 2026 LUX Inc. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
