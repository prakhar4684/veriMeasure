import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './modules/auth/LoginPage';
import { MasterWindowDashboard } from './modules/dashboard/MasterWindowDashboard';
import { InstrumentListPage } from './modules/instruments/InstrumentListPage';
import { InstrumentPassportPage } from './modules/instruments/InstrumentPassportPage';
import { ApplicationListPage } from './modules/applications/ApplicationListPage';
import { ApplicationTrackingPage } from './modules/applications/ApplicationTrackingPage';
import { FieldVerifyWorkspace } from './modules/verification/FieldVerifyWorkspace';
import { CertificateListPage } from './modules/certificates/CertificateListPage';
import { CertificateViewerPage } from './modules/certificates/CertificateViewerPage';
import { QuickVerifyPublicPage } from './modules/certificates/QuickVerifyPublicPage';
import { ComplaintManagementPage } from './modules/complaints/ComplaintManagementPage';
import { AuditLogsPage } from './modules/audit/AuditLogsPage';
import { RuleManagementPage } from './modules/admin/RuleManagementPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading VeriMeasure Portal...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 app-shell">
      <Navbar onMenuClick={() => setMobileNavOpen(true)} />
      <div className="flex-1 flex">
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Unauthenticated QR Verification Route */}
          <Route path="/verify/:qrToken" element={<QuickVerifyPublicPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <MasterWindowDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/instruments"
            element={
              <ProtectedLayout>
                <InstrumentListPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/instruments/:id"
            element={
              <ProtectedLayout>
                <InstrumentPassportPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedLayout>
                <ApplicationListPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/applications/:id/track"
            element={
              <ProtectedLayout>
                <ApplicationTrackingPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/field-verify"
            element={
              <ProtectedLayout>
                <FieldVerifyWorkspace />
              </ProtectedLayout>
            }
          />
          <Route
            path="/certificates"
            element={
              <ProtectedLayout>
                <CertificateListPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/certificates/:id"
            element={
              <ProtectedLayout>
                <CertificateViewerPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/complaints"
            element={
              <ProtectedLayout>
                <ComplaintManagementPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedLayout>
                <AuditLogsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/rule-management"
            element={
              <ProtectedLayout>
                <RuleManagementPage />
              </ProtectedLayout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
