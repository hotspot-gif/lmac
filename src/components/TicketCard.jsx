import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import UrgencyBadge from '@/components/UrgencyBadge';
import { formatDate } from '@/lib/authUtils';

export default function TicketCard({ ticket }) {
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="block bg-white rounded-2xl border border-foreground/8 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-foreground/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs font-mono font-semibold text-[#245bc1] mb-1">{ticket.ticket_number}</p>
          <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug line-clamp-2">{ticket.subject}</h3>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-background text-foreground/70 border border-foreground/8">
          {ticket.category}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-background text-foreground/70 border border-foreground/8">
          {ticket.sub_category}
        </span>
        <UrgencyBadge level={ticket.urgency} />
      </div>
      <div className="flex items-center justify-between text-xs text-foreground/40 pt-2 border-t border-foreground/5">
        <span>Created {formatDate(ticket.created_date)}</span>
        <span>Updated {formatDate(ticket.updated_date)}</span>
      </div>
    </Link>
  );
}