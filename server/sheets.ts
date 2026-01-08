import { google } from 'googleapis';

// スプレッドシートID（URLから抽出）
const SPREADSHEET_ID = '1RKsFtWkQjmSjY54sWmPtL826IGbiLQgdVm5VoOALIFE';

// シート名
const SHEETS = {
  USERS: 'users',
  APPOINTMENTS: 'appointments',
  BIDS: 'bids',
  ACTIVITY_LOG: 'activity_log',
  SYSTEM_LOG: 'system_log',
  ERROR_LOG: 'error_log',
  PERFORMANCE_LOG: 'performance_log',
};

// Google Sheets API認証
let sheetsApi: any = null;
let isInitialized = false;

// ローカル開発用のフォールバック認証情報
const LOCAL_CREDENTIALS = {
  type: "service_account",
  project_id: "glossy-ally-483702-h3",
  private_key_id: "9162e1d1ec5f287bf1c3b1debf3272887f766162",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1N4pFrCgFIASa\nPJjLiXgWutjJwxs8T8EJDqZs9g/QxVsDi+vCrHkHssSMLGVcPCc/cMJ87yFezo6Z\nc/+hSnhqE/4ZDY/3yruj+z8yYmEoF4QiUg6iOemyc6evqoFZh5k1RFk16Mv224En\nDf7N+OzBPO9kIr4wyRmqK3eTgRai0c/PbHsflwwORwtAvjUUaz9+WqLzYlDcSUYs\ntFgM/qsb7NPRJoCkDP4uZ9DgE1Hu7dliCBggFw6wQI36VkqC/MP//i6gCYB4O8wz\nT/QIgjukTU0PgvebyILUaiHz5RPle0w2JW5tbqIyaUPtEofxRrBifYvqhXFocZGa\nXuy+um/LAgMBAAECggEAGMXoHgCGvgtI+x7NPTHkm/2HX676PQNNc86wEKrjXEUb\n3T8WXUK/uZOGNqq7towLSisWOLG7bEms3oHS5eVCKITlfTOd7/V5M6sdUhF3Ol2w\nn2fRU/sPyBNIeVrD8Q3OSM+4VFwn70NwWKWbT4631ZjeGbXS2I99SzFDA66nfggZ\nWQqjb/tqS36mXXz97hAHPnHDmvJfVv5/n6OrARSWoanJ95WoER7mkK50s1Pts7sQ\nAmf1erL7eXynNR0hAN1Heueupi8BUHGz6X1Np61w/pv/BkDp8j3Aa3G6sH1EiV38\nNFsjUt9iyT4dWtyIvA7ljqwGPTC/bZQJXtXvehJjJQKBgQDl9/OufeNAmQ3L4FFq\nMI7xDHjHX3UeMuLgl6bUDnBtgzT2eRGlYCYh6qJ6L2KRXF9AyfkHAIXPjON3uQCk\nqRPUhiJRVN46tsXSJp/4fkRVRS0qfIZhgzuvj4VI9XBZo5KVLXKxEzdptCs2TRz4\ngMmch/6MF5OxVknidC3lgv2bdwKBgQDJutwuPL6oxruXnnfZKUmKiXSlahXQAjyW\n7P2hCtb/m383sH2tHDQr++zsADB7eJXLbZzqrB/YbLlT+122QL/ekbV0XSgiWCaL\nfuWLmzi5GqECh90T4lWq/QQuGHvBjK1iM7nK1ZVFwxqgyqW2SIJ6wZ/xaWk9LFlU\nDwOSfmP7TQKBgCS9Nhr8VZ/uU7vsfFVAqLVtzqXbZDSM4J4M3EQogmGcgouVz/Hh\nqHXmrEpk45Rhc35ARh6OQNJlqblovuePc3GSdE0WB+LNbFEkho4GbhhJUuvktPtD\nIffsL9j2DRrk/PgEKLyNW17xv62PKD+zI4J0X4A2DAxawrcA5Iw0HxwFAoGAfoEJ\n1o0NWzXVKg2cRriXf6MXXSwbpafhaxwPKVBs5zoSG1A4X7iSFwsS1iSAQs2p0jpY\n7uklx0jXJ404hTQxnldtnR1WL8Nr2IqpVFTwy1OhqL6eqvuCkYm9d1KvOP8JM84Q\nMtyhkW/6YN7z8E2kVWra7D8YWd5X3ljT+qf79vkCgYEA3UENltxRGyOSD2vqmZej\n6zvCQKyYarZTRfbzNCO9CWVUoA+ns3zrt9dndN600XDFNHRLALloaa5ZsvbvZQqB\n6nSS1KXTWq5ThqXFPUU5PMjYf/MAEayMW9YXR4tytEIr+PF9R7+5wJZ6Cf1CgcqW\nnOpgFZtEXLlij9EO2qBxUvU=\n-----END PRIVATE KEY-----\n",
  client_email: "lux-sheets@glossy-ally-483702-h3.iam.gserviceaccount.com",
  client_id: "117396812487186723260",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
};

