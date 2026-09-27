-- SQLite Database Schema for VeriMeasure Legal Metrology Platform (India)
-- Compliant with Legal Metrology Act, 2009 & General Rules, 2011

CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('BUSINESS', 'GOVERNMENT_DEPT', 'GATC', 'MANUFACTURER')),
    registration_no TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'LMO', 'GATC_OPERATOR', 'STATE_ADMIN', 'CENTRAL_ADMIN')),
    phone TEXT NOT NULL,
    organization_id TEXT REFERENCES organizations(id),
    jurisdiction_state TEXT,
    jurisdiction_district TEXT,
    verification_scope TEXT, -- JSON array string of instrument types
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instrument_types (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('WEIGHING', 'MEASURING', 'VOLUME', 'TEMPERATURE', 'DIMENSIONAL')),
    default_validity_months INTEGER DEFAULT 12,
    fee_base_amount REAL DEFAULT 500.0,
    fee_formula TEXT DEFAULT 'base',
    spec_schema TEXT NOT NULL, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rules (
    id TEXT PRIMARY KEY,
    instrument_type_id TEXT NOT NULL REFERENCES instrument_types(id),
    title TEXT NOT NULL,
    rule_code TEXT NOT NULL UNIQUE,
    legal_act_ref TEXT NOT NULL,
    mpe_json TEXT NOT NULL, -- JSON string for Max Permissible Error tolerances
    test_procedure_json TEXT NOT NULL, -- JSON string for required test steps
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instruments (
    id TEXT PRIMARY KEY,
    meter_id TEXT NOT NULL UNIQUE, -- Passport ID e.g. LM-2026-WB-884102
    serial_number TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    model_number TEXT NOT NULL,
    owner_id TEXT NOT NULL REFERENCES users(id),
    organization_id TEXT REFERENCES organizations(id),
    instrument_type_id TEXT NOT NULL REFERENCES instrument_types(id),
    capacity_specs TEXT NOT NULL, -- JSON string (Max Cap, e, d, accuracy class, etc.)
    location_address TEXT NOT NULL,
    location_lat REAL,
    location_lng REAL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    compliance_status TEXT NOT NULL CHECK (compliance_status IN ('ACTIVE', 'VERIFICATION_DUE', 'EXPIRED', 'SUSPENDED', 'UNDER_VERIFICATION', 'REJECTED')),
    risk_score INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    application_number TEXT NOT NULL UNIQUE, -- e.g. AP-2026-99210
    instrument_id TEXT NOT NULL REFERENCES instruments(id),
    owner_id TEXT NOT NULL REFERENCES users(id),
    application_type TEXT NOT NULL CHECK (application_type IN ('INITIAL', 'RE_VERIFICATION', 'POST_REPAIR')),
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'ASSIGNED', 'SCHEDULED', 'IN_INSPECTION', 'COMPLETED', 'REJECTED')),
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fee_amount REAL NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id),
    transaction_ref TEXT NOT NULL UNIQUE,
    payment_gateway TEXT DEFAULT 'PayLM Treasury Gateway',
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    payment_date TIMESTAMP,
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gatcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    accredited_scopes TEXT NOT NULL, -- JSON array string
    rating REAL DEFAULT 4.5,
    contact_email TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id),
    assigned_user_id TEXT REFERENCES users(id), -- LMO
    assigned_gatc_id TEXT REFERENCES gatcs(id),
    scheduled_date TEXT NOT NULL,
    scheduled_slot TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'RESCHEDULED', 'CANCELLED')),
    ai_recommendation_score REAL DEFAULT 0.0,
    ai_recommendation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES applications(id),
    instrument_id TEXT NOT NULL REFERENCES instruments(id),
    inspector_id TEXT NOT NULL REFERENCES users(id),
    gatc_id TEXT REFERENCES gatcs(id),
    verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inspection_location_lat REAL,
    inspection_location_lng REAL,
    overall_result TEXT NOT NULL CHECK (overall_result IN ('PASS', 'FAIL', 'REJECTED')),
    failure_reason TEXT,
    anomaly_flag INTEGER DEFAULT 0,
    predicted_duration_mins INTEGER DEFAULT 45,
    actual_duration_mins INTEGER DEFAULT 45,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_tests (
    id TEXT PRIMARY KEY,
    verification_id TEXT NOT NULL REFERENCES verifications(id),
    test_name TEXT NOT NULL,
    parameter_name TEXT NOT NULL,
    target_value REAL NOT NULL,
    observed_value REAL NOT NULL,
    min_allowed REAL NOT NULL,
    max_allowed REAL NOT NULL,
    unit TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stamps (
    id TEXT PRIMARY KEY,
    verification_id TEXT NOT NULL REFERENCES verifications(id),
    stamp_number TEXT NOT NULL UNIQUE,
    stamp_type TEXT NOT NULL CHECK (stamp_type IN ('LEAD_SEAL', 'METALLIC_STAMP', 'HOLOGRAM_SEAL', 'DIGITAL_STAMP')),
    seal_code TEXT NOT NULL,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    certificate_number TEXT NOT NULL UNIQUE, -- e.g. LM/CERT/2026/00918
    verification_id TEXT NOT NULL REFERENCES verifications(id),
    instrument_id TEXT NOT NULL REFERENCES instruments(id),
    owner_id TEXT NOT NULL REFERENCES users(id),
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NOT NULL,
    qr_token TEXT NOT NULL UNIQUE,
    hmac_signature TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
    revoked_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('APPLICATION', 'VERIFICATION', 'INSTRUMENT', 'COMPLAINT')),
    entity_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INFO', 'WARNING', 'SUCCESS', 'URGENT')),
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_email TEXT,
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    changes_json TEXT, -- JSON string
    ip_address TEXT DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    complaint_number TEXT NOT NULL UNIQUE,
    instrument_id TEXT REFERENCES instruments(id),
    certificate_number TEXT,
    reporter_name TEXT NOT NULL,
    reporter_phone TEXT NOT NULL,
    reporter_email TEXT NOT NULL,
    complaint_type TEXT NOT NULL CHECK (complaint_type IN ('TAMPERED_SEAL', 'SHORT_DELIVERY', 'EXPIRED_STAMP', 'UNREGISTERED_METER', 'SUSPECTED_FORGERY')),
    description TEXT NOT NULL,
    lat REAL,
    lng REAL,
    credibility_score REAL DEFAULT 50.0,
    status TEXT NOT NULL CHECK (status IN ('SUBMITTED', 'UNDER_INVESTIGATION', 'RE_INSPECTION_SCHEDULED', 'RESOLVED', 'DISMISSED')),
    flagged_for_reinspection INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for maximum performance
CREATE INDEX IF NOT EXISTS idx_instruments_meter_id ON instruments(meter_id);
CREATE INDEX IF NOT EXISTS idx_instruments_owner ON instruments(owner_id);
CREATE INDEX IF NOT EXISTS idx_applications_num ON applications(application_number);
CREATE INDEX IF NOT EXISTS idx_certificates_qr ON certificates(qr_token);
CREATE INDEX IF NOT EXISTS idx_certificates_num ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_complaints_num ON complaints(complaint_number);
