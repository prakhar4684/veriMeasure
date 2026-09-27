// VeriMeasure AI/ML Core Engine
// Handles: SmartAssign, Duration Prediction, Metrology Risk Scoring, Reading Anomaly Detection, Complaint Credibility

export interface SmartAssignCandidate {
  id: string;
  name: string;
  role: 'LMO' | 'GATC_OPERATOR';
  type: 'LMO' | 'GATC';
  state: string;
  district: string;
  scope: string[]; // JSON array of instrument categories e.g. ["WEIGHING", "MEASURING"]
  current_active_cases: number;
  lat: number;
  lng: number;
  rating?: number;
}

export interface SmartAssignInput {
  instrument_type_category: string;
  district: string;
  state: string;
  location_lat: number;
  location_lng: number;
  candidates: SmartAssignCandidate[];
}

export interface SmartAssignResult {
  candidate: SmartAssignCandidate;
  score: number;
  is_eligible: boolean;
  breakdown: {
    jurisdiction_match: boolean;
    scope_match: boolean;
    workload_score: number;
    distance_km: number;
    distance_score: number;
    predicted_duration_mins: number;
  };
  recommendation_reason: string;
}

// 1. SmartAssign Engine (Deterministic Legal Rules override ML Signals)
export function runSmartAssign(input: SmartAssignInput): SmartAssignResult[] {
  const { instrument_type_category, district, state, location_lat, location_lng, candidates } = input;

  const results: SmartAssignResult[] = candidates.map(candidate => {
    // Deterministic Rule 1: Jurisdiction Check
    const jurisdiction_match = candidate.state === state && (candidate.district === district || candidate.district === 'All Districts' || candidate.district === 'National');

    // Deterministic Rule 2: Scope Qualification Check
    const scope_match = candidate.scope.includes(instrument_type_category) || candidate.scope.includes('ALL');

    const is_eligible = jurisdiction_match && scope_match;

    if (!is_eligible) {
      return {
        candidate,
        score: 0,
        is_eligible: false,
        breakdown: {
          jurisdiction_match,
          scope_match,
          workload_score: 0,
          distance_km: 999,
          distance_score: 0,
          predicted_duration_mins: 60
        },
        recommendation_reason: !jurisdiction_match ? 'Ineligible: Jurisdiction mismatch' : 'Ineligible: Instrument category outside authorized scope'
      };
    }

    // ML Optimization Signals:
    // Signal A: Distance calculation (Haversine formula approximation)
    const distance_km = calculateDistanceKm(location_lat, location_lng, candidate.lat, candidate.lng);
    const distance_score = Math.max(0, 100 - distance_km * 4); // Penalty per km

    // Signal B: Workload balance score (fewer active cases = higher score)
    const workload_score = Math.max(0, 100 - candidate.current_active_cases * 15);

    // Signal C: Predicted duration for this verifier + instrument
    const predicted_duration_mins = predictVerificationDuration(instrument_type_category, candidate.current_active_cases);

    // Composite ML Score
    const score = Math.round((workload_score * 0.45) + (distance_score * 0.45) + ((candidate.rating || 4.5) * 2));

    const recommendation_reason = `High Match (${score}%): Jurisdiction matched (${candidate.district}). Active queue: ${candidate.current_active_cases} cases. Distance: ${distance_km.toFixed(1)}km. Est. Duration: ${predicted_duration_mins}m.`;

    return {
      candidate,
      score,
      is_eligible: true,
      breakdown: {
        jurisdiction_match: true,
        scope_match: true,
        workload_score,
        distance_km: Number(distance_km.toFixed(1)),
        distance_score: Number(distance_score.toFixed(1)),
        predicted_duration_mins
      },
      recommendation_reason
    };
  });

  // Sort by highest AI score (eligible candidates first)
  return results.sort((a, b) => b.score - a.score);
}

// Helper: Haversine distance
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5.0;
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 2. Verification Duration Predictor ML
export function predictVerificationDuration(category: string, activeCases: number): number {
  let baseDuration = 45;
  if (category === 'WEIGHING') baseDuration = 60;
  if (category === 'VOLUME') baseDuration = 35;
  if (category === 'TEMPERATURE') baseDuration = 25;
  if (category === 'MEASURING') baseDuration = 50;

  // Queue latency factor
  const queueFactor = activeCases * 5;
  return baseDuration + queueFactor;
}

