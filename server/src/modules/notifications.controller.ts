import { Response } from 'express';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const { rows } = await query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [user.id]);
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const { id } = req.params;
    await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, user.id]);
    return res.json({ message: 'Notification marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
