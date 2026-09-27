import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Settings, ShieldCheck, FileText } from 'lucide-react';

export const RuleManagementPage: React.FC = () => {
  const [types, setTypes] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/instruments/types').then(setTypes).catch(console.error);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-500" />
          Legal Metrology Act Rules & Tolerance Parameters Admin
        </h1>
        <p className="text-xs text-slate-500 mt-1">Configurable statutory rules governing Max Permissible Error (MPE) tolerances, test procedures, and fee schedules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((t) => {
          const specs = typeof t.spec_schema === 'string' ? JSON.parse(t.spec_schema || '{}') : t.spec_schema || {};

          return (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">{t.category}</span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div><span className="text-slate-400">Rule Code:</span> <strong className="font-mono text-slate-900">{t.code}</strong></div>
                <div><span className="text-slate-400">Statutory Validity Period:</span> <strong className="text-emerald-700">{t.default_validity_months} Months</strong></div>
                <div><span className="text-slate-400">Base Statutory Verification Fee:</span> <strong className="text-amber-700 font-bold">₹{t.fee_base_amount}</strong></div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[10px] text-slate-700">
                <div className="font-sans font-bold text-slate-900 text-[11px] mb-1">Configured Technical Parameters:</div>
                <pre className="whitespace-pre-wrap">{JSON.stringify(specs, null, 2)}</pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