async function initializeSheets() {
  if (isInitialized && sheetsApi) return sheetsApi;

  try {
    // 環境変数から認証情報を取得、なければローカルフォールバックを使用
    let credentials;
    if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
      try {
        credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
      } catch (e) {
        console.log('[Sheets] 環境変数のパースに失敗、ローカル認証情報を使用');
        credentials = LOCAL_CREDENTIALS;
      }
    } else {
      console.log('[Sheets] 環境変数が未設定、ローカル認証情報を使用');
      credentials = LOCAL_CREDENTIALS;
    }
    
    if (!credentials.client_email || !credentials.private_key) {
      console.log('[Sheets] 認証情報が不完全です。スプレッドシート連携は無効です。');
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheetsApi = google.sheets({ version: 'v4', auth });
    isInitialized = true;
    console.log('[Sheets] Google Sheets API 初期化完了');
    return sheetsApi;
  } catch (error) {
    console.error('[Sheets] 初期化エラー:', error);
    return null;
  }
}

// シートが存在しない場合は作成
async function ensureSheetExists(sheetName: string, headers: string[]) {
  const sheets = await initializeSheets();
  if (!sheets) return;

  try {
    // シート一覧を取得
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = response.data.sheets?.map((s: any) => s.properties?.title) || [];

    // シートが存在しない場合は作成
    if (!existingSheets.includes(sheetName)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      // ヘッダー行を追加
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });

      console.log(`[Sheets] シート "${sheetName}" を作成しました`);
    }
  } catch (error) {
    console.error(`[Sheets] シート "${sheetName}" の確認/作成エラー:`, error);
  }
}

// 行を追加
async function appendRow(sheetName: string, values: any[]) {
  const sheets = await initializeSheets();
  if (!sheets) return;

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values],
      },
    });
  } catch (error) {
    console.error(`[Sheets] 行追加エラー (${sheetName}):`, error);
  }
}

// 日時フォーマット
function formatDateTime(date: Date = new Date()): string {
  return date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

// ========== データマスタ同期 ==========

// ユーザー同期
export async function syncUser(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  openId?: string;
  companyName?: string;
  isActive?: boolean;
}, action: 'create' | 'update' | 'delete') {
  await ensureSheetExists(SHEETS.USERS, [
    'ID', 'メール', '名前', 'ロール', 'OpenID', '会社名', '有効', '最終更新', '操作'
  ]);

  await appendRow(SHEETS.USERS, [
    user.id,
    user.email,
    user.name,
    user.role,
    user.openId || '',
    user.companyName || '',
    user.isActive ? '有効' : '無効',
    formatDateTime(),
    action,
  ]);

  await logActivity('system', 'user_sync', `ユーザー ${action}: ${user.email}`, { userId: user.id });
}

// 案件同期
export async function syncAppointment(appointment: {
  id: number;
  title: string;
  industry: string;
  scale: string;
  area: string;
  bidPrice: number;
  monthlyAmount?: number;
  status: string;
  description?: string;
}, action: 'create' | 'update' | 'delete') {
  await ensureSheetExists(SHEETS.APPOINTMENTS, [
    'ID', 'タイトル', '業種', '規模', '地域', '入札価格', '月額', 'ステータス', '説明', '最終更新', '操作'
  ]);

  await appendRow(SHEETS.APPOINTMENTS, [
    appointment.id,
    appointment.title,
    appointment.industry,
    appointment.scale,
    appointment.area,
    appointment.bidPrice,
    appointment.monthlyAmount || 0,
    appointment.status,
    appointment.description || '',
    formatDateTime(),
    action,
  ]);

  await logActivity('system', 'appointment_sync', `案件 ${action}: ${appointment.title}`, { appointmentId: appointment.id });
}

// 入札同期
export async function syncBid(bid: {
  id: number;
  appointmentId: number;
  bidderId: number;
  amount: number;
  status: string;
  message?: string;
}, action: 'create' | 'update' | 'delete') {
  await ensureSheetExists(SHEETS.BIDS, [
    'ID', '案件ID', '入札者ID', '金額', 'ステータス', 'メッセージ', '最終更新', '操作'
  ]);

  await appendRow(SHEETS.BIDS, [
    bid.id,
    bid.appointmentId,
    bid.bidderId,
    bid.amount,
    bid.status,
    bid.message || '',
    formatDateTime(),
    action,
  ]);

  await logActivity('system', 'bid_sync', `入札 ${action}: 案件${bid.appointmentId}`, { bidId: bid.id });
}

