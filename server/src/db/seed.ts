import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { initDb, query } from './db.js';

export async function seedDatabase() {
  console.log('🌱 Starting Database Seeding for VeriMeasure Legal Metrology Platform...');

  await initDb();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Organizations
  const orgTraderId = 'org-trader-01';
  const orgGovId = 'org-gov-01';
  const orgGatcId = 'org-gatc-01';

  await query(`INSERT OR REPLACE INTO organizations (id, name, type, registration_no, state, district, address) VALUES
    ('${orgTraderId}', 'Apex Grain Traders Pvt Ltd', 'BUSINESS', 'GSTIN07AAACA1234A1Z5', 'Delhi', 'Central Delhi', 'Plot 42, Lawrence Road Industrial Area, Delhi - 110035'),
    ('${orgGovId}', 'Department of Legal Metrology - Delhi Circle', 'GOVERNMENT_DEPT', 'GOV-DL-LM-01', 'Delhi', 'New Delhi', 'Vikas Bhawan, I.P. Estate, New Delhi - 110002'),
    ('${orgGatcId}', 'National Metrology Test & Calibration Lab GATC', 'GATC', 'GATC-DEL-2024-09', 'Delhi', 'North Delhi', 'Block C, Wazirpur Industrial Area, Delhi - 110052')
  `);

  // 2. Users (5 Roles) - Parameterized query for password_hash safety
  const userOwner = 'usr-owner-01';
  const userLmo = 'usr-lmo-01';
  const userGatc = 'usr-gatc-01';
  const userStateAdmin = 'usr-stateadmin-01';
  const userCentralAdmin = 'usr-centraladmin-01';

  const demoUsers = [
    [userOwner, 'Rajesh Kumar (Trader)', 'trader@metrology.gov.in', passwordHash, 'OWNER', '+91 98765 43210', orgTraderId, 'Delhi', 'Central Delhi', JSON.stringify(['WEIGHING', 'MEASURING'])],
    [userLmo, 'Inspector V.K. Sharma (LMO)', 'lmo.delhi@metrology.gov.in', passwordHash, 'LMO', '+91 98111 22334', orgGovId, 'Delhi', 'Central Delhi', JSON.stringify(['WEIGHING', 'MEASURING', 'VOLUME'])],
    [userGatc, 'Dr. Ananya Roy (GATC Operator)', 'gatc.operator@metrology.gov.in', passwordHash, 'GATC_OPERATOR', '+91 98222 33445', orgGatcId, 'Delhi', 'North Delhi', JSON.stringify(['WEIGHING', 'TEMPERATURE', 'VOLUME'])],
    [userStateAdmin, 'Sanjeev Mehta (Controller Legal Metrology)', 'state.admin@metrology.gov.in', passwordHash, 'STATE_ADMIN', '+91 98333 44556', orgGovId, 'Delhi', 'All Districts', JSON.stringify(['ALL'])],
    [userCentralAdmin, 'Director Metrology India (Central)', 'admin@metrology.gov.in', passwordHash, 'CENTRAL_ADMIN', '+91 98444 55667', orgGovId, 'All States', 'National', JSON.stringify(['ALL'])]
  ];

  for (const u of demoUsers) {
    await query(
      `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, organization_id, jurisdiction_state, jurisdiction_district, verification_scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      u
    );
  }

  // 3. Instrument Types
  const typeEwi = 'type-ewi-01';
  const typeWb = 'type-wb-01';
  const typeWm = 'type-wm-01';
  const typeFuel = 'type-fuel-01';
  const typeTherm = 'type-therm-01';

  const specEwi = JSON.stringify({ min_capacity: 100, max_capacity: 50000, scale_interval_d: 5, verification_scale_e: 5, accuracy_class: 'Class III', unit: 'g' });
  const specWb = JSON.stringify({ min_capacity: 1000, max_capacity: 60000, scale_interval_d: 10, verification_scale_e: 10, accuracy_class: 'Class IV Heavy', unit: 'kg' });
  const specWm = JSON.stringify({ nominal_flow_qn: 2.5, max_flow_qmax: 5.0, min_flow_qmin: 0.05, pipe_diameter_mm: 15, unit: 'm3/h' });
  const specFuel = JSON.stringify({ max_flow_rate: 50.0, min_flow_rate: 5.0, minimum_delivery: 2.0, nozzle_count: 2, unit: 'L/min' });
  const specTherm = JSON.stringify({ range_min: 35.0, range_max: 42.0, scale_interval: 0.1, sensor_type: 'Digital Thermistor', unit: '°C' });

  await query(`INSERT OR REPLACE INTO instrument_types (id, code, name, category, default_validity_months, fee_base_amount, fee_formula, spec_schema) VALUES
    ('${typeEwi}', 'EWI-CLASS3', 'Electronic Non-Automatic Weighing Instrument', 'WEIGHING', 12, 500.0, 'base', '${specEwi}'),
    ('${typeWb}', 'WEIGHBRIDGE-HV', 'Pitless Heavy Industrial Weighbridge', 'WEIGHING', 12, 2500.0, 'base_plus_capacity', '${specWb}'),
    ('${typeWm}', 'WATER-METER-DN15', 'Cold Water Meter DN15', 'VOLUME', 24, 350.0, 'base', '${specWm}'),
    ('${typeFuel}', 'FUEL-DISPENSER-MPD', 'Multi-Product Fuel Dispenser Pump', 'MEASURING', 12, 1800.0, 'per_nozzle', '${specFuel}'),
    ('${typeTherm}', 'CLINICAL-THERM-DIG', 'Clinical Digital Thermometer', 'TEMPERATURE', 24, 150.0, 'base', '${specTherm}')
  `);

  // 4. Rules (Statutory Max Permissible Error Tolerances)
  const ruleEwi = JSON.stringify({
    mpe_load_points: [
      { min_e: 0, max_e: 500, mpe_verification: 0.5, mpe_service: 1.0, unit: 'e' },
      { min_e: 501, max_e: 2000, mpe_verification: 1.0, mpe_service: 2.0, unit: 'e' },
      { min_e: 2001, max_e: 10000, mpe_verification: 1.5, mpe_service: 3.0, unit: 'e' }
    ],
    tests: ['Zero Load Test', 'Eccentric Load Test', 'Repeatability Test', 'Maximum Permissible Error Test']
  });

  const ruleWb = JSON.stringify({
    mpe_load_points: [
      { min_kg: 0, max_kg: 10000, tolerance_kg: 10 },
      { min_kg: 10001, max_kg: 40000, tolerance_kg: 20 },
      { min_kg: 40001, max_kg: 60000, tolerance_kg: 30 }
    ],
    tests: ['Zero Tracking Test', 'Corner Load Test', 'Increasing/Decreasing Load Test', 'Strain Gauge Calibration']
  });

  await query(`INSERT OR REPLACE INTO rules (id, instrument_type_id, title, rule_code, legal_act_ref, mpe_json, test_procedure_json, is_active) VALUES
    ('rule-ewi-01', '${typeEwi}', 'Legal Metrology (General) Rules 2011 - Schedule VII Part I', 'LM-RULE-EWI-2011', 'Section 24, LM Act 2009', '${ruleEwi}', '${ruleEwi}', 1),
    ('rule-wb-01', '${typeWb}', 'Legal Metrology Rules 2011 - Schedule VII Part II (Weighbridges)', 'LM-RULE-WB-2011', 'Section 24, LM Act 2009', '${ruleWb}', '${ruleWb}', 1)
  `);

  // 5. GATCs
  await query(`INSERT OR REPLACE INTO gatcs (id, name, code, state, district, address, accredited_scopes, rating, contact_email) VALUES
    ('${orgGatcId}', 'National Metrology Test & Calibration Lab GATC', 'GATC-DEL-01', 'Delhi', 'North Delhi', 'Block C, Wazirpur Industrial Area, Delhi - 110052', '["WEIGHING", "TEMPERATURE", "VOLUME"]', 4.8, 'gatc.delhi@metrology.gov.in')
  `);

  // 6. Registered Instruments with persistent MeterIDs
  const inst1 = 'inst-01';
  const inst2 = 'inst-02';
  const inst3 = 'inst-03';
  const inst4 = 'inst-04';

  const specsInst1 = JSON.stringify({ min_capacity: 100, max_capacity: 50000, scale_interval_d: 5, verification_scale_e: 5, accuracy_class: 'Class III', unit: 'g', serial_no: 'SN-EWI-99410' });
  const specsInst2 = JSON.stringify({ min_capacity: 1000, max_capacity: 60000, scale_interval_d: 10, verification_scale_e: 10, accuracy_class: 'Class IV Heavy', unit: 'kg', serial_no: 'SN-WB-88120' });
  const specsInst3 = JSON.stringify({ max_flow_rate: 50.0, min_flow_rate: 5.0, minimum_delivery: 2.0, nozzle_count: 4, unit: 'L/min', serial_no: 'SN-FUEL-7731' });

  await query(`INSERT OR REPLACE INTO instruments (id, meter_id, serial_number, manufacturer, model_number, owner_id, organization_id, instrument_type_id, capacity_specs, location_address, location_lat, location_lng, state, district, compliance_status, risk_score) VALUES
    ('${inst1}', 'LM-2026-EWI-109284', 'SN-EWI-99410', 'Avery India Ltd', 'EWI-50K-PRO', '${userOwner}', '${orgTraderId}', '${typeEwi}', '${specsInst1}', 'Warehouse 4, Lawrence Road, Delhi', 28.6782, 77.1594, 'Delhi', 'Central Delhi', 'ACTIVE', 12),
    ('${inst2}', 'LM-2026-WB-884102', 'SN-WB-88120', 'Essae Teraoka Pvt Ltd', 'WB-60T-HEAVY', '${userOwner}', '${orgTraderId}', '${typeWb}', '${specsInst2}', 'Grain Mandi Gate No 2, Lawrence Road, Delhi', 28.6811, 77.1558, 'Delhi', 'Central Delhi', 'UNDER_VERIFICATION', 45),
    ('${inst3}', 'LM-2026-MPD-449102', 'SN-FUEL-7731', 'Larsen & Toubro Metering', 'MPD-DUAL-50L', '${userOwner}', '${orgTraderId}', '${typeFuel}', '${specsInst3}', 'IndianOil Dealer, Outer Ring Road, Delhi', 28.7041, 77.1025, 'Delhi', 'North Delhi', 'ACTIVE', 85),
    ('${inst4}', 'LM-2026-WM-331092', 'SN-WM-55109', 'Anand Zenner Water Meters', 'DN15-COLD', '${userOwner}', '${orgTraderId}', '${typeWm}', '${specWm}', 'Processing Plant, Wazirpur, Delhi', 28.6988, 77.1689, 'Delhi', 'North Delhi', 'EXPIRED', 30)
  `);

  // 7. Applications
  const app1 = 'app-01';
  const app2 = 'app-02';

  await query(`INSERT OR REPLACE INTO applications (id, application_number, instrument_id, owner_id, application_type, status, submission_date, fee_amount, notes) VALUES
    ('${app1}', 'AP-2026-99210', '${inst1}', '${userOwner}', 'RE_VERIFICATION', 'COMPLETED', '2026-08-10 10:00:00', 500.0, 'Annual mandatory re-verification submitted by trader.'),
    ('${app2}', 'AP-2026-99211', '${inst2}', '${userOwner}', 'RE_VERIFICATION', 'IN_INSPECTION', '2026-09-01 11:30:00', 2500.0, 'Weighbridge periodic inspection requested prior to crop procurement season.')
  `);

  // 8. Payments
  await query(`INSERT OR REPLACE INTO payments (id, application_id, transaction_ref, payment_gateway, amount, currency, status, payment_date, receipt_url) VALUES
    ('pay-01', '${app1}', 'TXN-PAYLM-2026-88190', 'PayLM Treasury e-GRAS', 500.0, 'INR', 'SUCCESS', '2026-08-10 10:05:00', '/receipts/REC-88190.pdf'),
    ('pay-02', '${app2}', 'TXN-PAYLM-2026-88191', 'PayLM Treasury e-GRAS', 2500.0, 'INR', 'SUCCESS', '2026-09-01 11:35:00', '/receipts/REC-88191.pdf')
  `);

  // 9. Appointments & SmartAssign AI Scoring
  await query(`INSERT OR REPLACE INTO appointments (id, application_id, assigned_user_id, assigned_gatc_id, scheduled_date, scheduled_slot, status, ai_recommendation_score, ai_recommendation_reason) VALUES
    ('apt-01', '${app1}', '${userLmo}', NULL, '2026-08-12', '10:00 AM - 12:00 PM', 'COMPLETED', 96.5, 'Jurisdiction matched (Central Delhi). Lowest active queue (2 cases). Travel proximity: 3.2km.'),
    ('apt-02', '${app2}', '${userLmo}', NULL, '2026-09-12', '02:00 PM - 04:00 PM', 'IN_PROGRESS', 94.2, 'Weighbridge certified LMO. Optimal route efficiency.')
  `);

  // 10. Verifications & Verification Tests
  const verif1 = 'verif-01';
  await query(`INSERT OR REPLACE INTO verifications (id, application_id, instrument_id, inspector_id, gatc_id, verification_date, inspection_location_lat, inspection_location_lng, overall_result, failure_reason, anomaly_flag, predicted_duration_mins, actual_duration_mins) VALUES
    ('${verif1}', '${app1}', '${inst1}', '${userLmo}', NULL, '2026-08-12 11:15:00', 28.6782, 77.1594, 'PASS', NULL, 0, 40, 38)
  `);

  await query(`INSERT OR REPLACE INTO verification_tests (id, verification_id, test_name, parameter_name, target_value, observed_value, min_allowed, max_allowed, unit, result, notes) VALUES
    ('vt-01', '${verif1}', 'Zero Load Check', 'Zero Offset', 0.0, 0.0, 0.0, 0.0, 'g', 'PASS', 'Zero tracking stable.'),
    ('vt-02', '${verif1}', 'Eccentric Load Test', 'Corner 1 Error', 10000.0, 10002.0, 9995.0, 10005.0, 'g', 'PASS', 'Within MPE 5g.'),
    ('vt-03', '${verif1}', 'Eccentric Load Test', 'Corner 2 Error', 10000.0, 9998.0, 9995.0, 10005.0, 'g', 'PASS', 'Within MPE 5g.'),
    ('vt-04', '${verif1}', 'Max Capacity Test', '50kg Standard Mass', 50000.0, 50004.0, 49985.0, 50015.0, 'g', 'PASS', 'Passed statutory MPE requirement.')
  `);

  // 11. Stamp & CertiSure Certificate
  const cert1 = 'cert-01';
  await query(`INSERT OR REPLACE INTO stamps (id, verification_id, stamp_number, stamp_type, seal_code, applied_date, expiry_date) VALUES
    ('stamp-01', '${verif1}', 'LM-STAMP-DL-2026-8820', 'LEAD_SEAL', 'SEAL-SEC-994012', '2026-08-12 11:20:00', '2027-08-11 23:59:59')
  `);

  await query(`INSERT OR REPLACE INTO certificates (id, certificate_number, verification_id, instrument_id, owner_id, issue_date, valid_until, qr_token, hmac_signature, status, revoked_reason) VALUES
    ('${cert1}', 'LM/CERT/2026/00918', '${verif1}', '${inst1}', '${userOwner}', '2026-08-12 11:25:00', '2027-08-11 23:59:59', 'QR-CERT-LM-2026-889102', 'HMAC-SHA256-VERIFIED-SECURE-STAMP-99201', 'ACTIVE', NULL)
  `);

  // 12. ComplainO Public Complaints & Risk Intelligence
  await query(`INSERT OR REPLACE INTO complaints (id, complaint_number, instrument_id, certificate_number, reporter_name, reporter_phone, reporter_email, complaint_type, description, lat, lng, credibility_score, status, flagged_for_reinspection) VALUES
    ('cmp-01', 'CMP-2026-0041', '${inst3}', 'LM/CERT/2025/00411', 'Amit Sharma', '+91 99887 76655', 'amit.sharma@gmail.com', 'SHORT_DELIVERY', 'Fuel dispenser display showed 5.00 Litres delivered, but standard 5L container filled only 4.70 Litres. Suspect tampered pulser unit.', 28.7041, 77.1025, 88.5, 'RE_INSPECTION_SCHEDULED', 1),
    ('cmp-02', 'CMP-2026-0042', '${inst2}', 'LM/CERT/2025/00119', 'Ramesh Gupta', '+91 98112 33445', 'rgupta@trader.in', 'EXPIRED_STAMP', 'Weighbridge lead seal appears broken and verification stamp expired 2 months ago.', 28.6811, 77.1558, 72.0, 'UNDER_INVESTIGATION', 0)
  `);

  // 13. Notifications
  await query(`INSERT OR REPLACE INTO notifications (id, user_id, title, message, type, link, is_read) VALUES
    ('notif-01', '${userOwner}', 'Certificate Issued', 'Verification certificate LM/CERT/2026/00918 issued for MeterID LM-2026-EWI-109284.', 'SUCCESS', '/certificates/cert-01', 1),
    ('notif-02', '${userLmo}', 'Re-Inspection Flagged', 'Complaint CMP-2026-0041 flagged high metrology risk (Score: 88.5). Re-inspection required.', 'URGENT', '/complaints/cmp-01', 0),
    ('notif-03', '${userOwner}', 'Verification Appointment Today', 'Inspection for Weighbridge LM-2026-WB-884102 scheduled today at 02:00 PM.', 'INFO', '/applications/app-02', 0)
  `);

  // 14. Audit Logs
  await query(`INSERT OR REPLACE INTO audit_logs (id, user_id, user_email, action, entity_name, entity_id, changes_json, ip_address) VALUES
    ('audit-01', '${userOwner}', 'trader@metrology.gov.in', 'CREATE_APPLICATION', 'applications', '${app1}', '{"status": "SUBMITTED"}', '127.0.0.1'),
    ('audit-02', '${userOwner}', 'trader@metrology.gov.in', 'PAYMENT_COMPLETE', 'payments', 'pay-01', '{"status": "SUCCESS", "amount": 500}', '127.0.0.1'),
    ('audit-03', '${userCentralAdmin}', 'admin@metrology.gov.in', 'SMART_ASSIGN_OPTIMIZE', 'appointments', 'apt-01', '{"assigned_lmo": "usr-lmo-01", "ai_score": 96.5}', '127.0.0.1'),
    ('audit-04', '${userLmo}', 'lmo.delhi@metrology.gov.in', 'SUBMIT_VERIFICATION', 'verifications', '${verif1}', '{"result": "PASS", "tests_count": 4}', '127.0.0.1'),
    ('audit-05', '${userLmo}', 'lmo.delhi@metrology.gov.in', 'GENERATE_CERTIFICATE', 'certificates', '${cert1}', '{"certificate_number": "LM/CERT/2026/00918"}', '127.0.0.1')
  `);

  console.log('✅ Database Seeded Successfully with 5 Roles, MeterIDs, Test Matrices, Certificates & Complaints!');
}

if (process.argv[1]?.includes('seed')) {
  seedDatabase().catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
