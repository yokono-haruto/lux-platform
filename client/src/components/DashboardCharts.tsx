import { trpc } from "@/lib/trpc";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function DashboardCharts() {
  const { data: monthlyStats, isLoading } = trpc.dashboard.monthlyStats.useQuery();

  if (isLoading) return <div className="text-center p-10 text-cyan-400">データを読み込み中...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6">案件数・入札数推移</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="appointments" name="案件数" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
              <Line type="monotone" dataKey="bids" name="入札数" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#001529] border border-[#003a70] rounded-xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6">売上推移（予測）</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => `¥${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="revenue" name="売上" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
