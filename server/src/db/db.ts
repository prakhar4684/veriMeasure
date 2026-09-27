import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

let dbInstance: any = null;
const dbPath = process.env.DATABASE_FILE || path.resolve(process.cwd(), 'verimeasure.db');

export async function getDb() {
  if (dbInstance) return dbInstance;

  const db = new sqlite3.Database(dbPath);

  dbInstance = {
    query: (text: string, params: any[] = []) => {
      return new Promise<{ rows: any[]; rowCount: number }>((resolve, reject) => {
        const trimmed = text.trim().toLowerCase();
        // Convert PG $1, $2 parameter placeholders safely without modifying bcrypt hashes ($2a$, $2b$)
        let sql = text.replace(/(?<![a-zA-Z0-9_])\$(\d+)(?![a-zA-Z0-9_])/g, '?');

        if (trimmed.startsWith('select') || trimmed.startsWith('pragma') || trimmed.includes('returning')) {
          db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
          });
        } else {
          db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ rows: [], rowCount: this.changes || 0 });
          });
        }
      });
    },
    exec: (sql: string) => {
      return new Promise<void>((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };

  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await db.exec(schemaSql);
  }
}

export async function query(text: string, params: any[] = []) {
  const db = await getDb();
  return db.query(text, params);
}
