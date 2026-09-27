import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { StatusBadge } from '../../components/Badge';
import { CheckCircle2, Clock, Calendar, ShieldCheck, CreditCard, User, Award, ArrowLeft } from 'lucide-react';

export const ApplicationTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrack() {
      try {
        const res = await apiFetch(`/applications/${id}/track`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTrack();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading TrackFlow Timeline...</div>;
  if (!data) return <div className="p-8 text-center text-rose-500 font-bold">Application Record Not Found</div>;

  const { application, steps } = data;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Link to="/applications" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Applications</span>
      </Link>

      {/* Header Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold font-mono text-slate-900">{application.application_number}</h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            MeterID: <strong className="text-slate-900 font-mono">{application.meter_id}</strong> ({application.instrument_type_name})
          </p>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
          <div><span className="text-slate-400">Application Fee:</span> <strong className="text-emerald-700">₹{application.fee_amount}</strong></div>
          <div><span className="text-slate-400">Payment Status:</span> <strong>{application.payment_status || 'PENDING'}</strong></div>
        </div>
      </div>

      {/* TrackFlow Vertical Step Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">Real-Time Application Lifecycle Timeline</h2>
        
        <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {steps.map((step: any) => {
            const isDone = step.status === 'COMPLETED';
            const isCurrent = step.status === 'IN_PROGRESS';

            return (
              <div key={step.step} className="relative flex items-start space-x-4">
                <div
                  className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-50'
                      : isCurrent
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-50 animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.step}
                </div>

                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold ${isDone ? 'text-slate-900' : isCurrent ? 'text-amber-800' : 'text-slate-500'}`}>
                      Step {step.step}: {step.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {step.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
