import { db } from '@/api/db';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';

import StatusBadge from '@/components/StatusBadge';
import UrgencyBadge from '@/components/UrgencyBadge';
import { formatDate } from '@/lib/authUtils';
import { CATEGORY_LIST, STATUS_OPTIONS } from '@/lib/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Inbox, Clock, SlidersHorizontal, X } from 'lucide-react';

export default function PendingCases() {
  const { isAdmin } = useCustomAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', branch: 'all', category: 'all' });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
      return;
    }
    loadTickets();
  }, [isAdmin]);

  const loadTickets = async () => {
    try {
      const data = await db.entities.Ticket.list('-created_date', 500);
      const active = (data || []).filter(t => t.status !== 'Completed');
      setTickets(active);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const branches = [...new Set(tickets.map(ticket => ticket.reporter_territory).filter(Boolean))].sort();
  const filteredTickets = tickets.filter(ticket =>
    (filters.status === 'all' || ticket.status === filters.status) &&
    (filters.branch === 'all' || ticket.reporter_territory === filters.branch) &&
    (filters.category === 'all' || ticket.category === filters.category)
  );
  const activeFilterCount = Object.values(filters).filter(value => value !== 'all').length;
  const clearFilters = () => setFilters({ status: 'all', branch: 'all', category: 'all' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="w-6 h-6 text-accent" /> Pending Cases
        </h1>
        <p className="text-sm text-foreground/50 mt-1">Active tickets requiring attention.</p>
      </div>

      <div className="bg-white rounded-2xl border border-foreground/8 p-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mr-2">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </div>
        <PendingFilter label="Status" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })} options={STATUS_OPTIONS.filter(status => status !== 'Completed')} />
        <PendingFilter label="Branch" value={filters.branch} onChange={(value) => setFilters({ ...filters, branch: value })} options={branches} />
        <PendingFilter label="Category" value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })} options={CATEGORY_LIST} />
        {activeFilterCount > 0 && <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"><X className="w-3.5 h-3.5" /> Clear</button>}
      </div>

      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-foreground/8 p-10 text-center">
          <Inbox className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/50 font-medium">No pending cases</p>
          <p className="text-sm text-foreground/40 mt-1">All tickets have been completed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-foreground/8 shadow-sm overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background text-foreground/60 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Ticket ID</th>
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 font-medium">Reported By</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Territory</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Sub Category</th>
                  <th className="text-left px-4 py-3 font-medium">Impact</th>
                  <th className="text-left px-4 py-3 font-medium">Urgency</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                  <th className="text-left px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {filteredTickets.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className={`cursor-pointer transition-colors border-l-4 ${statusRowColor(t.status)}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#245bc1] whitespace-nowrap">{t.ticket_number}</td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{t.subject}</td>
                    <td className="px-4 py-3 text-foreground/70 whitespace-nowrap">{t.reporter_name}</td>
                    <td className="px-4 py-3 text-foreground/70 text-xs">{t.reporter_role}</td>
                    <td className="px-4 py-3 text-foreground/70 text-xs whitespace-nowrap">{t.reporter_territory}</td>
                    <td className="px-4 py-3 text-foreground/70 text-xs">{t.category}</td>
                    <td className="px-4 py-3 text-foreground/70 text-xs">{t.sub_category}</td>
                    <td className="px-4 py-3 text-xs text-foreground/70">{t.impact}</td>
                    <td className="px-4 py-3"><UrgencyBadge level={t.urgency} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-foreground/50 text-xs whitespace-nowrap">{formatDate(t.created_date)}</td>
                    <td className="px-4 py-3 text-foreground/50 text-xs whitespace-nowrap">{formatDate(t.updated_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden divide-y divide-foreground/5">
            {filteredTickets.map(t => (
              <div
                key={t.id}
                onClick={() => navigate(`/tickets/${t.id}`)}
                className={`p-4 cursor-pointer transition-colors border-l-4 ${statusRowColor(t.status)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-mono text-xs font-semibold text-[#245bc1]">{t.ticket_number}</p>
                  <StatusBadge status={t.status} />
                </div>
                <p className="font-medium text-foreground text-sm mb-1 line-clamp-1">{t.subject}</p>
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <p className="text-xs text-foreground/50">{t.reporter_name} · {t.category}</p>
                  <UrgencyBadge level={t.urgency} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function statusRowColor(status) {
  return {
    Open: 'border-l-[#245bc1] hover:bg-[#245bc1]/5',
    'In Progress': 'border-l-[#00a7cc] hover:bg-[#00D7FF]/5',
    Pending: 'border-l-[#d97706] hover:bg-accent/10'
  }[status] || 'border-l-foreground/10 hover:bg-background/50';
}

function PendingFilter({ label, value, onChange, options }) {
  return (
    <div className="min-w-40">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl bg-white border-foreground/15 h-10"><SelectValue placeholder={`All ${label}s`} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {label}s</SelectItem>
          {options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}