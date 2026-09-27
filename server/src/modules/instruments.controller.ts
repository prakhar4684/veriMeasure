import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { calculateMetrologyRiskScore } from '../ai/aiEngine.js';

export async function getInstrumentTypes(req: AuthRequest, res: Response) {
  try {
    const { rows } = await query('SELECT * FROM instrument_types ORDER BY name ASC');
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getInstruments(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    let sql = `
      SELECT i.*, it.name as instrument_type_name, it.category, u.name as owner_name, o.name as organization_name
      FROM instruments i
      JOIN instrument_types it ON i.instrument_type_id = it.id
      JOIN users u ON i.owner_id = u.id
      LEFT JOIN organizations o ON i.organization_id = o.id
    `;
    const params: any[] = [];

    if (user.role === 'OWNER') {
      sql += ' WHERE i.owner_id = ?';
      params.push(user.id);
    } else if (user.role === 'LMO') {
      sql += ' WHERE i.state = ? AND i.district = ?';
      params.push(user.jurisdiction_state || 'Delhi', user.jurisdiction_district || 'Central Delhi');
    }

    sql += ' ORDER BY i.created_at DESC';
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getInstrumentPassport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    // Can search by DB ID or MeterID
    const { rows } = await query(
      `SELECT i.*, it.name as instrument_type_name, it.category, it.spec_schema,
              u.name as owner_name, u.email as owner_email, u.phone as owner_phone, o.name as organization_name
       FROM instruments i
       JOIN instrument_types it ON i.instrument_type_id = it.id
       JOIN users u ON i.owner_id = u.id
       LEFT JOIN organizations o ON i.organization_id = o.id
       WHERE i.id = ? OR i.meter_id = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Instrument passport not found' });
    }

    const instrument = rows[0];

    // Fetch verification history
    const verifications = await query(
      `SELECT v.*, u.name as inspector_name, c.certificate_number, c.qr_token, c.status as cert_status
       FROM verifications v
       LEFT JOIN users u ON v.inspector_id = u.id
       LEFT JOIN certificates c ON v.id = c.verification_id
       WHERE v.instrument_id = ? ORDER BY v.verification_date DESC`,
      [instrument.id]
    );

    // Fetch complaints history
    const complaints = await query(
      `SELECT * FROM complaints WHERE instrument_id = ? ORDER BY created_at DESC`,
      [instrument.id]
    );

    // Fetch dynamic AI risk score
    const ageMonths = 18; // Derived or static approximation
    const riskAnalysis = calculateMetrologyRiskScore({
      age_months: ageMonths,
      complaint_count: complaints.rows.length,
      past_failures: verifications.rows.filter((v: any) => v.overall_result === 'FAIL').length,
      compliance_status: instrument.compliance_status
    });

    return res.json({
      instrument,
      verifications: verifications.rows,
      complaints: complaints.rows,
      riskAnalysis
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function registerInstrument(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const { serial_number, manufacturer, model_number, instrument_type_id, capacity_specs, location_address, location_lat, location_lng, state, district } = req.body;

    if (!serial_number || !manufacturer || !model_number || !instrument_type_id) {
      return res.status(400).json({ error: 'Missing required technical parameters' });
    }

    // Fetch Type Code for MeterID generation
    const typeRow = await query('SELECT code, category FROM instrument_types WHERE id = ?', [instrument_type_id]);
    if (typeRow.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid instrument type ID' });
    }

    const categoryCode = typeRow.rows[0].code.split('-')[0]; // e.g. EWI, WB, WM
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const meterId = `LM-2026-${categoryCode}-${randomSuffix}`;
    const instId = `inst-${uuidv4().substring(0, 8)}`;

    await query(
      `INSERT INTO instruments (id, meter_id, serial_number, manufacturer, model_number, owner_id, organization_id, instrument_type_id, capacity_specs, location_address, location_lat, location_lng, state, district, compliance_status, risk_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFICATION_DUE', 10)`,
      [
        instId,
        meterId,
        serial_number,
        manufacturer,
        model_number,
        user.id,
        user.organization_id || null,
        instrument_type_id,
        typeof capacity_specs === 'object' ? JSON.stringify(capacity_specs) : capacity_specs,
        location_address || 'Registered Business Premises',
        location_lat || 28.6139,
        location_lng || 77.2090,
        state || user.jurisdiction_state || 'Delhi',
        district || user.jurisdiction_district || 'Central Delhi'
      ]
    );

    // Record audit log
    await query(
      `INSERT INTO audit_logs (id, user_id, user_email, action, entity_name, entity_id, changes_json) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`audit-${uuidv4().substring(0, 8)}`, user.id, user.email, 'REGISTER_INSTRUMENT', 'instruments', instId, JSON.stringify({ meter_id: meterId, serial_number })]
    );

    return res.status(201).json({
      message: 'Instrument Digital Passport Created Successfully',
      instrument_id: instId,
      meter_id: meterId
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
