import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success("ログインしました");
      const user = data.user;
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "sales") {
        navigate("/sales/dashboard");
      } else if (user.role === "power_company") {
        navigate("/company/dashboard");
      } else {
        navigate("/");
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast.error(error.message || "ログインに失敗しました");
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
    <div className="min-h-screen gradient-bg flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-cyan-500/20" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">LUX</span>
            </div>
            <p className="text-white/60 text-lg">Power Trading Platform</p>
          </div>
          
          {/* Features */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">効率的な取引</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  営業部隊と電力会社を直接つなぎ、スムーズな取引を実現
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">安全な環境</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  エンタープライズグレードのセキュリティで取引を保護
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">リアルタイム管理</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  案件・入札状況をリアルタイムで把握し、迅速な意思決定
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">LUX</span>
            </div>
            <p className="text-white/50 text-sm">Power Trading Platform</p>
          </div>

          {/* Form Card */}
          <div className="glass-card p-8 md:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">ログイン</h1>
              <p className="text-white/50">アカウント情報を入力してください</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  ユーザーID
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lux_yokono"
                  className="input-premium"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  パスワード
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-premium pr-12"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-premium flex items-center justify-center gap-2 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>認証中...</span>
                  </>
                ) : (
                  <>
                    <span>ログイン</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/40 text-sm">
                アカウントをお持ちでない方は管理者にお問い合わせください
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-white/30 text-xs">
              © 2026 LUX Inc. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
