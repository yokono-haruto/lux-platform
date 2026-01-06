import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function run() {
  // サーバープロセスから取得した環境変数を使用
  const dbUrl = "mysql://root:f9a723baa3706635@localhost:3306/appointment_marketplace";
  
  try {
    const connection = await mysql.createConnection(dbUrl);
    const email = 'lux.yokono@gmail.com';
    const password = 'Cc20240515';
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await connection.execute(
      "INSERT INTO users (email, name, passwordHash, role, loginMethod, isActive, openId) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [email, '管理者', passwordHash, 'admin', 'email', true, 'admin-direct']
    );
    console.log('✅ Success');
    await connection.end();
  } catch (e) {
    console.log('Error:', e.message);
  }
}
run();
