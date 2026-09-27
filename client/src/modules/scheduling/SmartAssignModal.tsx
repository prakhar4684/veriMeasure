import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { SmartAssignRecommendation } from '../../types';
import { Sparkles, CheckCircle2, ShieldAlert, MapPin, Clock, Award, X } from 'lucide-react';

interface SmartAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onSuccess: () => void;
}

export const SmartAssignModal: React.FC<SmartAssignModalProps> = ({ isOpen, onClose, applicationId, onSuccess }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<SmartAssignRecommendation | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function fetchSmartAssign() {
      try {
        const res = await apiFetch('/scheduling/smart-assign', {
          method: 'POST',
          body: JSON.stringify({ application_id: applicationId })
        });
        setData(res);
        if (res.recommendations?.length > 0) {
          // Select highest scoring eligible recommendation by default
          const topEligible = res.recommendations.find((r: any) => r.is_eligible);
          setSelectedRec(topEligible || res.recommendations[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (isOpen) fetchSmartAssign();
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  const handleConfirmAssignment = async () => {
    if (!selectedRec) return;
    setConfirming(true);
    try {
      await apiFetch('/scheduling/confirm', {
        method: 'POST',
        body: JSON.stringify({
          application_id: applicationId,
          assigned_user_id: selectedRec.candidate.type === 'LMO' ? selectedRec.candidate.id : null,
          assigned_gatc_id: selectedRec.candidate.type === 'GATC' ? selectedRec.candidate.id : null,
          scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          scheduled_slot: '10:00 AM - 12:00 PM',
          ai_score: selectedRec.score,
          ai_reason: selectedRec.recommendation_reason
        })
      });
      alert(`Assigned successfully to ${selectedRec.candidate.name}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">SmartAssign AI Verifier Dispatch</h3>
            <p className="text-xs text-slate-500">Deterministic Legal Rules + AI Workload & Distance Optimization Signals</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium">Running AI SmartAssign optimization engine...</div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400">Jurisdiction Target:</span> <strong className="text-slate-900">{data?.jurisdiction}</strong>
              </div>
              <div>
                <span className="text-slate-400">Category:</span> <strong className="text-amber-800">{data?.category}</strong>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(data?.recommendations || []).map((rec: SmartAssignRecommendation, index: number) => {
                const isSelected = selectedRec?.candidate.id === rec.candidate.id;

                return (
                  <div
                    key={rec.candidate.id}
                    onClick={() => rec.is_eligible && setSelectedRec(rec)}
                    className={`p-4 border rounded-xl text-xs transition-all cursor-pointer ${
                      !rec.is_eligible
                        ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${rec.candidate.type === 'GATC' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                          {rec.candidate.type}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{rec.candidate.name}</span>
                            {index === 0 && rec.is_eligible && (
                              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">AI #1 Recommendation</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Active Queue: {rec.candidate.current_active_cases} cases • Distance: {rec.breakdown.distance_km}km • Est. Duration: {rec.breakdown.predicted_duration_mins}m
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {rec.is_eligible ? (
                          <div className="text-base font-extrabold text-amber-600">{rec.score}% <span className="text-[10px] font-normal text-slate-400">Match</span></div>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">Ineligible</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 italic bg-white/60 p-2 rounded border border-slate-100">
                      {rec.recommendation_reason}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
              <button
                onClick={handleConfirmAssignment}
                disabled={!selectedRec || confirming}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {confirming ? 'Confirming Assignment...' : `Assign Verifier (${selectedRec?.candidate.name || 'Select'})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
