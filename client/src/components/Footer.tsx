import { Link } from "wouter";
import { Home, Settings, HelpCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0a1628] border-t border-cyan-500/20 py-4 mt-auto">
      <div className="container max-w-6xl mx-auto px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/">
              <a className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                <Home className="h-4 w-4" />
                ホーム
              </a>
            </Link>
            <Link href="/settings">
              <a className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                <Settings className="h-4 w-4" />
                設定
              </a>
            </Link>
          </div>
          <p className="text-xs text-gray-500">© 2026 LUX Inc. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
