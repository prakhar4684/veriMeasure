import React from 'react';

interface BadgeProps {
  status: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  let color = 'bg-slate-100 text-slate-800 border-slate-300';
  let dotColor = 'bg-slate-400';

  if (['ACTIVE', 'COMPLETED', 'SUCCESS', 'PASS', 'AUTHENTIC_VERIFIED', 'RESOLVED'].includes(norm)) {
    color = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dotColor = 'bg-emerald-500';
  } else if (['VERIFICATION_DUE', 'PAYMENT_PENDING', 'ASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'IN_INSPECTION', 'UNDER_INVESTIGATION', 'SUBMITTED'].includes(norm)) {
    color = 'bg-amber-50 text-amber-800 border-amber-300';
    dotColor = 'bg-amber-500';
  } else if (['EXPIRED', 'REJECTED', 'FAIL', 'REVOKED', 'SUSPENDED', 'DISMISSED', 'ATTENTION_REQUIRED'].includes(norm)) {
    color = 'bg-rose-50 text-rose-800 border-rose-300';
    dotColor = 'bg-rose-500';
  } else if (['UNDER_VERIFICATION', 'RE_INSPECTION_SCHEDULED'].includes(norm)) {
    color = 'bg-indigo-50 text-indigo-800 border-indigo-300';
    dotColor = 'bg-indigo-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {norm.replace(/_/g, ' ')}
    </span>
  );
};
