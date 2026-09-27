import { Response } from 'express';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function processPayment(req: AuthRequest, res: Response) {
  try {
    const { application_id, payment_method } = req.body;
    if (!application_id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    const payRow = await query('SELECT * FROM payments WHERE application_id = ?', [application_id]);
    if (payRow.rows.length === 0) {
      return res.status(404).json({ error: 'Payment order record not found' });
    }

    const pay = payRow.rows[0];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update payment status to SUCCESS
    await query(
      `UPDATE payments SET status = 'SUCCESS', payment_date = ?, payment_gateway = ?, receipt_url = ? WHERE id = ?`,
      [now, payment_method || 'PayLM e-GRAS Gateway', `/receipts/${pay.transaction_ref}.pdf`, pay.id]
    );

    // Transition application status to PAYMENT_COMPLETED
    await query(`UPDATE applications SET status = 'PAYMENT_COMPLETED' WHERE id = ?`, [application_id]);

    return res.json({
      message: 'Payment Successful',
      transaction_ref: pay.transaction_ref,
      amount: pay.amount,
      status: 'SUCCESS',
      receipt_url: `/receipts/${pay.transaction_ref}.pdf`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
