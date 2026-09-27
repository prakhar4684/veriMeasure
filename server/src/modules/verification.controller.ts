import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { detectVerificationAnomaly } from '../ai/aiEngine.js';

export async function getTestMatrixSchema(req: AuthRequest, res: Response) {
  try {
    const { application_id } = req.params;

    const appRow = await query(
      `SELECT a.*, i.meter_id, i.serial_number, i.capacity_specs, it.name as instrument_type_name, it.category, r.mpe_json, r.test_procedure_json
       FROM applications a
       JOIN instruments i ON a.instrument_id = i.id
       JOIN instrument_types it ON i.instrument_type_id = it.id
       LEFT JOIN rules r ON r.instrument_type_id = it.id
       WHERE a.id = ?`,
      [application_id]
    );

    if (appRow.rows.length === 0) {
      return res.status(404).json({ error: 'Application record not found' });
    }

    const app = appRow.rows[0];
    const specs = typeof app.capacity_specs === 'string' ? JSON.parse(app.capacity_specs) : app.capacity_specs || {};

    // Dynamic test matrix generation based on instrument type category & legal rules
    let tests: any[] = [];
    if (app.category === 'WEIGHING') {
      const e = specs.verification_scale_e || 5;
      tests = [
        { name: 'Zero Load Test', param: 'Zero Offset', target: 0, min: -0.5 * e, max: 0.5 * e, unit: 'g' },
        { name: 'Eccentric Load (Corner 1)', param: 'Corner 1 Load Error', target: 10000, min: 9995, max: 10005, unit: 'g' },
        { name: 'Eccentric Load (Corner 2)', param: 'Corner 2 Load Error', target: 10000, min: 9995, max: 10005, unit: 'g' },
        { name: 'Max Capacity MPE Test', param: 'Full Load Error', target: specs.max_capacity || 50000, min: (specs.max_capacity || 50000) - 15, max: (specs.max_capacity || 50000) + 15, unit: 'g' }
      ];
    } else if (app.category === 'VOLUME') {
      tests = [
        { name: 'Qmin Minimum Flow Rate Test', param: 'Flow Accuracy', target: 0.05, min: 0.048, max: 0.052, unit: 'm3/h' },
        { name: 'Qn Nominal Flow Rate Test', param: 'Nominal Accuracy', target: 2.5, min: 2.45, max: 2.55, unit: 'm3/h' }
      ];
    } else if (app.category === 'MEASURING') {
      tests = [
        { name: '5 Litre Standard Measure Test', param: 'Delivery Error', target: 5.0, min: 4.975, max: 5.025, unit: 'L' },
        { name: '10 Litre High Speed Test', param: 'Delivery Error', target: 10.0, min: 9.95, max: 10.05, unit: 'L' }
      ];
    } else {
      tests = [
        { name: 'Calibration Test Point 37°C', param: 'Thermal Accuracy', target: 37.0, min: 36.9, max: 37.1, unit: '°C' },
        { name: 'Calibration Test Point 40°C', param: 'Thermal Accuracy', target: 40.0, min: 39.9, max: 40.1, unit: '°C' }
      ];
    }

    return res.json({
      application_id,
      meter_id: app.meter_id,
      instrument_type: app.instrument_type_name,
      category: app.category,
      specs,
      tests
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function submitVerificationInspection(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;
    const { application_id, test_readings, inspection_lat, inspection_lng, actual_duration_mins, inspector_notes } = req.body;

    if (!application_id || !test_readings || !Array.isArray(test_readings)) {
      return res.status(400).json({ error: 'Application ID and test readings array are required' });
    }

    const appRow = await query(
      `SELECT a.*, i.id as instrument_id, i.owner_id, i.meter_id FROM applications a JOIN instruments i ON a.instrument_id = i.id WHERE a.id = ?`,
      [application_id]
    );

    if (appRow.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = appRow.rows[0];

    // 1. Evaluate PASS/FAIL for each test reading against statutory bounds
    let overallResult: 'PASS' | 'FAIL' = 'PASS';
    let failureReasons: string[] = [];

    const evaluatedTests = test_readings.map((t: any) => {
      const isPass = t.observed_value >= t.min_allowed && t.observed_value <= t.max_allowed;
      if (!isPass) {
        overallResult = 'FAIL';
        failureReasons.push(`Test '${t.test_name}' failed: Observed ${t.observed_value} ${t.unit} outside allowed range [${t.min_allowed}, ${t.max_allowed}].`);
      }
      return {
        ...t,
        result: isPass ? 'PASS' : 'FAIL'
      };
    });

    // 2. Run AI Anomaly Detection on test readings
    const anomalyReport = detectVerificationAnomaly(test_readings);

    // 3. Create Verification Record
    const verifId = `verif-${uuidv4().substring(0, 8)}`;
    await query(
      `INSERT INTO verifications (id, application_id, instrument_id, inspector_id, verification_date, inspection_location_lat, inspection_location_lng, overall_result, failure_reason, anomaly_flag, predicted_duration_mins, actual_duration_mins)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 45, ?)`,
      [
        verifId,
        application_id,
        app.instrument_id,
        user.id,
        inspection_lat || 28.6139,
        inspection_lng || 77.2090,
        overallResult,
        failureReasons.length > 0 ? failureReasons.join('; ') : null,
        anomalyReport.has_anomaly ? 1 : 0,
        actual_duration_mins || 45
      ]
    );

    // 4. Save individual verification test readings
    for (const t of evaluatedTests) {
      await query(
        `INSERT INTO verification_tests (id, verification_id, test_name, parameter_name, target_value, observed_value, min_allowed, max_allowed, unit, result, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`vt-${uuidv4().substring(0, 8)}`, verifId, t.test_name, t.parameter_name, t.target_value, t.observed_value, t.min_allowed, t.max_allowed, t.unit, t.result, t.notes || 'FieldVerify Entry']
      );
    }

    let certificateData = null;

    if (overallResult === 'PASS') {
      // 5. Apply Stamp Record
      const stampId = `stamp-${uuidv4().substring(0, 8)}`;
      const stampNum = `LM-STAMP-DL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const sealCode = `SEAL-SEC-${Math.floor(100000 + Math.random() * 900000)}`;
      const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);

      await query(
        `INSERT INTO stamps (id, verification_id, stamp_number, stamp_type, seal_code, applied_date, expiry_date)
         VALUES (?, ?, ?, 'LEAD_SEAL', ?, CURRENT_TIMESTAMP, ?)`,
        [stampId, verifId, stampNum, sealCode, validUntil]
      );

      // 6. CertiSure - Generate Cryptographic Digital Certificate & QR Token
      const certId = `cert-${uuidv4().substring(0, 8)}`;
      const certNum = `LM/CERT/2026/${Math.floor(10000 + Math.random() * 90000)}`;
      const qrToken = `QR-CERT-${app.meter_id}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create HMAC digital signature metadata
      const hmac = crypto.createHmac('sha256', 'verimeasure-cert-secret-key');
      hmac.update(`${certNum}:${app.meter_id}:${app.instrument_id}:${validUntil}:${stampNum}`);
      const hmacSignature = `HMAC-SHA256-${hmac.digest('hex').substring(0, 32).toUpperCase()}`;

      await query(
        `INSERT INTO certificates (id, certificate_number, verification_id, instrument_id, owner_id, issue_date, valid_until, qr_token, hmac_signature, status)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, 'ACTIVE')`,
        [certId, certNum, verifId, app.instrument_id, app.owner_id, validUntil, qrToken, hmacSignature]
      );

      // Update instrument status to ACTIVE
      await query(`UPDATE instruments SET compliance_status = 'ACTIVE', risk_score = 10 WHERE id = ?`, [app.instrument_id]);

      // Update application status to COMPLETED
      await query(`UPDATE applications SET status = 'COMPLETED' WHERE id = ?`, [application_id]);

      // Trigger notification for Owner
      await query(
        `INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, 'SUCCESS', ?)`,
        [`notif-${uuidv4().substring(0, 8)}`, app.owner_id, 'Verification Certificate Issued', `Certificate ${certNum} generated for instrument ${app.meter_id}. Valid until ${validUntil.split(' ')[0]}.`, `/certificates/${certId}`]
      );

      certificateData = { certId, certNum, qrToken, hmacSignature, validUntil, stampNum };
    } else {
      // Failed Verification update
      await query(`UPDATE instruments SET compliance_status = 'REJECTED', risk_score = 80 WHERE id = ?`, [app.instrument_id]);
      await query(`UPDATE applications SET status = 'REJECTED' WHERE id = ?`, [application_id]);
    }

    return res.json({
      message: overallResult === 'PASS' ? 'Field Verification Passed & Digital Certificate Issued' : 'Field Verification Failed',
      overall_result: overallResult,
      verification_id: verifId,
      anomaly_report: anomalyReport,
      certificate: certificateData
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
