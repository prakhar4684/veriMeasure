export type UserRole = 'OWNER' | 'LMO' | 'GATC_OPERATOR' | 'STATE_ADMIN' | 'CENTRAL_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization_id?: string;
  jurisdiction_state?: string;
  jurisdiction_district?: string;
  verification_scope?: string[];
}

export interface InstrumentType {
  id: string;
  code: string;
  name: string;
  category: 'WEIGHING' | 'MEASURING' | 'VOLUME' | 'TEMPERATURE' | 'DIMENSIONAL';
  default_validity_months: number;
  fee_base_amount: number;
  spec_schema: string;
}

export interface Instrument {
  id: string;
  meter_id: string;
  serial_number: string;
  manufacturer: string;
  model_number: string;
  owner_id: string;
  owner_name?: string;
  organization_id?: string;
  organization_name?: string;
  instrument_type_id: string;
  instrument_type_name?: string;
  category?: string;
  capacity_specs: string | Record<string, any>;
  location_address: string;
  location_lat?: number;
  location_lng?: number;
  state: string;
  district: string;
  compliance_status: 'ACTIVE' | 'VERIFICATION_DUE' | 'EXPIRED' | 'SUSPENDED' | 'UNDER_VERIFICATION' | 'REJECTED';
  risk_score: number;
  created_at: string;
}

export interface Application {
  id: string;
  application_number: string;
  instrument_id: string;
  meter_id?: string;
  serial_number?: string;
  owner_id: string;
  owner_name?: string;
  application_type: 'INITIAL' | 'RE_VERIFICATION' | 'POST_REPAIR';
  status: 'DRAFT' | 'SUBMITTED' | 'PAYMENT_PENDING' | 'PAYMENT_COMPLETED' | 'ASSIGNED' | 'SCHEDULED' | 'IN_INSPECTION' | 'COMPLETED' | 'REJECTED';
  submission_date: string;
  fee_amount: number;
  notes?: string;
  appointment_status?: string;
  assigned_inspector_name?: string;
  scheduled_date?: string;
  scheduled_slot?: string;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  verification_id: string;
  instrument_id: string;
  meter_id?: string;
  serial_number?: string;
  manufacturer?: string;
  model_number?: string;
  instrument_type_name?: string;
  owner_id: string;
  owner_name?: string;
  issue_date: string;
  valid_until: string;
  qr_token: string;
  hmac_signature: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  stamp_number?: string;
  seal_code?: string;
}

export interface Complaint {
  id: string;
  complaint_number: string;
  instrument_id?: string;
  meter_id?: string;
  certificate_number?: string;
  reporter_name: string;
  reporter_phone: string;
  reporter_email: string;
  complaint_type: 'TAMPERED_SEAL' | 'SHORT_DELIVERY' | 'EXPIRED_STAMP' | 'UNREGISTERED_METER' | 'SUSPECTED_FORGERY';
  description: string;
  lat?: number;
  lng?: number;
  credibility_score: number;
  status: 'SUBMITTED' | 'UNDER_INVESTIGATION' | 'RE_INSPECTION_SCHEDULED' | 'RESOLVED' | 'DISMISSED';
  flagged_for_reinspection: number;
  created_at: string;
}

export interface SmartAssignRecommendation {
  candidate: {
    id: string;
    name: string;
    role: string;
    type: 'LMO' | 'GATC';
    state: string;
    district: string;
    current_active_cases: number;
  };
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

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_name: string;
  entity_id: string;
  changes_json?: string;
  ip_address?: string;
  created_at: string;
}
