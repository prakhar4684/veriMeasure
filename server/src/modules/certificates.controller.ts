import { Request, Response } from 'express';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getCertificates(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    let sql = `
      SELECT c.*, i.meter_id, i.serial_number, i.manufacturer, i.model_number, i.location_address,
             it.name as instrument_type_name, u.name as owner_name, st.stamp_number, st.seal_code
      FROM certificates c
      JOIN instruments i ON c.instrument_id = i.id
      JOIN instrument_types it ON i.instrument_type_id = it.id
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN verifications v ON c.verification_id = v.id
      LEFT JOIN stamps st ON v.id = st.verification_id
    `;
    const params: any[] = [];

    if (user.role === 'OWNER') {
      sql += ' WHERE c.owner_id = ?';
      params.push(user.id);
    }

    sql += ' ORDER BY c.issue_date DESC';
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getCertificateById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT c.*, i.meter_id, i.serial_number, i.manufacturer, i.model_number, i.capacity_specs, i.location_address, i.state, i.district,
              it.name as instrument_type_name, it.category, u.name as owner_name, o.name as organization_name,
              v.verification_date, inspector.name as inspector_name, st.stamp_number, st.seal_code, st.stamp_type
       FROM certificates c
       JOIN instruments i ON c.instrument_id = i.id
       JOIN instrument_types it ON i.instrument_type_id = it.id
       JOIN users u ON c.owner_id = u.id
       LEFT JOIN organizations o ON i.organization_id = o.id
       LEFT JOIN verifications v ON c.verification_id = v.id
       LEFT JOIN users inspector ON v.inspector_id = inspector.id
       LEFT JOIN stamps st ON v.id = st.verification_id
       WHERE c.id = ? OR c.certificate_number = ? OR c.qr_token = ?`,
      [id, id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// QuickVerify Public Unauthenticated Endpoint (accessible without login)
export async function quickVerifyPublic(req: Request, res: Response) {
  try {
    const { qrToken } = req.params;
    const { rows } = await query(
      `SELECT c.certificate_number, c.issue_date, c.valid_until, c.status as certificate_status, c.hmac_signature, c.qr_token,
              i.meter_id, i.serial_number, i.manufacturer, i.model_number, i.compliance_status, i.state, i.district,
              it.name as instrument_type_name, it.category,
              st.stamp_number, st.stamp_type, st.seal_code,
              o.name as organization_name
       FROM certificates c
       JOIN instruments i ON c.instrument_id = i.id
       JOIN instrument_types it ON i.instrument_type_id = it.id
       LEFT JOIN organizations o ON i.organization_id = o.id
       LEFT JOIN verifications v ON c.verification_id = v.id
       LEFT JOIN stamps st ON v.id = st.verification_id
       WHERE c.qr_token = ? OR c.certificate_number = ? OR i.meter_id = ?`,
      [qrToken, qrToken, qrToken]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        is_authentic: false,
        status: 'UNVERIFIED',
        message: 'Invalid or forged verification token. No matching metrology record found.'
      });
    }

    const cert = rows[0];
    const isExpired = new Date(cert.valid_until) < new Date();
    const effectiveStatus = cert.certificate_status === 'REVOKED' ? 'REVOKED' : (isExpired ? 'EXPIRED' : 'ACTIVE');

    return res.json({
      is_authentic: true,
      status: effectiveStatus,
      verification_badge: effectiveStatus === 'ACTIVE' ? 'AUTHENTIC_VERIFIED' : 'ATTENTION_REQUIRED',
      certificate: {
        certificate_number: cert.certificate_number,
        issue_date: cert.issue_date,
        valid_until: cert.valid_until,
        qr_token: cert.qr_token,
        hmac_signature: cert.hmac_signature,
        status: effectiveStatus
      },
      instrument: {
        meter_id: cert.meter_id,
        instrument_type: cert.instrument_type_name,
        category: cert.category,
        manufacturer: cert.manufacturer,
        model_number: cert.model_number,
        jurisdiction: `${cert.district}, ${cert.state}`,
        organization: cert.organization_name || 'Registered Trader'
      },
      stamp: {
        stamp_number: cert.stamp_number || 'STAMP-VERIFIED',
        stamp_type: cert.stamp_type || 'LEAD_SEAL',
        seal_code: cert.seal_code || 'SEAL-OK'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
