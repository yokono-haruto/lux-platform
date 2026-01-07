import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Sparkles, AlertCircle } from "lucide-react";

export function AIPricePrediction({ appointmentId }: { appointmentId: number }) {
  const [showPrediction, setShowPrediction] = useState(false);
  const { data: prediction, isLoading, error } = trpc.ai.predictPrice.useQuery(appointmentId, {
    enabled: showPrediction,
  });

  return (
    <div className="mt-4">
      {!showPrediction ? (
        <button
          onClick={() => setShowPrediction(true)}
          className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 px-3 py-2 rounded-lg border border-cyan-500/30"
        >
          <Sparkles className="h-3 w-3" />
          AI価格予測を表示
        </button>
      ) : (
        <div className="bg-[#0f172a] border border-cyan-500/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-bold">AI価格予測結果</span>
          </div>
          
          {isLoading ? (
            <div className="text-xs text-gray-400 animate-pulse">分析中...</div>
          ) : error ? (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              予測に失敗しました
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-gray-400">予測成約価格:</span>
                <span className="text-lg font-bold text-white">¥{prediction?.predictedPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400">信頼度:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  prediction?.confidence === 'high' ? 'bg-green-500/20 text-green-400' : 
                  prediction?.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                  'bg-red-500/20 text-red-400'
                }`}>
                  {prediction?.confidence === 'high' ? '高' : prediction?.confidence === 'medium' ? '中' : '低'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed border-t border-cyan-500/10 pt-2">
                {prediction?.reason}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
