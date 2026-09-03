import React from 'react';
import { formatDateTime } from '@/lib/authUtils';
import { ArrowRight, MessageSquare, CheckCircle2, Plus
} from 'lucide-react';

const UPDATE_CONFIG = {
  created: { icon: Plus, color: 'text-[#245bc1]', bg: 'bg-[#245bc1]/10', label: 'Ticket Created' },
  status_change: { icon: ArrowRight, color: 'text-[#00a7cc]', bg: 'bg-[#00D7FF]/10', label: 'Status Updated' },
  response: { icon: MessageSquare, color: 'text-[#06a85e]', bg: 'bg-[#08dc7d]/10', label: 'Administrator Response' },
  completed: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10', label: 'Completed' },
};

export default function TicketTimeline({ updates }) {
  if (!updates || updates.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/40 text-sm">
        No activity recorded yet.
      </div>
    );
  }

  const sorted = [...updates].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="space-y-0">
      {sorted.map((update, idx) => {
        const config = UPDATE_CONFIG[update.update_type] || UPDATE_CONFIG.created;
        const Icon = config.icon;
        const isLast = idx === sorted.length - 1;

        return (
          <div key={update.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-foreground/10 my-1" />}
            </div>
            <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
              <div className="bg-white rounded-xl border border-foreground/8 p-3 sm:p-4">
                <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                  <p className="font-semibold text-foreground text-sm">{config.label}</p>
                  <p className="text-xs text-foreground/40">{formatDateTime(update.created_date)}</p>
                </div>
                {update.update_type === 'status_change' && (
                  <p className="text-sm text-foreground/70">
                    <span className="font-medium">{update.previous_status || 'Open'}</span>
                    {' → '}
                    <span className="font-medium">{update.new_status}</span>
                  </p>
                )}
                {update.message && (
                  <p className="text-sm text-foreground/70 mt-1 whitespace-pre-wrap">{update.message}</p>
                )}
                <p className="text-xs text-foreground/40 mt-2">By {update.created_by_name} ({update.created_by_role})</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}