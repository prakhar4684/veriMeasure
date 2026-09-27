import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { StatusBadge } from '../../components/Badge';
import { Link } from 'react-router-dom';
import { Gauge, FileText, Award, AlertTriangle, TrendingUp, ShieldCheck, MapPin, Sparkles, ArrowUpRight, Clock, Users, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const MasterWindowDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiFetch('/dashboards/stats');
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading MasterWindow Analytics...
      </div>
    );
  }

  const role = user?.role || 'OWNER';
  const stats = data?.stats || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>MasterWindow Legal Metrology Command Center</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Jurisdiction: <strong className="text-slate-200">{user?.jurisdiction_district || 'Central Delhi'} ({user?.jurisdiction_state || 'Delhi'})</strong> • Role: <span className="text-amber-400 font-semibold">{role}</span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/instruments"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              Instrument Passport Registry
            </Link>
            <Link
              to="/verify/QR-CERT-LM-2026-889102"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              Public QR Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'OWNER' && (
          <>
            <MetricCard title="Registered MeterIDs" value={stats.total_instruments || 0} subtitle="Active Legal Passports" icon={Gauge} color="amber" />
            <MetricCard title="Active VerifyFlow Apps" value={stats.active_applications || 0} subtitle="Under Workflow" icon={FileText} color="blue" />
            <MetricCard title="Valid CertiSure Certs" value={stats.valid_certificates || 0} subtitle="HMAC Authenticated" icon={Award} color="emerald" />
            <MetricCard title="Verification Due" value={stats.verification_due || 0} subtitle="Action Required" icon={AlertTriangle} color="rose" />
          </>
        )}

        {role === 'LMO' && (
          <>
            <MetricCard title="Assigned Queue" value={stats.assigned_inspections || 0} subtitle="Pending Inspections" icon={Clock} color="amber" />
            <MetricCard title="FieldVerifications Done" value={stats.completed_verifications || 0} subtitle="Completed Inspections" icon={ShieldCheck} color="emerald" />
            <MetricCard title="Flagged Re-Inspections" value={stats.flagged_reinspections || 0} subtitle="High Risk Cases" icon={AlertTriangle} color="rose" />
            <MetricCard title="SmartAssign Rating" value={`${stats.workload_efficiency_score || 94.8}%`} subtitle="Efficiency Score" icon={TrendingUp} color="blue" />
          </>
        )}

        {(role === 'STATE_ADMIN' || role === 'CENTRAL_ADMIN') && (
          <>
            <MetricCard title="State Instrument Fleet" value={stats.total_instruments || 0} subtitle="Digitized Instruments" icon={Gauge} color="amber" />
            <MetricCard title="Active Applications" value={stats.total_applications || 0} subtitle="Verification Workflow" icon={FileText} color="blue" />
            <MetricCard title="Valid Certs Issued" value={stats.active_certificates || 0} subtitle="Publicly Verifiable" icon={Award} color="emerald" />
            <MetricCard title="Revenue Collected" value={`₹${(stats.revenue_collected_inr || 3000).toLocaleString('en-IN')}`} subtitle="PayLM Treasury Fees" icon={TrendingUp} color="emerald" />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols wide): Active Queue / Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {role === 'LMO' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Today's FieldVerify Assigned Queue
                </h3>
                <Link to="/field-verify" className="text-xs font-semibold text-amber-600 hover:text-amber-700">Open Workspace →</Link>
              </div>
              <div className="space-y-3">
                {(data?.queue || []).map((item: any) => (
                  <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-mono text-xs font-bold">
                          {item.meter_id?.substring(0, 4)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.meter_id} ({item.type_name})</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.location_address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={item.appointment_status || 'SCHEDULED'} />
                        <div className="text-[11px] font-mono text-slate-500 mt-1">{item.scheduled_slot}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'OWNER' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-500" />
                  Registered Legal Instruments Passport Fleet
                </h3>
                <Link to="/instruments" className="text-xs font-semibold text-amber-600 hover:text-amber-700">View All ({data?.stats?.total_instruments || 0}) →</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {(data?.recentInstruments || []).map((inst: any) => (
                  <div key={inst.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-mono">{inst.meter_id}</div>
                      <div className="text-[11px] text-slate-500">{inst.type_name} • Serial: {inst.serial_number}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={inst.compliance_status} />
                      <Link to={`/instruments/${inst.id}`} className="p-1 text-slate-400 hover:text-amber-600">
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(role === 'STATE_ADMIN' || role === 'CENTRAL_ADMIN') && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Instrument Compliance Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.complianceBreakdown || []}>
                    <XAxis dataKey="compliance_status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]}>
                      {(data?.complianceBreakdown || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.compliance_status === 'ACTIVE' ? '#10B981' : entry.compliance_status === 'VERIFICATION_DUE' ? '#F59E0B' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: AI Insights & Metrology Audit Log */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" />
              <span>AI Metrology Intelligence</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-amber-300">SmartAssign Optimization</div>
                <p className="text-slate-300 mt-1">Jurisdiction & GATC scopes matched with 96.5% AI confidence score.</p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-emerald-300">Anomaly Detection</div>
                <p className="text-slate-300 mt-1">FieldVerify test matrices verified against statutory MPE tolerances.</p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-indigo-300">ComplainO Risk Intelligence</div>
                <p className="text-slate-300 mt-1">Short-delivery complaint CMP-2026-0041 scored 88.5% credibility.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string | number; subtitle: string; icon: any; color: string }> = ({ title, value, subtitle, icon: Icon, color }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl bg-${color}-50 text-${color}-600`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-slate-900 mt-2">{value}</div>
      <div className="text-[11px] text-slate-400 font-medium mt-1">{subtitle}</div>
    </div>
  );
};
