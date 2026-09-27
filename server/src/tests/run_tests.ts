import { runSmartAssign, calculateMetrologyRiskScore, detectVerificationAnomaly, evaluateComplaintIntelligence } from '../ai/aiEngine.js';

async function runTests() {
  console.log('🧪 Starting VeriMeasure Legal Metrology Integration & AI Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. AI Test: SmartAssign Rule-Override & ML Scoring
  console.log('--- Test 1: SmartAssign AI Assignment Engine ---');
  const candidates: any = [
    { id: 'lmo-1', name: 'LMO Delhi Central', role: 'LMO', state: 'Delhi', district: 'Central Delhi', scope: ['WEIGHING'], current_active_cases: 2, lat: 28.61, lng: 77.20 },
    { id: 'lmo-2', name: 'LMO Mumbai South', role: 'LMO', state: 'Maharashtra', district: 'Mumbai South', scope: ['WEIGHING'], current_active_cases: 0, lat: 18.92, lng: 72.83 }
  ];

  const smartResults = runSmartAssign({
    instrument_type_category: 'WEIGHING',
    district: 'Central Delhi',
    state: 'Delhi',
    location_lat: 28.61,
    location_lng: 77.20,
    candidates
  });

  assert(smartResults.length === 2, 'Evaluated all candidates');
  assert(smartResults[0].candidate.id === 'lmo-1', 'Eligible jurisdiction candidate ranked #1');
  assert(smartResults[1].is_eligible === false, 'Out-of-jurisdiction candidate flagged ineligible by deterministic rule');

  // 2. AI Test: Metrology Risk Score Evaluator
  console.log('\n--- Test 2: Metrology Risk Score ML ---');
  const riskHigh = calculateMetrologyRiskScore({ age_months: 64, complaint_count: 2, past_failures: 1, compliance_status: 'EXPIRED' });
  assert(riskHigh.level === 'CRITICAL' || riskHigh.level === 'HIGH', 'Flagged high risk for aged expired instrument with complaints');

  // 3. AI Test: Reading Anomaly Detector
  console.log('\n--- Test 3: Verification Reading Anomaly Detector ---');
  const anomaly = detectVerificationAnomaly([
    { test_name: 'Corner 1', target_value: 10000, observed_value: 10000, min_allowed: 9995, max_allowed: 10005 },
    { test_name: 'Out of Tolerance Test', target_value: 5000, observed_value: 5500, min_allowed: 4950, max_allowed: 5050 }
  ]);
  assert(anomaly.has_anomaly === true, 'Detected out of tolerance reading anomaly');

  // 4. AI Test: Complaint Intelligence
  console.log('\n--- Test 4: ComplainO Intelligence Scorer ---');
  const cmpIntel = evaluateComplaintIntelligence({
    reporter_email: 'test@reporter.in',
    reporter_phone: '+919988776655',
    description: 'Fuel dispenser delivery was short. Seal appears broken and tampered.',
    has_photo: true,
    past_complaints_by_reporter: 1
  });
  assert(cmpIntel.credibility_score > 70, 'Credibility score > 70 for detailed tampered report with photo');
  assert(cmpIntel.trigger_reinspection === true, 'Triggered mandatory re-inspection for high credibility complaint');

  console.log(`\n==========================================`);
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`==========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
