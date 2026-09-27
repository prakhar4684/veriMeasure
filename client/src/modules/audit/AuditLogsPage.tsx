import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { FileSearch, ShieldCheck, User } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await apiFetch('/audit-logs');
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-amber-500" />
            AuditLogs – Immutable Statutory Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">Complete system activity tracking: Who, What, Entity ID, Changes JSON, and Timestamp.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="responsive-table-container overflow-x-auto">
          <table className="responsive-data-table w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User / Actor</th>
                <th className="py-3.5 px-4">Statutory Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">State Delta JSON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td data-label="Timestamp" className="py-3.5 px-4 text-slate-500 text-[11px]">{log.created_at}</td>
                  <td data-label="User / Actor" className="py-3.5 px-4 font-sans font-semibold text-slate-900">{log.user_email || 'System'}</td>
                  <td data-label="Statutory Action" className="py-3.5 px-4 font-bold text-amber-800">{log.action}</td>
                  <td data-label="Target Entity" className="py-3.5 px-4 text-slate-700">{log.entity_name} ({log.entity_id})</td>
                  <td data-label="State Delta JSON" className="py-3.5 px-4 text-[10px] text-slate-600 max-w-xs truncate">{log.changes_json || '{}'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
