import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function CompanyDashboard() {
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
            <h1 className="text-3xl font-bold text-[#00a3ff]">LUX MARKETPLACE</h1>
            <p className="text-gray-400 mt-1">電力会社ダッシュボード</p>
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
          <h2 className="text-2xl font-bold mb-4">ようこそ、電力会社様</h2>
          <p className="text-gray-300">
            公開されている案件を閲覧し、入札することができます。
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-2xl font-bold text-[#00a3ff]">0</div>
            <div className="text-gray-400 text-sm">公開案件数</div>
          </div>
          
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-2xl font-bold text-green-400">0</div>
            <div className="text-gray-400 text-sm">入札済み</div>
          </div>
          
          <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-2xl font-bold text-yellow-400">¥0</div>
            <div className="text-gray-400 text-sm">月間合計</div>
          </div>
        </div>

        {/* Public Appointments */}
        <div className="bg-[#001529] border border-[#003a70] rounded-xl p-8">
          <h3 className="text-xl font-bold mb-6">公開案件一覧</h3>
          <div className="text-center text-gray-400 py-12">
            現在公開されている案件はありません
          </div>
        </div>
      </div>
    </div>
  );
}
