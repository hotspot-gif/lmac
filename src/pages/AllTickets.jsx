import { db } from '@/api/db';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';

import StatusBadge from '@/components/StatusBadge';
import UrgencyBadge from '@/components/UrgencyBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CATEGORY_LIST, STATUS_OPTIONS, IMPACT_OPTIONS, URGENCY_OPTIONS } from '@/lib/categories';
import { formatDate } from '@/lib/authUtils';
import { Loader2, Search, SlidersHorizontal, X, Inbox } from 'lucide-react';

export default function AllTickets() {
  const { isAdmin } = useCustomAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'all', category: 'all', subCategory: 'all', role: 'all',
    branch: 'all', impact: 'all', urgency: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

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
      setTickets(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const territories = [...new Set(tickets.map(t => t.reporter_territory).filter(Boolean))].sort();
  const roles = [...new Set(tickets.map(t => t.reporter_role).filter(Boolean))].sort();
  const subCategories = filters.category !== 'all'
    ? [...new Set(tickets.filter(t => t.category === filters.category).map(t => t.sub_category).filter(Boolean))].sort()
    : [];

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.reporter_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.reporter_email?.toLowerCase().includes(search.toLowerCase()) ||
      t.reporter_territory?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filters.status === 'all' || t.status === filters.status;
    const matchCategory = filters.category === 'all' || t.category === filters.category;
    const matchSubCategory = filters.subCategory === 'all' || t.sub_category === filters.subCategory;
    const matchRole = filters.role === 'all' || t.reporter_role === filters.role;
    const matchBranch = filters.branch === 'all' || t.reporter_territory === filters.branch;
    const matchImpact = filters.impact === 'all' || t.impact === filters.impact;
    const matchUrgency = filters.urgency === 'all' || t.urgency === filters.urgency;
    return matchSearch && matchStatus && matchCategory && matchSubCategory && matchRole && matchBranch && matchImpact && matchUrgency;
  });

  const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

  const clearFilters = () => {
    setFilters({ status: 'all', category: 'all', subCategory: 'all', role: 'all', branch: 'all', impact: 'all', urgency: 'all' });
  };

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
        <h1 className="text-2xl font-bold text-foreground">All Tickets</h1>
        <p className="text-sm text-foreground/50 mt-1">Search and filter all reported tickets.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ticket ID, subject, name, email, or territory..."
          className="pl-10 rounded-xl bg-white border-foreground/15 h-11"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="rounded-xl border-foreground/15 text-foreground"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-foreground text-white text-xs px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </Button>
        <p className="text-sm text-foreground/50">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-foreground/8 p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })}
              options={STATUS_OPTIONS} />
            <FilterSelect label="Category" value={filters.category} onChange={(v) => setFilters({ ...filters, category: v, subCategory: 'all' })}
              options={CATEGORY_LIST} />
            {filters.category !== 'all' && (
              <FilterSelect label="Sub Category" value={filters.subCategory} onChange={(v) => setFilters({ ...filters, subCategory: v })}
                options={subCategories} />
            )}
            <FilterSelect label="Role" value={filters.role} onChange={(v) => setFilters({ ...filters, role: v })}
              options={roles} />
            <FilterSelect label="Branch" value={filters.branch} onChange={(v) => setFilters({ ...filters, branch: v })}
              options={territories} />
            <FilterSelect label="Impact" value={filters.impact} onChange={(v) => setFilters({ ...filters, impact: v })}
              options={IMPACT_OPTIONS} />
            <FilterSelect label="Urgency" value={filters.urgency} onChange={(v) => setFilters({ ...filters, urgency: v })}
              options={URGENCY_OPTIONS} />
          </div>
          {activeFilterCount > 0 && (
            <Button onClick={clearFilters} variant="ghost" className="text-foreground/60 hover:text-foreground">
              <X className="w-3.5 h-3.5 mr-1" /> Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Tickets Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-foreground/8 p-10 text-center">
          <Inbox className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/50 font-medium">No tickets found</p>
          <p className="text-sm text-foreground/40 mt-1">Try adjusting your search or filters.</p>
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
                  <th className="text-left px-4 py-3 font-medium">Impact</th>
                  <th className="text-left px-4 py-3 font-medium">Urgency</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {filtered.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="cursor-pointer hover:bg-background/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#245bc1] whitespace-nowrap">{t.ticket_number}</td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{t.subject}</td>
                    <td className="px-4 py-3 text-foreground/70 whitespace-nowrap">{t.reporter_name}</td>
                    <td className="px-4 py-3 text-foreground/70 text-xs">{t.reporter_role}</td>
                    <td className="px-4 py-3 text-foreground/70 text-xs whitespace-nowrap">{t.reporter_territory}</td>
                    <td className="px-4 py-3 text-foreground/70 text-xs">{t.category}</td>
                    <td className="px-4 py-3 text-xs text-foreground/70">{t.impact}</td>
                    <td className="px-4 py-3"><UrgencyBadge level={t.urgency} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-foreground/50 text-xs whitespace-nowrap">{formatDate(t.created_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden divide-y divide-foreground/5">
            {filtered.map(t => (
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
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <p className="text-xs text-foreground/50">{t.reporter_name} · {t.reporter_territory}</p>
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

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-foreground/60 font-medium">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl bg-white border-foreground/15 h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {label}s</SelectItem>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}