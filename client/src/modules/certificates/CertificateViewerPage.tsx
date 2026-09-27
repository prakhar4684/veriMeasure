import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '../../services/api';
import { StatusBadge } from '../../components/Badge';
import { ShieldCheck, Printer, Download, ExternalLink, Award, ArrowLeft } from 'lucide-react';

export const CertificateViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCert() {
      try {
        const res = await apiFetch(`/certificates/${id}`);
        setCert(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCert();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading CertiSure Certificate...</div>;
  if (!cert) return <div className="p-8 text-center text-rose-500 font-bold">Certificate Record Not Found</div>;

  const publicUrl = `${window.location.origin}/verify/${cert.qr_token}`;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/certificates" className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Certificates</span>
        </Link>
        
        <button
          onClick={() => window.print()}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Certificate</span>
        </button>
      </div>

      {/* Printable Certificate Document Card */}
      <div id="printable-certificate" className="bg-white border-4 border-amber-500 rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -z-10"></div>
        
        {/* Header Seal */}
        <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black mx-auto mb-1 shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-slate-500">Government of India • Department of Legal Metrology</h2>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">CERTIFICATE OF VERIFICATION</h1>
          <p className="text-xs text-slate-500">Issued under Section 24 of the Legal Metrology Act, 2009 & General Rules, 2011</p>
        </div>

        {/* Core Metadata */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-slate-400 font-semibold block">Certificate Number</span>
              <strong className="text-slate-900 text-base font-mono">{cert.certificate_number}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">MeterID Digital Passport</span>
              <strong className="text-amber-800 text-sm font-mono">{cert.meter_id}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Owner / Trader Name</span>
              <strong className="text-slate-900 text-sm">{cert.owner_name}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Organization</span>
              <strong className="text-slate-800">{cert.organization_name || 'Registered Business'}</strong>
            </div>
          </div>

          <div className="space-y-2 text-right">
            <div>
              <span className="text-slate-400 font-semibold block">Issue Date</span>
              <strong className="text-slate-900">{cert.issue_date?.split(' ')[0]}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Statutory Validity Until</span>
              <strong className="text-emerald-700 text-sm">{cert.valid_until?.split(' ')[0]}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Legal Stamp & Seal Code</span>
              <strong className="text-slate-900 font-mono">{cert.stamp_number} ({cert.seal_code})</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Inspector</span>
              <strong className="text-slate-800">{cert.inspector_name || 'LMO Officer'}</strong>
            </div>
          </div>
        </div>

        {/* QR Code & HMAC Signature */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>CertiSure Cryptographic Signature Metadata</span>
            </div>
            <div className="font-mono text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 break-all">
              {cert.hmac_signature}
            </div>
            <p className="text-[10px] text-slate-400">Scan QR Code to verify certificate authenticity in real time without login.</p>
          </div>

          <div className="text-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <QRCodeSVG value={publicUrl} size={130} level="H" />
            <span className="text-[9px] font-mono text-slate-400 mt-1 block">Scan QuickVerify</span>
          </div>
        </div>
      </div>
    </div>
  );
};
