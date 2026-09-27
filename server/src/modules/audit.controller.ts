import { Response } from 'express';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const { rows } = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
