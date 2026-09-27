import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import * as authCtrl from '../modules/auth.controller.js';
import * as instCtrl from '../modules/instruments.controller.js';
import * as appCtrl from '../modules/applications.controller.js';
import * as payCtrl from '../modules/payments.controller.js';
import * as schedCtrl from '../modules/scheduling.controller.js';
import * as verifCtrl from '../modules/verification.controller.js';
import * as certCtrl from '../modules/certificates.controller.js';
import * as cmpCtrl from '../modules/complaints.controller.js';
import * as dashCtrl from '../modules/dashboards.controller.js';
import * as auditCtrl from '../modules/audit.controller.js';
import * as notifCtrl from '../modules/notifications.controller.js';

const router = Router();

// Public Unauthenticated Endpoints
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', authCtrl.register);
router.get('/certificates/public/verify/:qrToken', certCtrl.quickVerifyPublic);
router.post('/complaints/public', cmpCtrl.submitPublicComplaint);

// Protected Auth Routes
router.use(authenticateJWT as any);

router.get('/auth/me', authCtrl.getMe as any);

// MeterID & Instrument Passport Routes
router.get('/instruments/types', instCtrl.getInstrumentTypes as any);
router.get('/instruments', instCtrl.getInstruments as any);
router.get('/instruments/:id', instCtrl.getInstrumentPassport as any);
router.post('/instruments', requireRole(['OWNER', 'STATE_ADMIN', 'CENTRAL_ADMIN']) as any, instCtrl.registerInstrument as any);

// Applications (VerifyFlow & TrackFlow)
router.get('/applications', appCtrl.getApplications as any);
router.post('/applications', requireRole(['OWNER', 'STATE_ADMIN']) as any, appCtrl.createApplication as any);
router.get('/applications/:id/track', appCtrl.getTrackFlowTimeline as any);

// Payments (PayLM)
router.post('/payments/checkout', payCtrl.processPayment as any);

// Scheduling & SmartAssign AI
router.post('/scheduling/smart-assign', requireRole(['STATE_ADMIN', 'CENTRAL_ADMIN', 'LMO']) as any, schedCtrl.getSmartAssignRecommendations as any);
router.post('/scheduling/confirm', requireRole(['STATE_ADMIN', 'CENTRAL_ADMIN', 'LMO']) as any, schedCtrl.confirmAssignment as any);

// FieldVerify Inspection & CertiSure
router.get('/verification/schema/:application_id', verifCtrl.getTestMatrixSchema as any);
router.post('/verification/submit', requireRole(['LMO', 'GATC_OPERATOR', 'STATE_ADMIN']) as any, verifCtrl.submitVerificationInspection as any);

// Certificates
router.get('/certificates', certCtrl.getCertificates as any);
router.get('/certificates/:id', certCtrl.getCertificateById as any);

// Complaints Management
router.get('/complaints', cmpCtrl.getComplaints as any);
router.patch('/complaints/:id/status', requireRole(['LMO', 'STATE_ADMIN', 'CENTRAL_ADMIN']) as any, cmpCtrl.updateComplaintStatus as any);

// Dashboards (MasterWindow)
router.get('/dashboards/stats', dashCtrl.getDashboardStats as any);

// Notifications (AlertPulse)
router.get('/notifications', notifCtrl.getNotifications as any);
router.patch('/notifications/:id/read', notifCtrl.markAsRead as any);

// Audit Logs
router.get('/audit-logs', requireRole(['STATE_ADMIN', 'CENTRAL_ADMIN']) as any, auditCtrl.getAuditLogs as any);

export default router;
