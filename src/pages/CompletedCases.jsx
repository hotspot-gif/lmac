import { db } from '@/api/db';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';

import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/authUtils';
import { CATEGORY_LIST } from '@/lib/categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Inbox, CheckCircle2, SlidersHorizontal, X } from 'lucide-react';

export default function CompletedCases() {
  const { isAdmin } = useCustomAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ branch: 'all', category: 'all' });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
      return;
    }
    loadTickets();
  }, [isAdmin]);

  const loadTickets = async () => {
    try {
      const data = await db.entities.Ticket.list('-updated_date', 500);
      const completed = (data || []).filter(t => t.status === 'Completed');
      setTickets(completed);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const branches = [...new Set(tickets.map(ticket => ticket.reporter_territory).filter(Boolean))].sort();
  const filteredTickets = tickets.filter(ticket =>
    (filters.branch === 'all' || ticket.reporter_territory === filters.branch) &&
    (filters.category === 'all' || ticket.category === filters.category)
  );
  const activeFilterCount = Object.values(filters).filter(value => value !== 'all').length;
  const clearFilters = () => setFilters({ branch: 'all', category: 'all' });

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
          <CheckCircle2 className="w-6 h-6 text-[#08dc7d]" /> Completed Cases
        </h1>
        <p className="text-sm text-foreground/50 mt-1">All resolved and closed tickets.</p>
      </div>

      <div className="bg-white rounded-2xl border border-foreground/8 p-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mr-2">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </div>
        <CompletedFilter label="Branch" value={filters.branch} onChange={(value) => setFilters({ ...filters, branch: value })} options={branches} />
        <CompletedFilter label="Category" value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })} options={CATEGORY_LIST} />
        {activeFilterCount > 0 && <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"><X className="w-3.5 h-3.5" /> Clear</button>}
      </div>

      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-foreground/8 p-10 text-center">
          <Inbox className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/50 font-medium">No completed cases</p>
          <p className="text-sm text-foreground/40 mt-1">Completed tickets will appear here.</p>
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
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Sub Category</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                  <th className="text-left px-4 py-3 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {filteredTickets.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="cursor-pointer hover:bg-background/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#245bc1] whitespace-nowrap">{t.ticket_number}</td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{t.subject}</td>
                    <td className="px-4 py-3 text-foreground/70 whitespace-nowrap">{t.reporter_name}</td>
                    <td className="px-4 py-3 text-foreground/70 text-xs">{t.category}</td>
                    <td className="px-4 py-3 text-foreground/70 text-xs">{t.sub_category}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-foreground/50 text-xs whitespace-nowrap">{formatDate(t.created_date)}</td>
                    <td className="px-4 py-3 text-foreground/50 text-xs whitespace-nowrap">{formatDate(t.completed_at || t.updated_date)}</td>
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
                className="p-4 cursor-pointer hover:bg-background/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-mono text-xs font-semibold text-[#245bc1]">{t.ticket_number}</p>
                  <StatusBadge status={t.status} />
                </div>
                <p className="font-medium text-foreground text-sm mb-1 line-clamp-1">{t.subject}</p>
                <p className="text-xs text-foreground/50">{t.reporter_name} · {t.category}</p>
                <p className="text-xs text-foreground/40 mt-0.5">Completed {formatDate(t.completed_at || t.updated_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompletedFilter({ label, value, onChange, options }) {
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