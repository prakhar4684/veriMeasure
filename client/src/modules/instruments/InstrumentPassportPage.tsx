import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { StatusBadge } from '../../components/Badge';
import { QRCodeModal } from '../../components/QRCodeModal';
import { ShieldCheck, Gauge, Award, AlertTriangle, QrCode, FileText, CheckCircle2, History, MapPin, Building2, User, Sparkles } from 'lucide-react';

export const InstrumentPassportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadPassport() {
      try {
        const res = await apiFetch(`/instruments/${id}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPassport();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading MeterID Digital Passport...</div>;
  if (!data) return <div className="p-8 text-center text-rose-500 font-bold">Instrument Passport Not Found</div>;

  const { instrument, verifications, complaints, riskAnalysis } = data;
  const specs = typeof instrument.capacity_specs === 'string' ? JSON.parse(instrument.capacity_specs) : instrument.capacity_specs || {};
  const activeCert = verifications.find((v: any) => v.certificate_number);

  const handleCreateApplication = async () => {
    try {
      const res = await apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({
          instrument_id: instrument.id,
          application_type: 'RE_VERIFICATION',
          notes: 'Requested periodic re-verification from MeterID passport.'
        })
      });
      navigate(`/applications/${res.application_id}/track`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Gauge className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold font-mono tracking-tight text-white">{instrument.meter_id}</h1>
                <StatusBadge status={instrument.compliance_status} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {instrument.instrument_type_name} ({instrument.category}) • Serial: <strong className="text-amber-400 font-mono">{instrument.serial_number}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {activeCert && (
              <button
                onClick={() => setShowQR(true)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>View Cert QR Code</span>
              </button>
            )}
            <button
              onClick={handleCreateApplication}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Apply for Re-Verification</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout: Specs + AI Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Specs & Ownership */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Technical Specs Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Statutory Technical Specifications & Metrology Specs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Manufacturer</span>
                <strong className="text-slate-900 text-sm mt-0.5 block">{instrument.manufacturer}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Model Number</span>
                <strong className="text-slate-900 text-sm mt-0.5 block font-mono">{instrument.model_number}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Accuracy Class / Spec</span>
                <strong className="text-slate-900 text-sm mt-0.5 block">{specs.accuracy_class || 'Class III'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Capacity (Max / Min)</span>
                <strong className="text-slate-900 text-sm mt-0.5 block">{specs.max_capacity || 50000} {specs.unit || 'g'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Scale Interval (d / e)</span>
                <strong className="text-slate-900 text-sm mt-0.5 block">e = {specs.verification_scale_e || 5}{specs.unit || 'g'}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Jurisdiction</span>
                <strong className="text-slate-900 text-sm mt-0.5 block">{instrument.district}, {instrument.state}</strong>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Physical Installation Address: <strong className="text-slate-800">{instrument.location_address}</strong></span>
            </div>
          </div>

          {/* Verification History Log */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              Verification History & CertiSure Records
            </h3>
            {verifications.length === 0 ? (
              <p className="text-xs text-slate-400">No verification inspections recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {verifications.map((v: any) => (
                  <div key={v.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>Inspector: {v.inspector_name || 'LMO Officer'}</span>
                        <StatusBadge status={v.overall_result} />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Date: {v.verification_date?.split(' ')[0]} • Certificate: <span className="font-mono text-amber-700 font-bold">{v.certificate_number || 'N/A'}</span>
                      </div>
                    </div>
                    {v.qr_token && (
                      <Link
                        to={`/verify/${v.qr_token}`}
                        className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-[11px] rounded-lg hover:bg-amber-400 transition-colors"
                      >
                        QuickVerify QR
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Col: AI Risk Score Card */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI Metrology Risk Score
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${riskAnalysis?.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {riskAnalysis?.level || 'LOW'} RISK
              </span>
            </div>

            <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-4xl font-extrabold text-slate-900">{riskAnalysis?.score || 10} <span className="text-xs text-slate-400 font-normal">/ 100</span></div>
              <p className="text-[11px] text-slate-500 mt-1">Predictive Failure & Tampering Risk Score</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-700">Risk Factor Evaluation:</div>
              {(riskAnalysis?.factors || []).map((factor: string, i: number) => (
                <div key={i} className="flex items-center space-x-2 text-slate-600 text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Owner Details Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-500" />
              Registered Ownership
            </h3>
            <div>
              <span className="text-slate-400">Owner Name:</span>
              <strong className="text-slate-900 block text-sm">{instrument.owner_name}</strong>
            </div>
            <div>
              <span className="text-slate-400">Organization:</span>
              <strong className="text-slate-900 block">{instrument.organization_name || 'Registered Business'}</strong>
            </div>
          </div>
        </div>

      </div>

      {activeCert && (
        <QRCodeModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          title={`MeterID: ${instrument.meter_id}`}
          qrToken={activeCert.qr_token}
          meterId={instrument.meter_id}
          validUntil={activeCert.valid_until}
        />
      )}
    </div>
  );
};
