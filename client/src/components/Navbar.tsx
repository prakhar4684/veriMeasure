import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { ShieldCheck, LogOut, ChevronDown, Award, Sparkles, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left Branding & Govt Seal */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <RouterLink to="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-lg font-bold tracking-tight text-white">VeriMeasure</span>
                <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">INDIA</span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-medium leading-none">Legal Metrology Portal • Dept of Consumer Affairs</p>
            </div>
          </RouterLink>
        </div>

        {/* Center / Right Quick Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* QuickVerify Public Link (No Login Required) */}
          <RouterLink
            to="/verify/QR-CERT-LM-2026-889102"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Public QuickVerify</span>
          </RouterLink>

          {user ? (
            <>
              {/* Role Switcher for Seamless Demo Testing */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 transition-colors"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline font-bold text-amber-400">{user.role}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                    <div className="px-3 py-1.5 border-b border-slate-700 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Switch Demo Role Instantly
                    </div>
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={async () => {
                          setShowRoleMenu(false);
                          await switchDemoRole(acc.email);
                          navigate('/');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/70 transition-colors ${user.email === acc.email ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-200'}`}
                      >
                        <span>{acc.role}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{acc.email.split('@')[0]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Dropdown / Logout */}
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-100">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.jurisdiction_district || 'India'}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <RouterLink
              to="/login"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-md"
            >
              Portal Login
            </RouterLink>
          )}

        </div>
      </div>
    </header>
  );
};
