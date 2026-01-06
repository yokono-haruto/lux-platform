import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 10;

async function createAdminAccount() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const email = 'lux.yokono@gmail.com';
    const password = 'Cc20240515';
    const name = '管理者';
    
    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 既存ユーザーを確認
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('このメールアドレスは既に登録されています');
      const userId = existingUsers[0].id;
      
      // 既存ユーザーを管理者に更新
      await connection.execute(
        'UPDATE users SET passwordHash = ?, role = ?, name = ?, isActive = true WHERE id = ?',
        [passwordHash, 'admin', name, userId]
      );
      console.log(`✅ ユーザーID ${userId} を管理者に更新しました`);
    } else {
      // 新規ユーザーを作成
      const [result] = await connection.execute(
        `INSERT INTO users (email, name, passwordHash, role, loginMethod, isActive, createdAt, updatedAt, lastSignedIn) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [email, name, passwordHash, 'admin', 'email', true]
      );
      
      console.log(`✅ 管理者アカウントを作成しました`);
      console.log(`   メールアドレス: ${email}`);
      console.log(`   ユーザーID: ${result.insertId}`);
    }

    console.log('\n✅ 管理者アカウントの設定が完了しました');
    console.log('ログインURLにアクセスしてください: /login');
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
  } finally {
    await connection.end();
  }
}

createAdminAccount();