// ========== 行動ログ ==========

export async function logActivity(
  userId: number | string,
  action: string,
  detail: string,
  metadata?: Record<string, any>
) {
  await ensureSheetExists(SHEETS.ACTIVITY_LOG, [
    '日時', 'ユーザーID', 'アクション', '詳細', 'メタデータ', 'IPアドレス', 'ユーザーエージェント'
  ]);

  await appendRow(SHEETS.ACTIVITY_LOG, [
    formatDateTime(),
    userId,
    action,
    detail,
    metadata ? JSON.stringify(metadata) : '',
    metadata?.ip || '',
    metadata?.userAgent || '',
  ]);
}

// ========== システムログ ==========

export async function logSystem(
  event: string,
  detail: string,
  status: 'info' | 'warning' | 'error' | 'success' = 'info'
) {
  await ensureSheetExists(SHEETS.SYSTEM_LOG, [
    '日時', 'イベント', '詳細', 'ステータス', '環境'
  ]);

  await appendRow(SHEETS.SYSTEM_LOG, [
    formatDateTime(),
    event,
    detail,
    status,
    process.env.NODE_ENV || 'development',
  ]);
}

// ========== エラーログ ==========

export async function logError(
  errorType: string,
  message: string,
  stack?: string,
  context?: Record<string, any>
) {
  await ensureSheetExists(SHEETS.ERROR_LOG, [
    '日時', 'エラー種別', 'メッセージ', 'スタックトレース', 'コンテキスト'
  ]);

  await appendRow(SHEETS.ERROR_LOG, [
    formatDateTime(),
    errorType,
    message,
    stack || '',
    context ? JSON.stringify(context) : '',
  ]);
}

// ========== パフォーマンスログ ==========

export async function logPerformance(
  endpoint: string,
  method: string,
  responseTime: number,
  statusCode: number,
  userId?: number | string
) {
  await ensureSheetExists(SHEETS.PERFORMANCE_LOG, [
    '日時', 'エンドポイント', 'メソッド', 'レスポンス時間(ms)', 'ステータスコード', 'ユーザーID'
  ]);

  await appendRow(SHEETS.PERFORMANCE_LOG, [
    formatDateTime(),
    endpoint,
    method,
    responseTime,
    statusCode,
    userId || '',
  ]);
}

// ========== 初期化 ==========

export async function initializeSpreadsheet() {
  const sheets = await initializeSheets();
  if (!sheets) {
    console.log('[Sheets] スプレッドシート連携はスキップされました');
    return false;
  }

  // 全シートを初期化
  await ensureSheetExists(SHEETS.USERS, [
    'ID', 'メール', '名前', 'ロール', 'OpenID', '会社名', '有効', '最終更新', '操作'
  ]);
  await ensureSheetExists(SHEETS.APPOINTMENTS, [
    'ID', 'タイトル', '業種', '規模', '地域', '入札価格', '月額', 'ステータス', '説明', '最終更新', '操作'
  ]);
  await ensureSheetExists(SHEETS.BIDS, [
    'ID', '案件ID', '入札者ID', '金額', 'ステータス', 'メッセージ', '最終更新', '操作'
  ]);
  await ensureSheetExists(SHEETS.ACTIVITY_LOG, [
    '日時', 'ユーザーID', 'アクション', '詳細', 'メタデータ', 'IPアドレス', 'ユーザーエージェント'
  ]);
  await ensureSheetExists(SHEETS.SYSTEM_LOG, [
    '日時', 'イベント', '詳細', 'ステータス', '環境'
  ]);
  await ensureSheetExists(SHEETS.ERROR_LOG, [
    '日時', 'エラー種別', 'メッセージ', 'スタックトレース', 'コンテキスト'
  ]);
  await ensureSheetExists(SHEETS.PERFORMANCE_LOG, [
    '日時', 'エンドポイント', 'メソッド', 'レスポンス時間(ms)', 'ステータスコード', 'ユーザーID'
  ]);

  await logSystem('server_start', 'サーバーが起動しました', 'success');
  console.log('[Sheets] 全シートの初期化完了');
  return true;
}

export default {
  syncUser,
  syncAppointment,
  syncBid,
  logActivity,
  logSystem,
  logError,
  logPerformance,
  initializeSpreadsheet,
};
