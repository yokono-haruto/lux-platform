import { notifyOwner } from "./_core/notification";

/**
 * 新規入札時に管理者に通知を送信
 */
export async function notifyNewBid(data: {
  appointmentTitle: string;
  bidderCompanyName: string;
  bidAmount: number;
  appointmentId: number;
}): Promise<boolean> {
  const title = "新規入札通知";
  const content = `
新しい入札が発生しました

案件: ${data.appointmentTitle}
入札企業: ${data.bidderCompanyName}
入札金額: ¥${data.bidAmount.toLocaleString()}
案件ID: ${data.appointmentId}

管理画面で詳細を確認してください
  `.trim();

  try {
    return await notifyOwner({ title, content });
  } catch (error) {
    console.error("Failed to send bid notification:", error);
    return false;
  }
}

/**
 * 月末請求書生成時に管理者に通知を送信
 */
export async function notifyInvoiceGenerated(data: {
  month: string;
  totalAmount: number;
  invoiceCount: number;
}): Promise<boolean> {
  const title = "月末請求書生成完了";
  const content = `
${data.month}の請求書が生成されました

請求書数: ${data.invoiceCount}
合計金額: ¥${data.totalAmount.toLocaleString()}

管理画面からダウンロードしてください
  `.trim();

  try {
    return await notifyOwner({ title, content });
  } catch (error) {
    console.error("Failed to send invoice notification:", error);
    return false;
  }
}