// 3. Metrology Risk Score ML
export interface InstrumentRiskInput {
  age_months: number;
  complaint_count: number;
  past_failures: number;
  compliance_status: string;
}

export function calculateMetrologyRiskScore(input: InstrumentRiskInput): { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; factors: string[] } {
  let score = 10;
  const factors: string[] = [];

  if (input.age_months > 60) {
    score += 25;
    factors.push('Instrument operational age > 5 years');
  } else if (input.age_months > 24) {
    score += 10;
    factors.push('Instrument operational age > 2 years');
  }

  if (input.complaint_count > 0) {
    const cmpScore = Math.min(45, input.complaint_count * 20);
    score += cmpScore;
    factors.push(`${input.complaint_count} registered public complaint(s)`);
  }

  if (input.past_failures > 0) {
    score += input.past_failures * 15;
    factors.push(`${input.past_failures} historical verification failure(s)`);
  }

  if (input.compliance_status === 'EXPIRED') {
    score += 30;
    factors.push('Verification stamp expired');
  }

  score = Math.min(100, Math.max(0, score));

  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (score >= 75) level = 'CRITICAL';
  else if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';

  return { score, level, factors };
}

// 4. Verification Reading Anomaly Detector ML
export interface TestReadingInput {
  test_name: string;
  target_value: number;
  observed_value: number;
  min_allowed: number;
  max_allowed: number;
}

export function detectVerificationAnomaly(readings: TestReadingInput[]): { has_anomaly: boolean; anomaly_score: number; details: string[] } {
  let anomalyCount = 0;
  const details: string[] = [];

  readings.forEach(r => {
    // Anomaly Check 1: Identical zero error across all load points (suspect copy-paste or fake readings)
    if (r.target_value > 1000 && r.observed_value === r.target_value) {
      anomalyCount++;
      details.push(`Perfect zero error on heavy load point (${r.test_name}: ${r.target_value}) - potential manual rounding.`);
    }

    // Anomaly Check 2: Reading outside tolerance limits
    if (r.observed_value < r.min_allowed || r.observed_value > r.max_allowed) {
      anomalyCount++;
      details.push(`Reading out of statutory MPE bounds on ${r.test_name} (Observed: ${r.observed_value}, Allowed: [${r.min_allowed}, ${r.max_allowed}]).`);
    }
  });

  const anomaly_score = Math.min(100, anomalyCount * 35);
  return {
    has_anomaly: anomaly_score >= 35,
    anomaly_score,
    details
  };
}

// 5. Complaint Intelligence & Credibility Scorer ML
export interface ComplaintInput {
  reporter_email: string;
  reporter_phone: string;
  description: string;
  has_photo: boolean;
  past_complaints_by_reporter: number;
}

export function evaluateComplaintIntelligence(input: ComplaintInput): { credibility_score: number; trigger_reinspection: boolean; summary: string } {
  let score = 50.0;

  // Keyword sentiment & domain specific triggers
  const descLower = input.description.toLowerCase();
  if (descLower.includes('tamper') || descLower.includes('seal broken') || descLower.includes('short delivery') || descLower.includes('forged')) {
    score += 20.0;
  }

  if (input.description.length > 50) {
    score += 10.0; // Detailed report penalty/bonus
  }

  if (input.has_photo) {
    score += 15.0; // Photographic evidence boost
  }

  // Reporter reputation check (spam penalty if > 3 complaints in 24h)
  if (input.past_complaints_by_reporter > 3) {
    score -= 30.0;
  }

  score = Math.min(100.0, Math.max(10.0, score));
  const trigger_reinspection = score >= 70.0;

  return {
    credibility_score: Number(score.toFixed(1)),
    trigger_reinspection,
    summary: trigger_reinspection
      ? `High Credibility (${score}%): Complaint verified with severe metrology risk indicators. Flagged for mandatory LMO Re-Inspection.`
      : `Moderate Credibility (${score}%): Logged for routine inspection audit.`
  };
}
