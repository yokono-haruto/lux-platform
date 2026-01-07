import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { AdminHeader } from "@/components/AdminHeader";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function TransactionsManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  // Empty data - will be populated from database
  const transactions: any[] = [];

  const stats = [
    { label: "総取引額", value: "¥0", icon: "💰", color: "cyan" },
    { label: "完了取引", value: "0件", icon: "✅", color: "green" },
    { label: "保留中", value: "0件", icon: "⏳", color: "yellow" },
    { label: "今月の収益", value: "¥0", icon: "📈", color: "purple" },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-500/20 text-green-300 border-green-500/30",
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    const labels = {
      completed: "完了",
      pending: "保留中",
      cancelled: "キャンセル",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const filteredTransactions = selectedStatus === "all" 
    ? transactions 
    : transactions.filter(t => t.status === selectedStatus);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white font-sans">
      <AdminHeader title="取引・請求管理" subtitle="Transaction Management" />

      <main className="container max-w-7xl mx-auto py-12 px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#0f2847]/80 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 shadow-xl hover:border-cyan-500/50 transition-all group relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-2xl mb-4 bg-cyan-500/10 w-10 h-10 flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">{stat.icon}</div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] text-6xl opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-8">
          <span className="w-2 h-10 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"></span>
          <h2 className="text-3xl font-black text-white tracking-tight">取引履歴</h2>
        </div>

        <div className="flex gap-3 mb-8">
          {[
            { value: "all", label: "すべて" },
            { value: "completed", label: "完了" },
            { value: "pending", label: "保留中" },
            { value: "cancelled", label: "キャンセル" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                selectedStatus === filter.value
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                  : "bg-[#0f2847] text-gray-400 border border-cyan-500/20 hover:border-cyan-500/50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="bg-[#0f2847]/80 backdrop-blur-sm border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cyan-500/10 border-b border-cyan-500/20">
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">案件名</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">電力会社</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">営業チーム</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">金額</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">ステータス</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">日付</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-bold text-sm">{transaction.appointmentTitle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm">{transaction.companyName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-300 text-sm">{transaction.salesTeam}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-cyan-400 font-bold text-lg">¥{transaction.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-400 text-sm">{transaction.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-cyan-400 hover:text-cyan-300 font-bold text-sm transition-colors">
                        詳細 →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">該当する取引がありません</p>
          </div>
        )}
      </main>
    </div>
  );
}
