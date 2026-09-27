import bcrypt from 'bcryptjs';
import { initDb, query } from '../db/db.js';
import { seedDatabase } from '../db/seed.js';

async function testAuth() {
  await initDb();
  await seedDatabase();

  const email = 'trader@metrology.gov.in';
  const pass = 'password123';

  const { rows } = await query('SELECT * FROM users WHERE email = ?', [email]);
  console.log('Query result rows:', rows);

  if (rows.length === 0) {
    console.error('User not found!');
    return;
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(pass, user.password_hash);
  console.log('Bcrypt compare result:', isMatch);
}

testAuth();
