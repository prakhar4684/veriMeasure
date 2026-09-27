import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { StatusBadge } from '../../components/Badge';
import { SmartAssignModal } from '../scheduling/SmartAssignModal';
import { FileText, Search, CreditCard, Sparkles, Clock, Calendar, ArrowRight } from 'lucide-react';

export const ApplicationListPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppForAssign, setSelectedAppForAssign] = useState<any>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      const data = await apiFetch('/applications');
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePay = async (appId: string) => {
    try {
      await apiFetch('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ application_id: appId, payment_method: 'PayLM Treasury e-GRAS' })
      });
      alert('Fee Payment Completed Successfully via PayLM Gateway!');
      loadApplications();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">VerifyFlow – Application Lifecycle Manager</h1>
          <p className="text-xs text-slate-500 mt-1">Track & process verification, re-verification, and post-repair applications.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="responsive-table-container overflow-x-auto">
          <table className="responsive-data-table w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">App Number</th>
                <th className="py-3.5 px-4">MeterID Passport</th>
                <th className="py-3.5 px-4">Type & Fee</th>
                <th className="py-3.5 px-4">Assigned Inspector</th>
                <th className="py-3.5 px-4">Workflow Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                  <td data-label="App Number" className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <Link to={`/applications/${app.id}/track`} className="hover:text-amber-600">
                      {app.application_number}
                    </Link>
                  </td>
                  <td data-label="MeterID Passport" className="py-3.5 px-4 font-mono text-slate-700">
                    <div>{app.meter_id}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{app.instrument_type_name}</div>
                  </td>
                  <td data-label="Type & Fee" className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{app.application_type}</div>
                    <div className="text-[11px] text-emerald-700 font-bold">₹{app.fee_amount}</div>
                  </td>
                  <td data-label="Assigned Inspector" className="py-3.5 px-4 text-slate-600">
                    {app.assigned_inspector_name ? (
                      <div className="font-semibold text-slate-900">{app.assigned_inspector_name}</div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td data-label="Workflow Status" className="py-3.5 px-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td data-label="Actions" className="py-3.5 px-4 text-right space-x-2">
                    {app.status === 'PAYMENT_PENDING' && (
                      <button
                        onClick={() => handlePay(app.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Pay Fee
                      </button>
                    )}

                    {app.status === 'PAYMENT_COMPLETED' && (
                      <button
                        onClick={() => setSelectedAppForAssign(app)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> SmartAssign AI
                      </button>
                    )}

                    <Link
                      to={`/applications/${app.id}/track`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <span>TrackFlow</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAppForAssign && (
        <SmartAssignModal
          isOpen={true}
          onClose={() => setSelectedAppForAssign(null)}
          applicationId={selectedAppForAssign.id}
          onSuccess={loadApplications}
        />
      )}
    </div>
  );
};
