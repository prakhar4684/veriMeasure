import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  qrToken: string;
  meterId?: string;
  validUntil?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, title, qrToken, meterId, validUntil }) => {
  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/verify/${qrToken}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    alert('Public QR Verification Link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">Official Legal Metrology Verification QR Code</p>
          </div>

          {/* QR Code Canvas */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 inline-block shadow-inner">
            <QRCodeSVG value={publicUrl} size={180} level="H" includeMargin={true} />
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-left space-y-1.5 text-xs text-slate-600 border border-slate-200 font-mono">
            {meterId && <div><span className="text-slate-400 font-sans">MeterID:</span> <strong className="text-slate-900">{meterId}</strong></div>}
            <div><span className="text-slate-400 font-sans">QR Token:</span> <span className="text-emerald-700 font-semibold">{qrToken}</span></div>
            {validUntil && <div><span className="text-slate-400 font-sans">Valid Until:</span> <strong className="text-slate-900">{validUntil.split(' ')[0]}</strong></div>}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>

            <a
              href={`/verify/${qrToken}`}
              target="_blank"
              rel="noreferrer"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open QuickVerify</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
