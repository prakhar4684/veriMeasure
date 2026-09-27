import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { StatusBadge } from '../../components/Badge';
import { Award, Search, QrCode, ArrowUpRight } from 'lucide-react';
import { QRCodeModal } from '../../components/QRCodeModal';

export const CertificateListPage: React.FC = () => {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQrCert, setSelectedQrCert] = useState<any>(null);

  useEffect(() => {
    async function loadCerts() {
      try {
        const data = await apiFetch('/certificates');
        setCerts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCerts();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CertiSure – Verification Certificate Registry</h1>
          <p className="text-xs text-slate-500 mt-1">Cryptographically signed digital certificates with unique public QR tokens.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="responsive-table-container overflow-x-auto">
          <table className="responsive-data-table w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Certificate Number</th>
                <th className="py-3.5 px-4">MeterID Passport</th>
                <th className="py-3.5 px-4">Owner Name</th>
                <th className="py-3.5 px-4">Issue & Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td data-label="Certificate Number" className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <Link to={`/certificates/${c.id}`} className="hover:text-amber-600">
                      {c.certificate_number}
                    </Link>
                  </td>
                  <td data-label="MeterID Passport" className="py-3.5 px-4 font-mono text-slate-700">
                    <div>{c.meter_id}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{c.instrument_type_name}</div>
                  </td>
                  <td data-label="Owner Name" className="py-3.5 px-4 font-semibold text-slate-800">{c.owner_name}</td>
                  <td data-label="Issue & Expiry Date" className="py-3.5 px-4 text-slate-600">
                    <div>Issued: {c.issue_date?.split(' ')[0]}</div>
                    <div className="text-[11px] text-emerald-700 font-bold">Valid Until: {c.valid_until?.split(' ')[0]}</div>
                  </td>
                  <td data-label="Status" className="py-3.5 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td data-label="Actions" className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedQrCert(c)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-600" /> QR
                    </button>
                    <Link
                      to={`/certificates/${c.id}`}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedQrCert && (
        <QRCodeModal
          isOpen={true}
          onClose={() => setSelectedQrCert(null)}
          title={`Certificate: ${selectedQrCert.certificate_number}`}
          qrToken={selectedQrCert.qr_token}
          meterId={selectedQrCert.meter_id}
          validUntil={selectedQrCert.valid_until}
        />
      )}
    </div>
  );
};
