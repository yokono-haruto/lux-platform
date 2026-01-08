import { Link } from "wouter";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-6 mt-auto bg-black/20">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/70">LUX Platform</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/">
              <a className="text-sm text-white/40 hover:text-white/70 transition-colors">
                ホーム
              </a>
            </Link>
            <Link href="/settings">
              <a className="text-sm text-white/40 hover:text-white/70 transition-colors">
                設定
              </a>
            </Link>
          </div>
          
          <p className="text-xs text-white/30">
            © 2026 LUX Inc. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
