# VeriMeasure India – Unified Legal Metrology Verification, Certification & Instrument Lifecycle Management Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/SQLite-embedded-blue.svg)](https://www.sqlite.org)
[![React](https://img.shields.io/badge/React-v18-cyan.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Government_Proprietary-orange.svg)]()

> A production-style, modular TypeScript platform with an embedded SQLite database for digitizing and streamlining the complete statutory lifecycle of regulated weighing and measuring instruments across India in compliance with the **Legal Metrology Act, 2009** and **Legal Metrology (General) Rules, 2011**.

---

## 🏛️ Executive Product Vision

Rather than functioning merely as a certificate issuing portal, **VeriMeasure** establishes a persistent **Digital Identity (MeterID)** for every regulated instrument in India (e.g. `LM-2026-WM-884102`). The platform unifies instrument ownership, GPS location, technical capacity specifications, statutory verification history, test matrix readings, lead seals, certificates, public complaints, and AI-driven risk scoring in a single immutable ledger.

### Supported Stakeholders & Roles
1. **Instrument Owners / Traders**: Register instruments, apply for re-verification, pay statutory fees via PayLM, track progress in real time via TrackFlow.
2. **Legal Metrology Officers (LMOs)**: Mobile FieldVerify workspace for performing statutory inspections, recording reading matrices, and signing digital certificates.
3. **Government Approved Test Centres (GATCs)**: Private/semi-gov accredited test centres executing assigned scope verifications.
4. **State Administrators (Controllers)**: State-wide compliance monitoring, district pendency heatmaps, LMO workload distribution.
5. **Central Administrators (Directorate of Legal Metrology)**: National analytics, rule definitions, and immutable system audit logs.
6. **Public Citizens**: Unauthenticated QR scanning via **QuickVerify** (`/verify/:qrToken`) and complaint submission for tampered seals via **ComplainO**.

---

## 🚀 Key Platform Features

### 1. MeterID – Digital Instrument Passport
- Grants every regulated instrument a unique persistent identifier format: `LM-YYYY-[TYPE]-XXXXXX`.
- Stores technical specs (JSONB), capacity, verification scale interval $e$, scale interval $d$, accuracy class, location coordinates, compliance state, and risk score.

### 2. VerifyFlow – Verification Application Workflow
- Workflow pipeline: `Draft` → `Submitted` → `Payment Completed` → `Assigned` → `Scheduled` → `Under Inspection` → `Passed / Failed` → `Certificate Issued`.

### 3. SmartAssign – AI-Assisted Automatic Assignment
- **Deterministic Legal Rules (100% Override)**: State & District jurisdiction, verifier authorization role, GATC scope qualification.
- **ML Optimization Signals**: Predicted inspection duration, active workload queue, geospatial proximity (Haversine formula), verifier efficiency score.

### 4. FieldVerify – Mobile Field Inspection Interface
- Responsive mobile workspace for LMOs & GATC operators.
- Dynamic input form matching the instrument's statutory `TestMatrix`.
- Real-time automated pass/fail calculation against statutory Max Permissible Errors (MPE).
- AI Anomaly Detector checking for suspicious or impossible test entries.
- GPS location tag recording.

### 5. TestMatrix – Instrument-Specific Verification
- Configurable test matrices for:
  - **Electronic Weighing Instruments** (Class I, II, III, IV)
  - **Weighbridges** (Heavy commercial pitless scales)
  - **Water / Flow Meters** (Cold potable water flow rate Qmin, Qn, Qmax)
  - **Fuel Dispensing Pumps** (5L/10L standard volume measure tests)
  - **Clinical Thermometers** (Calibration test points at 37°C, 40°C)

### 6. CertiSure & QuickVerify – Digital Certification & Public QR Verification
- Generates tamper-evident digital certificates with cryptographic HMAC signature metadata.
- Unique QR token accessible without login (`/verify/:qrToken`), displaying authenticity badges (`ACTIVE`, `EXPIRED`, `REVOKED`) and safe public details.

### 7. ComplainO – Public Complaint & AI Risk Engine
- Public reporting for unverified or tampered instruments.
- Complaint Intelligence algorithm scores reporter credibility, detects duplicate submissions, and triggers mandatory LMO Re-Inspection when credibility exceeds 70%.

### 8. MasterWindow – Role-Tailored Dashboard
- Role-specific command center with real-time metrics, pendency statistics, and interactive charts for Owners, LMOs, GATCs, State Admins, and Central Admins.

---

## 🤖 AI/ML Layer Architecture

| Model / Engine | Technique & Methodology | Business Impact |
| :--- | :--- | :--- |
| **SmartAssign Engine** | Hybrid Constraint Solver + Multi-Variable Scoring | Selects optimal LMO/GATC based on legal jurisdiction, distance penalty, and queue balance. |
| **Verification Duration Predictor** | Regression Estimator | Predicts expected inspection duration in minutes considering instrument type & queue latency. |
| **Metrology Risk Score ML** | Multi-Factor Classification (0-100 Score) | Predicts instrument failure likelihood based on age, failure history, complaint density, and stamp expiry. |
| **Verification Anomaly Detector** | Boundary & Pattern Anomaly Check | Identifies manual rounding, impossible identical errors, and out-of-tolerance readings. |
| **Complaint Intelligence Scorer** | Text Analysis & Reporter Reputation | Evaluates public complaint credibility and flags high-confidence reports for auto re-inspection. |

---

## 🗄️ Database Architecture (SQLite)

```
[organizations] 1 ─── N [users] 1 ─── N [instruments] 1 ─── N [applications]
                           │                │                      │
                           │                ├─ N [verifications]   ├─ N [payments]
                           │                │        │             └─ N [appointments]
                           │                │        ├─ N [verification_tests]
                           │                │        ├─ 1 [stamps]
                           │                │        └─ 1 [certificates]
                           │                └─ N [complaints]
                           └─ 1:N [audit_logs] & [notifications]
```

### Core Tables (17 Normalized Entities)
1. `organizations` – Business traders, government departments, GATCs
2. `users` – User accounts across 5 roles with scope arrays & jurisdiction
3. `instrument_types` – Regulated categories, statutory fee formulas, spec schemas
4. `rules` – Legal Metrology Act rules, MPE tolerances, test procedures
5. `instruments` – MeterID passports, capacity specs JSONB, location lat/lng
6. `applications` – VerifyFlow application workflow state
7. `payments` – PayLM treasury transaction records and receipts
8. `gatcs` – Accredited test centre registry & ratings
9. `appointments` – SmartAssign verifier scheduling & AI recommendation scores
10. `verifications` – Verification inspection results, lat/lng, anomaly flags
11. `verification_tests` – Individual test matrix readings (observed vs allowed MPE)
12. `stamps` – Physical/Digital lead seals, holograms, expiry dates
13. `certificates` – CertiSure cryptographic HMAC signed certificates & QR tokens
14. `documents` – Uploaded photo evidence, invoices, calibration charts
15. `notifications` – AlertPulse user notifications
16. `audit_logs` – Immutable system audit trails
17. `complaints` – ComplainO public complaints, credibility scores, re-inspection flags

---

## 🛠️ Installation & Local Development

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher

### Quick Start (Standalone Local Run with Embedded SQLite)

1. **Clone Repository & Install Dependencies**:
   ```bash
   git clone https://github.com/prakhar4684/veriMeasure.git
   cd veriMeasure
   Copy-Item .env.example .env
   npm run install:all
   ```

2. **Run Backend Integration Tests**:
   ```bash
   cd server
   npm run test
   ```

3. **Start Backend API Server**:
   ```bash
   npm run dev:server
   ```
   *The backend will automatically initialize the database schema and populate realistic Indian Legal Metrology seed data.*

4. **Start Frontend Dev Server**:
   ```bash
   npm run dev:client
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 🔑 Demo Login Accounts

You can switch between any of the 5 roles instantly using the **Quick Role Switcher** in the top navbar:

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Trader Owner** | `trader@metrology.gov.in` | `password123` | Instrument registration, apply for re-verification, pay fees, download certs. |
| **LMO Inspector** | `lmo.delhi@metrology.gov.in` | `password123` | Mobile FieldVerify workspace, record test matrix readings, issue certs. |
| **GATC Operator** | `gatc.operator@metrology.gov.in` | `password123` | Accredited private test centre queue & verification sign-off. |
| **State Admin** | `state.admin@metrology.gov.in` | `password123` | District pendency heatmaps, SmartAssign override, verifier workload analytics. |
| **Central Admin** | `admin@metrology.gov.in` | `password123` | National metrology dashboard, rule management, immutable audit logs. |

---

## 📡 API Endpoint Reference (OpenAPI Summary)

- `POST /api/v1/auth/login` – Authenticate user and receive JWT token
- `GET /api/v1/instruments` – Get registered instruments for active jurisdiction/owner
- `GET /api/v1/instruments/:id` – Fetch MeterID Digital Passport details, history & risk score
- `POST /api/v1/instruments` – Register new instrument & generate MeterID
- `POST /api/v1/applications` – Submit VerifyFlow verification application
- `GET /api/v1/applications/:id/track` – Fetch TrackFlow real-time 6-step timeline
- `POST /api/v1/payments/checkout` – Process PayLM statutory fee payment
- `POST /api/v1/scheduling/smart-assign` – Run SmartAssign AI verifier recommendation
- `GET /api/v1/verification/schema/:application_id` – Fetch dynamic statutory TestMatrix form
- `POST /api/v1/verification/submit` – Submit FieldVerify inspection & issue CertiSure certificate
- `GET /api/v1/certificates/public/verify/:qrToken` – QuickVerify public QR token verification (Unauthenticated)
- `POST /api/v1/complaints/public` – File public complaint and compute AI credibility score
- `GET /api/v1/dashboards/stats` – Fetch role-tailored MasterWindow statistics
- `GET /api/v1/audit-logs` – Retrieve immutable system audit log entries

---

For convenience, both services can also be started together:

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Local Database**: `server/verimeasure.db` (created automatically)
