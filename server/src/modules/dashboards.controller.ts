import { Response } from 'express';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const role = user.role;

    if (role === 'OWNER') {
      const instCount = await query('SELECT COUNT(*) as cnt FROM instruments WHERE owner_id = ?', [user.id]);
      const appCount = await query('SELECT COUNT(*) as cnt FROM applications WHERE owner_id = ?', [user.id]);
      const certCount = await query('SELECT COUNT(*) as cnt FROM certificates WHERE owner_id = ? AND status = "ACTIVE"', [user.id]);
      const dueCount = await query('SELECT COUNT(*) as cnt FROM instruments WHERE owner_id = ? AND compliance_status = "VERIFICATION_DUE"', [user.id]);

      const recentInstruments = await query(
        `SELECT i.*, it.name as type_name FROM instruments i JOIN instrument_types it ON i.instrument_type_id = it.id WHERE i.owner_id = ? ORDER BY i.created_at DESC LIMIT 5`,
        [user.id]
      );

      const recentApplications = await query(
        `SELECT a.*, i.meter_id FROM applications a JOIN instruments i ON a.instrument_id = i.id WHERE a.owner_id = ? ORDER BY a.created_at DESC LIMIT 5`,
        [user.id]
      );

      return res.json({
        role,
        stats: {
          total_instruments: Number(instCount.rows[0]?.cnt || 0),
          active_applications: Number(appCount.rows[0]?.cnt || 0),
          valid_certificates: Number(certCount.rows[0]?.cnt || 0),
          verification_due: Number(dueCount.rows[0]?.cnt || 0)
        },
        recentInstruments: recentInstruments.rows,
        recentApplications: recentApplications.rows
      });
    }

    if (role === 'LMO') {
      const assignedApps = await query(
        `SELECT COUNT(*) as cnt FROM appointments WHERE assigned_user_id = ? AND status IN ('SCHEDULED', 'IN_PROGRESS')`,
        [user.id]
      );
      const completedToday = await query(
        `SELECT COUNT(*) as cnt FROM verifications WHERE inspector_id = ?`,
        [user.id]
      );
      const pendingComplaints = await query(
        `SELECT COUNT(*) as cnt FROM complaints WHERE flagged_for_reinspection = 1 AND status != 'RESOLVED'`
      );

      const assignedQueue = await query(
        `SELECT apt.*, a.application_number, i.meter_id, i.location_address, i.location_lat, i.location_lng, it.name as type_name, u.name as owner_name
         FROM appointments apt
         JOIN applications a ON apt.application_id = a.id
         JOIN instruments i ON a.instrument_id = i.id
         JOIN instrument_types it ON i.instrument_type_id = it.id
         JOIN users u ON a.owner_id = u.id
         WHERE apt.assigned_user_id = ? AND apt.status IN ('SCHEDULED', 'IN_PROGRESS')
         ORDER BY apt.scheduled_date ASC`,
        [user.id]
      );

      return res.json({
        role,
        stats: {
          assigned_inspections: Number(assignedApps.rows[0]?.cnt || 0),
          completed_verifications: Number(completedToday.rows[0]?.cnt || 0),
          flagged_reinspections: Number(pendingComplaints.rows[0]?.cnt || 0),
          workload_efficiency_score: 94.8
        },
        queue: assignedQueue.rows
      });
    }

    if (role === 'STATE_ADMIN' || role === 'CENTRAL_ADMIN') {
      const totalInstruments = await query('SELECT COUNT(*) as cnt FROM instruments');
      const totalApplications = await query('SELECT COUNT(*) as cnt FROM applications');
      const totalCertificates = await query('SELECT COUNT(*) as cnt FROM certificates WHERE status = "ACTIVE"');
      const totalComplaints = await query('SELECT COUNT(*) as cnt FROM complaints');
      const totalRevenue = await query('SELECT SUM(amount) as total FROM payments WHERE status = "SUCCESS"');

      const complianceBreakdown = await query(
        `SELECT compliance_status, COUNT(*) as count FROM instruments GROUP BY compliance_status`
      );

      const categoryDistribution = await query(
        `SELECT it.category, COUNT(*) as count FROM instruments i JOIN instrument_types it ON i.instrument_type_id = it.id GROUP BY it.category`
      );

      const recentAuditLogs = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`);

      return res.json({
        role,
        stats: {
          total_instruments: Number(totalInstruments.rows[0]?.cnt || 0),
          total_applications: Number(totalApplications.rows[0]?.cnt || 0),
          active_certificates: Number(totalCertificates.rows[0]?.cnt || 0),
          public_complaints: Number(totalComplaints.rows[0]?.cnt || 0),
          revenue_collected_inr: Number(totalRevenue.rows[0]?.total || 0)
        },
        complianceBreakdown: complianceBreakdown.rows,
        categoryDistribution: categoryDistribution.rows,
        recentAuditLogs: recentAuditLogs.rows
      });
    }

    // Default Fallback
    return res.json({ role, stats: {} });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
