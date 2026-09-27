import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getApplications(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    let sql = `
      SELECT a.*, i.meter_id, i.serial_number, i.location_address, i.state, i.district,
             it.name as instrument_type_name, it.category, u.name as owner_name,
             apt.scheduled_date, apt.scheduled_slot, apt.status as appointment_status,
             inspector.name as assigned_inspector_name
      FROM applications a
      JOIN instruments i ON a.instrument_id = i.id
      JOIN instrument_types it ON i.instrument_type_id = it.id
      JOIN users u ON a.owner_id = u.id
      LEFT JOIN appointments apt ON a.id = apt.application_id
      LEFT JOIN users inspector ON apt.assigned_user_id = inspector.id
    `;
    const params: any[] = [];

    if (user.role === 'OWNER') {
      sql += ' WHERE a.owner_id = ?';
      params.push(user.id);
    } else if (user.role === 'LMO') {
      sql += ' WHERE (apt.assigned_user_id = ? OR (i.state = ? AND i.district = ?))';
      params.push(user.id, user.jurisdiction_state || 'Delhi', user.jurisdiction_district || 'Central Delhi');
    }

    sql += ' ORDER BY a.created_at DESC';
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createApplication(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const { instrument_id, application_type, notes } = req.body;

    if (!instrument_id || !application_type) {
      return res.status(400).json({ error: 'Instrument ID and application type are required' });
    }

    // Fetch instrument and fee base
    const instRow = await query(
      `SELECT i.*, it.fee_base_amount FROM instruments i JOIN instrument_types it ON i.instrument_type_id = it.id WHERE i.id = ?`,
      [instrument_id]
    );

    if (instRow.rows.length === 0) {
      return res.status(404).json({ error: 'Instrument not found' });
    }

    const inst = instRow.rows[0];
    const appId = `app-${uuidv4().substring(0, 8)}`;
    const appNum = `AP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const feeAmount = inst.fee_base_amount || 500.0;

    await query(
      `INSERT INTO applications (id, application_number, instrument_id, owner_id, application_type, status, fee_amount, notes)
       VALUES (?, ?, ?, ?, ?, 'PAYMENT_PENDING', ?, ?)`,
      [appId, appNum, instrument_id, user.id, application_type, feeAmount, notes || 'Standard re-verification application']
    );

    // Create payment order record
    const payId = `pay-${uuidv4().substring(0, 8)}`;
    const txnRef = `TXN-PAYLM-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    await query(
      `INSERT INTO payments (id, application_id, transaction_ref, payment_gateway, amount, currency, status)
       VALUES (?, ?, ?, 'PayLM Treasury Gateway', ?, 'INR', 'PENDING')`,
      [payId, appId, txnRef, feeAmount]
    );

    // Update instrument compliance state
    await query(`UPDATE instruments SET compliance_status = 'UNDER_VERIFICATION' WHERE id = ?`, [instrument_id]);

    return res.status(201).json({
      message: 'Application Submitted Successfully',
      application_id: appId,
      application_number: appNum,
      fee_amount: feeAmount,
      transaction_ref: txnRef
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getTrackFlowTimeline(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT a.*, i.meter_id, i.serial_number, it.name as instrument_type_name,
              p.transaction_ref, p.status as payment_status, p.amount as fee_paid,
              apt.scheduled_date, apt.scheduled_slot, apt.status as appointment_status,
              inspector.name as inspector_name, inspector.phone as inspector_phone,
              v.overall_result, v.verification_date,
              c.certificate_number, c.qr_token, c.valid_until
       FROM applications a
       JOIN instruments i ON a.instrument_id = i.id
       JOIN instrument_types it ON i.instrument_type_id = it.id
       LEFT JOIN payments p ON a.id = p.application_id
       LEFT JOIN appointments apt ON a.id = apt.application_id
       LEFT JOIN users inspector ON apt.assigned_user_id = inspector.id
       LEFT JOIN verifications v ON a.id = v.application_id
       LEFT JOIN certificates c ON v.id = c.verification_id
       WHERE a.id = ? OR a.application_number = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Application tracking record not found' });
    }

    const app = rows[0];

    // Construct 6-step lifecycle timeline
    const steps = [
      { step: 1, title: 'Draft & Submission', status: 'COMPLETED', date: app.submission_date, detail: `Submitted (${app.application_type})` },
      { step: 2, title: 'PayLM Treasury Payment', status: app.payment_status === 'SUCCESS' ? 'COMPLETED' : 'PENDING', date: app.submission_date, detail: `Fee ₹${app.fee_amount} (${app.payment_status || 'PENDING'})` },
      { step: 3, title: 'SmartAssign Inspector Assignment', status: app.inspector_name ? 'COMPLETED' : 'PENDING', detail: app.inspector_name ? `Assigned to LMO ${app.inspector_name}` : 'Awaiting AI SmartAssign dispatch' },
      { step: 4, title: 'Inspection Appointment', status: app.appointment_status === 'COMPLETED' ? 'COMPLETED' : (app.scheduled_date ? 'IN_PROGRESS' : 'PENDING'), detail: app.scheduled_date ? `Scheduled for ${app.scheduled_date} (${app.scheduled_slot})` : 'Awaiting appointment schedule' },
      { step: 5, title: 'FieldVerify Inspection', status: app.overall_result ? 'COMPLETED' : 'PENDING', detail: app.overall_result ? `Result: ${app.overall_result}` : 'Field inspection pending' },
      { step: 6, title: 'CertiSure Certificate Issuance', status: app.certificate_number ? 'COMPLETED' : 'PENDING', detail: app.certificate_number ? `Certificate Issued (${app.certificate_number})` : 'Awaiting certification' }
    ];

    return res.json({ application: app, steps });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
