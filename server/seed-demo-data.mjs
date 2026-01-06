import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/')[3]?.split('?')[0] || 'appointment_marketplace',
});

console.log('🌱 デモデータを投入します...');

try {
  // ユーザーを作成
  const salesUser = {
    openId: 'sales-user-001',
    name: '営業太郎',
    email: 'sales@example.com',
    loginMethod: 'manus',
    role: 'sales',
    companyName: '営業部隊',
  };

  const powerCompanyUser = {
    openId: 'power-company-001',
    name: '電力花子',
    email: 'power@example.com',
    loginMethod: 'manus',
    role: 'power_company',
    companyName: '東京電力',
  };

  const adminUser = {
    openId: 'admin-user-001',
    name: '管理者太郎',
    email: 'admin@example.com',
    loginMethod: 'manus',
    role: 'admin',
    companyName: '管理部門',
  };

  // ユーザーを挿入
  await connection.execute(
    'INSERT INTO users (openId, name, email, loginMethod, role, companyName) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, email=?, companyName=?',
    [salesUser.openId, salesUser.name, salesUser.email, salesUser.loginMethod, salesUser.role, salesUser.companyName, salesUser.name, salesUser.email, salesUser.companyName]
  );

  await connection.execute(
    'INSERT INTO users (openId, name, email, loginMethod, role, companyName) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, email=?, companyName=?',
    [powerCompanyUser.openId, powerCompanyUser.name, powerCompanyUser.email, powerCompanyUser.loginMethod, powerCompanyUser.role, powerCompanyUser.companyName, powerCompanyUser.name, powerCompanyUser.email, powerCompanyUser.companyName]
  );

  await connection.execute(
    'INSERT INTO users (openId, name, email, loginMethod, role, companyName) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, email=?, companyName=?',
    [adminUser.openId, adminUser.name, adminUser.email, adminUser.loginMethod, adminUser.role, adminUser.companyName, adminUser.name, adminUser.email, adminUser.companyName]
  );

  console.log('✓ ユーザーを作成しました');

  // ユーザーIDを取得
  const [users] = await connection.execute('SELECT id, role FROM users WHERE role IN ("sales", "power_company", "admin")');
  const salesUserId = users.find(u => u.role === 'sales')?.id;
  const powerCompanyUserId = users.find(u => u.role === 'power_company')?.id;

  // 案件を作成
  const appointments = [
    {
      createdBy: salesUserId,
      title: '東京都内の大規模オフィスビル電力契約',
      industry: '不動産・ビル管理',
      scale: 'large',
      area: '東京都渋谷区',
      description: '大規模オフィスビルの電力契約。年間消費量: 500万kWh',
      status: 'active',
    },
    {
      createdBy: salesUserId,
      title: '大阪の製造工場向け電力供給',
      industry: '製造業',
      scale: 'large',
      area: '大阪府堺市',
      description: '24時間稼働の製造工場。安定供給が必須',
      status: 'active',
    },
    {
      createdBy: salesUserId,
      title: '名古屋の商業施設電力契約',
      industry: '小売・商業',
      scale: 'medium',
      area: '愛知県名古屋市',
      description: 'ショッピングモール向けの電力供給',
      status: 'active',
    },
    {
      createdBy: salesUserId,
      title: '福岡のデータセンター電力供給',
      industry: 'IT・データセンター',
      scale: 'large',
      area: '福岡県福岡市',
      description: '大規模データセンター向け。高信頼性が必須',
      status: 'active',
    },
  ];

  for (const apt of appointments) {
    await connection.execute(
      'INSERT INTO appointments (createdBy, title, industry, scale, area, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [apt.createdBy, apt.title, apt.industry, apt.scale, apt.area, apt.description, apt.status]
    );
  }

  console.log('✓ 案件を作成しました');

  // 案件IDを取得
  const [appointmentRows] = await connection.execute('SELECT id FROM appointments LIMIT 2');
  const appointmentId1 = appointmentRows[0]?.id;
  const appointmentId2 = appointmentRows[1]?.id;

  // 入札を作成
  if (appointmentId1 && powerCompanyUserId) {
    await connection.execute(
      'INSERT INTO bids (appointmentId, bidderId, bidAmount, status) VALUES (?, ?, ?, ?)',
      [appointmentId1, powerCompanyUserId, '5000000', 'pending']
    );
  }

  if (appointmentId2 && powerCompanyUserId) {
    await connection.execute(
      'INSERT INTO bids (appointmentId, bidderId, bidAmount, status) VALUES (?, ?, ?, ?)',
      [appointmentId2, powerCompanyUserId, '3500000', 'pending']
    );
  }

  console.log('✓ 入札を作成しました');

  console.log('\n✅ デモデータの投入が完了しました！');
  console.log('\n📋 作成されたユーザー:');
  console.log('  営業部隊: sales@example.com');
  console.log('  電力会社: power@example.com');
  console.log('  管理者: admin@example.com');

  await connection.end();
} catch (error) {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
}
