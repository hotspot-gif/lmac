import React from 'react';

const URGENCY_STYLES = {
  'Many Customers': 'bg-primary/10 text-primary border-primary/20',
  'Few Customers': 'bg-accent/15 text-secondary border-accent/30',
  'Single customers': 'bg-destructive/30 text-destructive-foreground border-destructive/50',
  'No Customer Impact': 'bg-gray-100 text-gray-600 border-gray-200',
};

const URGENCY_DOTS = {
  'Many Customers': 'bg-primary',
  'Few Customers': 'bg-accent',
  'Single customers': 'bg-destructive',
  'No Customer Impact': 'bg-gray-400',
};

export default function UrgencyBadge({ level }) {
  const style = URGENCY_STYLES[level] || 'bg-gray-100 text-gray-600 border-gray-200';
  const dot = URGENCY_DOTS[level] || 'bg-gray-400';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {level}
    </span>
  );
}