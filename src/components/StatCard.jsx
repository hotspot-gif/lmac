import React from 'react';

export default function StatCard({ label, value, icon: Icon, color, textColor }) {
  return (
    <div className="bg-white rounded-2xl border border-foreground/8 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">{label}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color || 'bg-foreground/5'}`}>
            <Icon className={`w-4 h-4 ${textColor || 'text-foreground/60'}`} />
          </div>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}