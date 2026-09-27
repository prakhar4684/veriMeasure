import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { evaluateComplaintIntelligence } from '../ai/aiEngine.js';

export async function submitPublicComplaint(req: Request, res: Response) {
  try {
    const { meter_id, certificate_number, reporter_name, reporter_phone, reporter_email, complaint_type, description, lat, lng, has_photo } = req.body;

    if (!reporter_name || !reporter_phone || !reporter_email || !complaint_type || !description) {
      return res.status(400).json({ error: 'Reporter details, complaint type, and description are required' });
    }

    // Lookup instrument if meter_id or certificate_number provided
    let instrumentId = null;
    if (meter_id || certificate_number) {
      const instRow = await query(
        `SELECT i.id FROM instruments i LEFT JOIN certificates c ON c.instrument_id = i.id WHERE i.meter_id = ? OR c.certificate_number = ?`,
        [meter_id || '', certificate_number || '']
      );
      if (instRow.rows.length > 0) {
        instrumentId = instRow.rows[0].id;
      }
    }

    // Check past complaints by this reporter to prevent spamming
    const pastCmp = await query(`SELECT COUNT(*) as cnt FROM complaints WHERE reporter_email = ? OR reporter_phone = ?`, [reporter_email, reporter_phone]);
    const pastCount = Number(pastCmp.rows[0]?.cnt || 0);

    // AI Complaint Intelligence Scorer
    const intel = evaluateComplaintIntelligence({
      reporter_email,
      reporter_phone,
      description,
      has_photo: !!has_photo,
      past_complaints_by_reporter: pastCount
    });

    const cmpId = `cmp-${uuidv4().substring(0, 8)}`;
    const cmpNum = `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialStatus = intel.trigger_reinspection ? 'RE_INSPECTION_SCHEDULED' : 'SUBMITTED';

    await query(
      `INSERT INTO complaints (id, complaint_number, instrument_id, certificate_number, reporter_name, reporter_phone, reporter_email, complaint_type, description, lat, lng, credibility_score, status, flagged_for_reinspection)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cmpId,
        cmpNum,
        instrumentId,
        certificate_number || null,
        reporter_name,
        reporter_phone,
        reporter_email,
        complaint_type,
        description,
        lat || 28.6139,
        lng || 77.2090,
        intel.credibility_score,
        initialStatus,
        intel.trigger_reinspection ? 1 : 0
      ]
    );

    // If flagged for re-inspection, elevate instrument risk score
    if (instrumentId && intel.trigger_reinspection) {
      await query(`UPDATE instruments SET risk_score = MIN(100, risk_score + 35) WHERE id = ?`, [instrumentId]);
    }

    return res.status(201).json({
      message: 'Complaint Logged Successfully',
      complaint_number: cmpNum,
      credibility_score: intel.credibility_score,
      flagged_for_reinspection: intel.trigger_reinspection,
      ai_summary: intel.summary
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getComplaints(req: AuthRequest, res: Response) {
  try {
    const { rows } = await query(
      `SELECT c.*, i.meter_id, i.location_address, i.state, i.district, it.name as instrument_type_name
       FROM complaints c
       LEFT JOIN instruments i ON c.instrument_id = i.id
       LEFT JOIN instrument_types it ON i.instrument_type_id = it.id
       ORDER BY c.created_at DESC`
    );
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateComplaintStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    await query(`UPDATE complaints SET status = ? WHERE id = ?`, [status, id]);
    return res.json({ message: 'Complaint status updated', status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
