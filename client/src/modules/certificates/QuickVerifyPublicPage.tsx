import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { ShieldCheck, AlertTriangle, CheckCircle2, QrCode, MapPin, Gauge, Building2, Flag } from 'lucide-react';

export const QuickVerifyPublicPage: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  useEffect(() => {
    async function loadPublicVerify() {
      try {
        const res = await fetch(`/api/v1/certificates/public/verify/${qrToken}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicVerify();
  }, [qrToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Verifying Legal Metrology Digital Seal...</p>
        </div>
      </div>
    );
  }

  const isAuthentic = data?.is_authentic;
  const cert = data?.certificate;
  const inst = data?.instrument;
  const stamp = data?.stamp;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950"></div>

      <div className="max-w-xl mx-auto w-full relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 text-amber-400 font-extrabold text-xs uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>Govt of India • Legal Metrology QuickVerify</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Public Certificate Verification</h1>
        </div>

        {/* Verification Status Card */}
        {isAuthentic ? (
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center space-x-4 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Authentic Metrology Stamp</div>
                <h2 className="text-lg font-bold text-white">VERIFIED & COMPLIANT</h2>
                <p className="text-[11px] text-slate-300 mt-0.5">Certificate is valid and cryptographically signed by Legal Metrology Officer.</p>
              </div>
            </div>

            {/* Instrument Passport Public Summary */}
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Instrument Digital Passport Summary</h3>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">MeterID Passport:</span>
                  <strong className="text-white">{inst?.meter_id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Instrument Category:</span>
                  <strong className="text-slate-200 font-sans">{inst?.instrument_type}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Certificate No:</span>
                  <strong className="text-amber-400">{cert?.certificate_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Valid Until:</span>
                  <strong className="text-emerald-400">{cert?.valid_until?.split(' ')[0]}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Lead Seal Code:</span>
                  <strong className="text-slate-300">{stamp?.seal_code}</strong>
                </div>
              </div>
            </div>

            {/* Report Tampering CTA */}
            <div className="pt-2">
              <button
                onClick={() => setShowComplaintModal(true)}
                className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
              >
                <Flag className="w-4 h-4" />
                <span>Suspect Tampered Seal or Short Delivery? Report via ComplainO</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">UNVERIFIED / FORGED TOKEN</h2>
            <p className="text-xs text-slate-400">{data?.message || 'No matching statutory certificate found.'}</p>
          </div>
        )}

      </div>

      {showComplaintModal && (
        <PublicComplaintModal
          onClose={() => setShowComplaintModal(false)}
          meterId={inst?.meter_id}
          certNumber={cert?.certificate_number}
        />
      )}
    </div>
  );
};

const PublicComplaintModal: React.FC<{ onClose: () => void; meterId?: string; certNumber?: string }> = ({ onClose, meterId, certNumber }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('SHORT_DELIVERY');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/v1/complaints/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meter_id: meterId,
          certificate_number: certNumber,
          reporter_name: name,
          reporter_phone: phone,
          reporter_email: email,
          complaint_type: type,
          description,
          has_photo: true
        })
      });
      const data = await response.json();
      setRes(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Flag className="w-5 h-5 text-rose-500" />
          ComplainO – File Public Metrology Complaint
        </h3>

        {res ? (
          <div className="space-y-3 text-xs bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div className="font-bold text-emerald-400">Complaint Logged: {res.complaint_number}</div>
            <div>AI Credibility Score: <strong className="text-amber-400">{res.credibility_score}%</strong></div>
            <p className="text-slate-300">{res.ai_summary}</p>
            <button onClick={onClose} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold mt-2">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-semibold">Your Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Amit Sharma" className="mt-1 w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-semibold">Mobile Phone</label>
                <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99887 76655" className="mt-1 w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white" />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" className="mt-1 w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white" />
              </div>
            </div>
            <div>
              <label className="text-slate-400 font-semibold">Violation Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white">
                <option value="SHORT_DELIVERY">Short Delivery / Inaccurate Measurement</option>
                <option value="TAMPERED_SEAL">Tampered Lead Seal / Broken Verification Stamp</option>
                <option value="EXPIRED_STAMP">Expired Verification Certificate</option>
                <option value="UNREGISTERED_METER">Unregistered Non-Stamped Instrument</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 font-semibold">Detailed Description of Incident</label>
              <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the suspected tampering or delivery discrepancy..." className="mt-1 w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white" />
            </div>
            <div className="flex justify-end space-x-2 pt-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl">{loading ? 'Evaluating AI Intelligence...' : 'Submit Complaint'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
