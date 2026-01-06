import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function SalesDashboard() {
  const [, navigate] = useLocation();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#000b1d] text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#00a3ff]">LUX SALES</h1>
            <p className="text-gray-400 mt-1">営業部隊ダッシュボード</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            🛡️ ログアウト
          </Button>
        </div>

        {/* Welcome Message */}
        <div className="bg-[#001529] border border-[#003a70] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">ようこそ、営業部隊様</h2>
          <p className="text-gray-300">
            このダッシュボードから案件の投入や管理を行うことができます。
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-2xl font-bold text-[#00a3ff]">0</div>
            <div className="text-gray-400 text-sm">投入済み案件</div>
          </div>
          
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
            <div className="text-4xl mb-2">🌐</div>
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-gray-400 text-sm">公開中</div>
          </div>
          
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-2xl font-bold text-yellow-400">0</div>
            <div className="text-gray-400 text-sm">成約数</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#001529] border border-[#003a70] rounded-xl p-8">
          <h3 className="text-xl font-bold mb-6">クイックアクション</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="bg-[#00a3ff] hover:bg-[#0088cc] text-white py-6">
              📝 新規案件を投入
            </Button>
            <Button className="bg-[#003a70] hover:bg-[#004a90] text-white py-6">
              📊 案件一覧を表示
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
