import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { StatusBadge } from '../../components/Badge';
import { ShieldAlert, AlertTriangle, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export const ComplaintManagementPage: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      const data = await apiFetch('/complaints');
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadComplaints();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            ComplainO – Public Complaint Intelligence & Re-Inspection Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">NLP & statistical credibility scoring for public tampering reports and short-delivery complaints.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="responsive-table-container overflow-x-auto">
          <table className="responsive-data-table w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Complaint ID</th>
                <th className="py-3.5 px-4">Reporter Details</th>
                <th className="py-3.5 px-4">Violation Type & Description</th>
                <th className="py-3.5 px-4">AI Credibility Score</th>
                <th className="py-3.5 px-4">Re-Inspection Flag</th>
                <th className="py-3.5 px-4 text-right">Status Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td data-label="Complaint ID" className="py-3.5 px-4 font-mono font-bold text-slate-900">{c.complaint_number}</td>
                  <td data-label="Reporter Details" className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{c.reporter_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.reporter_email}</div>
                  </td>
                  <td data-label="Violation Type & Description" className="py-3.5 px-4 max-w-xs">
                    <div className="font-bold text-amber-800 uppercase text-[10px]">{c.complaint_type?.replace(/_/g, ' ')}</div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{c.description}</p>
                  </td>
                  <td data-label="AI Credibility Score" className="py-3.5 px-4">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <strong className="text-amber-700 text-sm font-extrabold">{c.credibility_score}%</strong>
                    </div>
                  </td>
                  <td data-label="Re-Inspection Flag" className="py-3.5 px-4">
                    {c.flagged_for_reinspection ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Re-Inspection Mandatory
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Standard Audit</span>
                    )}
                  </td>
                  <td data-label="Status Action" className="py-3.5 px-4 text-right">
                    <select
                      value={c.status}
                      onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                      className="p-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION</option>
                      <option value="RE_INSPECTION_SCHEDULED">RE-INSPECTION SCHEDULED</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="DISMISSED">DISMISSED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
