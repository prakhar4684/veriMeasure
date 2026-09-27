import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('trader@metrology.gov.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101820] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(245,158,11,0.16),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(20,184,166,0.10),transparent_30%)]" />
      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-[1fr_0.9fr] bg-[#17232d] border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
        <section className="hidden lg:flex flex-col justify-between p-12 bg-[#14202a] border-r border-white/10">
          <div>
            <div className="inline-flex items-center gap-3 mb-16">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="font-extrabold tracking-tight">VeriMeasure <span className="text-amber-400">India</span></div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Legal metrology network</div>
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-4">Unified compliance workspace</p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight max-w-md">Measure with confidence. Govern with clarity.</h1>
            <p className="mt-5 text-sm leading-6 text-slate-400 max-w-md">One trusted workspace for instrument passports, field verification, certificates, and statutory oversight across India.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {['Secure records', 'Field ready', 'Audit assured'].map((item) => (
              <div key={item} className="border-t border-white/15 pt-3 text-slate-300">{item}</div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 mb-4 shadow-xl shadow-amber-500/20">
              <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">VeriMeasure India</h2>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">Unified Legal Metrology Portal</p>
          </div>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Secure sign in</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-400">Use your official credentials to continue.</p>
          </div>
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Official email</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-900/70 border border-slate-700 block w-full pl-10 pr-3 py-3 text-sm text-white rounded-xl focus:ring-amber-500 focus:border-amber-500 placeholder-slate-500"
                  placeholder="name@metrology.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900/70 border border-slate-700 block w-full pl-10 pr-3 py-3 text-sm text-white rounded-xl focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick One-Click Demo Role Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-700/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">Quick Demo Role Login</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={async () => {
                    await switchDemoRole(acc.email);
                    navigate('/');
                  }}
                  className="flex items-center justify-between px-3 py-2.5 bg-slate-900/50 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-200 transition-colors text-left"
                >
                  <span className="font-semibold">{acc.role}</span>
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Quick Switch
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
