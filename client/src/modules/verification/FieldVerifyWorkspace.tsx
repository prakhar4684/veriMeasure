import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { StatusBadge } from '../../components/Badge';
import { ShieldCheck, Gauge, CheckCircle2, XCircle, AlertTriangle, MapPin, Sparkles, Send, RefreshCw } from 'lucide-react';

export const FieldVerifyWorkspace: React.FC = () => {
  const [assignedApps, setAssignedApps] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [testSchema, setTestSchema] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [durationMins, setDurationMins] = useState(45);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    loadAssignedQueue();
  }, []);

  async function loadAssignedQueue() {
    try {
      const apps = await apiFetch('/applications');
      const queue = apps.filter((a: any) => ['ASSIGNED', 'SCHEDULED', 'IN_INSPECTION'].includes(a.status));
      setAssignedApps(queue);
      if (queue.length > 0) {
        selectApplicationForVerify(queue[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function selectApplicationForVerify(app: any) {
    setSelectedApp(app);
    setVerificationResult(null);
    try {
      const schema = await apiFetch(`/verification/schema/${app.id}`);
      setTestSchema(schema);
      setReadings(
        (schema.tests || []).map((t: any) => ({
          ...t,
          observed_value: t.target // Pre-fill with target for convenience
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  const handleReadingChange = (index: number, val: number) => {
    const updated = [...readings];
    updated[index].observed_value = Number(val);
    setReadings(updated);
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmitting(true);
    try {
      const res = await apiFetch('/verification/submit', {
        method: 'POST',
        body: JSON.stringify({
          application_id: selectedApp.id,
          test_readings: readings,
          inspection_lat: 28.6782,
          inspection_lng: 77.1594,
          actual_duration_mins: durationMins
        })
      });
      setVerificationResult(res);
      loadAssignedQueue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading FieldVerify Inspection Workspace...</div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            FieldVerify – Mobile Inspection & Test Matrix Workspace
          </h1>
          <p className="text-xs text-slate-500 mt-1">LMO / GATC mobile inspection tool with dynamic rule-based test forms & AI anomaly detection.</p>
        </div>
      </div>

      {assignedApps.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Pending Inspections in Queue</h3>
          <p className="text-xs">All assigned verification cases have been completed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Assigned Queue Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Inspection Queue ({assignedApps.length})</h3>
            {assignedApps.map((app) => (
              <div
                key={app.id}
                onClick={() => selectApplicationForVerify(app)}
                className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                  selectedApp?.id === app.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20 font-bold'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">{app.meter_id || app.application_number}</span>
                  <StatusBadge status={app.status} />
                </div>
                <div className="text-[11px] opacity-80 mt-1">{app.instrument_type_name}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{app.location_address || 'Delhi Circle'}</div>
              </div>
            ))}
          </div>

          {/* Right 2 Cols: Verification Test Matrix Form */}
          <div className="lg:col-span-2 space-y-6">
            {verificationResult ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${verificationResult.overall_result === 'PASS' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {verificationResult.overall_result === 'PASS' ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Inspection Result: <span className={verificationResult.overall_result === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}>{verificationResult.overall_result}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{verificationResult.message}</p>
                </div>

                {verificationResult.certificate && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-left space-y-1">
                    <div><span className="text-slate-400 font-sans">Certificate No:</span> <strong className="text-amber-800">{verificationResult.certificate.certNum}</strong></div>
                    <div><span className="text-slate-400 font-sans">QR Token:</span> <span className="text-emerald-700">{verificationResult.certificate.qrToken}</span></div>
                    <div><span className="text-slate-400 font-sans">HMAC Signature:</span> <span className="text-slate-600 text-[10px]">{verificationResult.certificate.hmacSignature}</span></div>
                  </div>
                )}

                <button
                  onClick={() => setVerificationResult(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Continue to Next Case
                </button>
              </div>
            ) : testSchema ? (
              <form onSubmit={handleSubmitInspection} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">TestMatrix Form</span>
                    <h2 className="text-lg font-bold text-slate-900">{testSchema.meter_id} ({testSchema.instrument_type})</h2>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-400">Statutory Rule:</span> <strong className="text-slate-800">LM General Rules 2011</strong>
                  </div>
                </div>

                {/* Dynamic Test Readings Matrix Table */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700">Statutory Test Readings Matrix</h4>
                  <div className="space-y-3">
                    {readings.map((t, idx) => {
                      const isOutOfBounds = t.observed_value < t.min_allowed || t.observed_value > t.max_allowed;

                      return (
                        <div key={idx} className={`p-4 border rounded-xl space-y-2 text-xs transition-colors ${isOutOfBounds ? 'bg-rose-50/50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-900 font-bold">{t.test_name}</span>
                            <span className="text-[11px] text-slate-500">Allowed: [{t.min_allowed}, {t.max_allowed}] {t.unit}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 items-center">
                            <div>
                              <span className="text-[10px] text-slate-400 font-medium">Target Nominal</span>
                              <div className="font-mono text-slate-700">{t.target} {t.unit}</div>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 font-bold">Recorded Observed Reading</label>
                              <input
                                type="number"
                                step="any"
                                required
                                value={t.observed_value}
                                onChange={(e) => handleReadingChange(idx, Number(e.target.value))}
                                className={`w-full p-2 text-xs font-mono font-bold rounded-lg border focus:outline-none ${isOutOfBounds ? 'bg-white border-rose-500 text-rose-700' : 'bg-white border-slate-300 text-slate-900'}`}
                              />
                            </div>
                          </div>

                          {isOutOfBounds && (
                            <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Observed reading exceeds Legal Metrology Max Permissible Error (MPE) tolerance!</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>GPS Tagged: 28.6782° N, 77.1594° E</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting Inspection...' : 'Complete FieldVerify & Issue CertiSure Certificate'}</span>
                  </button>
                </div>
              </form>
            ) : null}
          </div>

        </div>
      )}
    </div>
  );
};
