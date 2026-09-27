import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { runSmartAssign, SmartAssignCandidate } from '../ai/aiEngine.js';

export async function getSmartAssignRecommendations(req: AuthRequest, res: Response) {
  try {
    const { application_id } = req.body;
    if (!application_id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }

    // Fetch application, instrument, and category
    const appRow = await query(
      `SELECT a.*, i.meter_id, i.state, i.district, i.location_lat, i.location_lng, it.category
       FROM applications a
       JOIN instruments i ON a.instrument_id = i.id
       JOIN instrument_types it ON i.instrument_type_id = it.id
       WHERE a.id = ?`,
      [application_id]
    );

    if (appRow.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = appRow.rows[0];

    // Fetch candidate LMO users & GATCs in the state/district
    const lmoUsers = await query(
      `SELECT u.id, u.name, u.role, u.jurisdiction_state as state, u.jurisdiction_district as district, u.verification_scope as scope
       FROM users u WHERE u.role IN ('LMO', 'GATC_OPERATOR') AND u.is_active = 1`
    );

    const gatcs = await query(`SELECT g.id, g.name, g.state, g.district, g.accredited_scopes as scope, g.rating FROM gatcs g`);

    const candidates: SmartAssignCandidate[] = [];

    // Map LMO candidates
    for (const u of lmoUsers.rows) {
      const activeQueue = await query(`SELECT COUNT(*) as cnt FROM appointments WHERE assigned_user_id = ? AND status IN ('SCHEDULED', 'IN_PROGRESS')`, [u.id]);
      candidates.push({
        id: u.id,
        name: u.name,
        role: u.role,
        type: 'LMO',
        state: u.state || 'Delhi',
        district: u.district || 'Central Delhi',
        scope: typeof u.scope === 'string' ? JSON.parse(u.scope || '[]') : u.scope || [],
        current_active_cases: Number(activeQueue.rows[0]?.cnt || 0),
        lat: app.location_lat ? app.location_lat + (Math.random() * 0.04 - 0.02) : 28.6139,
        lng: app.location_lng ? app.location_lng + (Math.random() * 0.04 - 0.02) : 77.2090,
        rating: 4.8
      });
    }

    // Map GATC candidates
    for (const g of gatcs.rows) {
      const activeQueue = await query(`SELECT COUNT(*) as cnt FROM appointments WHERE assigned_gatc_id = ? AND status IN ('SCHEDULED', 'IN_PROGRESS')`, [g.id]);
      candidates.push({
        id: g.id,
        name: g.name,
        role: 'GATC_OPERATOR',
        type: 'GATC',
        state: g.state || 'Delhi',
        district: g.district || 'North Delhi',
        scope: typeof g.scope === 'string' ? JSON.parse(g.scope || '[]') : g.scope || [],
        current_active_cases: Number(activeQueue.rows[0]?.cnt || 0),
        lat: app.location_lat ? app.location_lat + 0.03 : 28.6988,
        lng: app.location_lng ? app.location_lng + 0.03 : 77.1689,
        rating: g.rating || 4.5
      });
    }

    // Run AI SmartAssign
    const recommendations = runSmartAssign({
      instrument_type_category: app.category,
      district: app.district,
      state: app.state,
      location_lat: app.location_lat || 28.6139,
      location_lng: app.location_lng || 77.2090,
      candidates
    });

    return res.json({
      application_id,
      meter_id: app.meter_id,
      category: app.category,
      jurisdiction: `${app.district}, ${app.state}`,
      recommendations
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function confirmAssignment(req: AuthRequest, res: Response) {
  try {
    const { application_id, assigned_user_id, assigned_gatc_id, scheduled_date, scheduled_slot, ai_score, ai_reason } = req.body;
    if (!application_id || (!assigned_user_id && !assigned_gatc_id)) {
      return res.status(400).json({ error: 'Application ID and verifier assignment are required' });
    }

    const aptId = `apt-${uuidv4().substring(0, 8)}`;
    await query(
      `INSERT INTO appointments (id, application_id, assigned_user_id, assigned_gatc_id, scheduled_date, scheduled_slot, status, ai_recommendation_score, ai_recommendation_reason)
       VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, ?)`,
      [
        aptId,
        application_id,
        assigned_user_id || null,
        assigned_gatc_id || null,
        scheduled_date || new Date().toISOString().split('T')[0],
        scheduled_slot || '10:00 AM - 12:00 PM',
        ai_score || 95.0,
        ai_reason || 'Manual SmartAssign Selection'
      ]
    );

    // Update application status to ASSIGNED and SCHEDULED
    await query(`UPDATE applications SET status = 'SCHEDULED' WHERE id = ?`, [application_id]);

    return res.json({
      message: 'Verifier Assigned & Appointment Scheduled Successfully',
      appointment_id: aptId,
      status: 'SCHEDULED'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
