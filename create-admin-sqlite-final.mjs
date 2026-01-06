import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { users } from './drizzle/schema.ts';

const SALT_ROUNDS = 10;
const sqlite = new Database('local.db');
const db = drizzle(sqlite);

async function createAdminAccount() {
  const email = 'lux.yokono@gmail.com';
  const password = 'Cc20240515';
  const name = '管理者';
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    await db.insert(users).values({
      email,
      name,
      passwordHash,
      role: 'admin',
      loginMethod: 'email',
      isActive: true,
      openId: 'admin-openid',
    });
    console.log('✅ 管理者アカウントを作成しました');
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

createAdminAccount();
