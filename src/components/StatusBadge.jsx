import React from 'react';

const STATUS_STYLES = {
  'Open': 'bg-[#245bc1]/10 text-[#245bc1] border-[#245bc1]/20',
  'In Progress': 'bg-[#00D7FF]/10 text-[#00a7cc] border-[#00D7FF]/30',
  'Pending': 'bg-accent/15 text-secondary border-accent/30',
  'Completed': 'bg-[#08dc7d]/10 text-[#06a85e] border-[#08dc7d]/20',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
      {status}
    </span>
  );
}