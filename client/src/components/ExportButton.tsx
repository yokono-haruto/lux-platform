import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  data: any[];
  filename: string;
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error("エクスポートするデータがありません");
      return;
    }

    try {
      // CSVヘッダーの作成
      const headers = Object.keys(data[0]).join(",");
      
      // データの作成
      const rows = data.map(item => {
        return Object.values(item).map(value => {
          // カンマが含まれる場合はダブルクォーテーションで囲む
          const strValue = String(value).replace(/"/g, '""');
          return `"${strValue}"`;
        }).join(",");
      });

      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSVをエクスポートしました");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("エクスポートに失敗しました");
    }
  };

  return (
    <Button 
      onClick={handleExport}
      variant="outline" 
      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
    >
      <Download className="mr-2 h-4 w-4" />
      CSVエクスポート
    </Button>
  );
}
