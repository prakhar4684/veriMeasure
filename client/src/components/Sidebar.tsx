import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Gauge, FileText, CalendarCheck, ShieldAlert, Award, FileSearch, Settings, HelpCircle } from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose }) => {
  const { user } = useAuth();
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  if (!user) return null;

  const role = user.role;

  const links = [
    { to: '/', label: 'MasterWindow Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'LMO', 'GATC_OPERATOR', 'STATE_ADMIN', 'CENTRAL_ADMIN'] },
    { to: '/instruments', label: 'MeterID Passport Registry', icon: Gauge, roles: ['OWNER', 'LMO', 'STATE_ADMIN', 'CENTRAL_ADMIN'] },
    { to: '/applications', label: 'VerifyFlow Applications', icon: FileText, roles: ['OWNER', 'LMO', 'STATE_ADMIN', 'CENTRAL_ADMIN'] },
    { to: '/field-verify', label: 'FieldVerify Workspace', icon: CalendarCheck, roles: ['LMO', 'GATC_OPERATOR', 'STATE_ADMIN'] },
    { to: '/certificates', label: 'CertiSure Certificates', icon: Award, roles: ['OWNER', 'LMO', 'STATE_ADMIN', 'CENTRAL_ADMIN'] },
    { to: '/complaints', label: 'ComplainO Public Complaints', icon: ShieldAlert, roles: ['LMO', 'STATE_ADMIN', 'CENTRAL_ADMIN'] },
    { to: '/audit-logs', label: 'AuditLogs Immutable Trail', icon: FileSearch, roles: ['STATE_ADMIN', 'CENTRAL_ADMIN'] },
    { to: '/rule-management', label: 'Metrology Rules Admin', icon: Settings, roles: ['STATE_ADMIN', 'CENTRAL_ADMIN'] },
  ];

  const allowedLinks = links.filter(l => l.roles.includes(role));

  const navigation = (
    <>
      <div className="p-4 border-b border-slate-800/80">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Workspace</div>
        <div className="text-sm font-bold text-amber-400 mt-0.5">{role.replace(/_/g, ' ')}</div>
        <div className="text-xs text-slate-400 truncate">{user.organization_id || 'State Department'}</div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {allowedLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              onClick={onClose}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center space-x-2 text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Legal Metrology Act, 2009</span>
        </div>
        <div>VeriMeasure Engine v1.0.0</div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col min-h-[calc(100vh-4rem)]">
        {navigation}
      </aside>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button type="button" aria-label="Close navigation menu" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <aside className="relative z-10 w-[min(19rem,88vw)] bg-slate-900 text-white flex flex-col min-h-full shadow-2xl animate-slide-in">
            <div className="flex justify-end px-4 pt-4">
              <button type="button" aria-label="Close navigation menu" onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
    </>
  );
};
