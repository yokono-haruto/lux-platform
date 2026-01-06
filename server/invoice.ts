import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { storagePut } from "./storage";
import * as db from "./db";
import { notifyInvoiceGenerated } from "./notification";

/**
 * 月末請求書をPDF生成してS3に保存
 */
export async function generateMonthlyInvoice(month: string): Promise<{
  pdfUrl: string;
  pdfKey: string;
  invoiceId: number;
}> {
  // 既存の請求書を取得
  let invoice = await db.getInvoiceByMonth(month);

  if (!invoice) {
    // 請求書がない場合は作成
    invoice = await db.createInvoice({
      month,
      totalAmount: "0",
      status: "draft",
    });
  }

  // 請求書アイテムを取得
  const items = await db.getInvoiceItems(invoice.id);

  // PDF生成
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4サイズ
  const { width, height } = page.getSize();

  // ヘッダー
  page.drawText("請求書", {
    x: 50,
    y: height - 50,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText(`月: ${month}`, {
    x: 50,
    y: height - 100,
    size: 12,
    color: rgb(0, 0, 0),
  });

  // テーブルヘッダー
  let yPosition = height - 150;
  const columnX = [50, 250, 450];
  const columnWidths = [200, 200, 95];

  page.drawText("案件名", {
    x: columnX[0],
    y: yPosition,
    size: 10,
    color: rgb(0, 0, 0),
  });

  page.drawText("購入企業", {
    x: columnX[1],
    y: yPosition,
    size: 10,
    color: rgb(0, 0, 0),
  });

  page.drawText("金額", {
    x: columnX[2],
    y: yPosition,
    size: 10,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;

  // テーブル内容
  let totalAmount = 0;
  for (const item of items) {
    const amount = parseFloat(item.amount.toString());
    totalAmount += amount;

    page.drawText(item.appointmentTitle.substring(0, 30), {
      x: columnX[0],
      y: yPosition,
      size: 9,
      color: rgb(0, 0, 0),
    });

    page.drawText(item.bidderCompanyName.substring(0, 30), {
      x: columnX[1],
      y: yPosition,
      size: 9,
      color: rgb(0, 0, 0),
    });

    page.drawText(`¥${amount.toLocaleString()}`, {
      x: columnX[2],
      y: yPosition,
      size: 9,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    if (yPosition < 50) {
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }
  }

  // 合計
  yPosition -= 20;
  page.drawText("合計", {
    x: columnX[0],
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
  });

  page.drawText(`¥${totalAmount.toLocaleString()}`, {
    x: columnX[2],
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
  });

  // PDF保存
  const pdfBytes = await pdfDoc.save();
  const pdfKey = `invoices/${month}-${Date.now()}.pdf`;

  const { url } = await storagePut(pdfKey, pdfBytes, "application/pdf");

  // 請求書を更新
  await db.updateInvoice(invoice.id, {
    totalAmount: totalAmount.toString(),
    pdfUrl: url,
    pdfKey,
    status: "finalized",
  });

  // 管理者に通知
  await notifyInvoiceGenerated({
    month,
    totalAmount,
    invoiceCount: items.length,
  });

  return {
    pdfUrl: url,
    pdfKey,
    invoiceId: invoice.id,
  };
}

/**
 * 月末の入札データから請求書を生成
 */
export async function createMonthlyInvoiceFromBids(month: string): Promise<void> {
  // 該当月の入札を取得
  const appointments = await db.getAppointments();

  let totalAmount = 0;
  let invoice = await db.getInvoiceByMonth(month);

  if (!invoice) {
    invoice = await db.createInvoice({
      month,
      totalAmount: "0",
      status: "draft",
    });
  }

  // 各案件の入札を処理
  for (const apt of appointments) {
    const bids = await db.getBidsByAppointment(apt.id);

    for (const bid of bids) {
      if (bid.status === "completed" || bid.status === "accepted") {
        const amount = parseFloat(bid.bidAmount.toString());
        totalAmount += amount;

        // 請求書アイテムを作成
        // TODO: bidderId から実際のユーザー情報を取得して会社名を設定
        await db.createInvoiceItem({
          invoiceId: invoice.id,
          bidId: bid.id,
          appointmentTitle: apt.title,
          bidderCompanyName: "電力会社",
          amount: amount.toString(),
        });
      }
    }
  }

  // 請求書を更新
  if (totalAmount > 0) {
    await db.updateInvoice(invoice.id, {
      totalAmount: totalAmount.toString(),
    });
  }
}
