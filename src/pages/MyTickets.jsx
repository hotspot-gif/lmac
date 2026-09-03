import { db } from '@/api/db';
import React, { useState, useEffect } from 'react';
import { useCustomAuth } from '@/lib/customAuth';

import TicketCard from '@/components/TicketCard';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { STATUS_OPTIONS } from '@/lib/categories';
import { Loader2, Search, Inbox } from 'lucide-react';

export default function MyTickets() {
  const { currentUser } = useCustomAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await db.entities.Ticket.filter(
        { reporter_id: currentUser.id },
        '-created_date',
        200
      );
      setTickets(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
        <h1 className="text-2xl font-bold text-foreground">My Tickets</h1>
        <p className="text-sm text-foreground/50 mt-1">All issues you have reported.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject or ticket ID..."
            className="pl-10 rounded-xl bg-white border-foreground/15"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-44 rounded-xl bg-white border-foreground/15">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-foreground/8 p-10 text-center">
          <Inbox className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/50 font-medium">No tickets found</p>
          <p className="text-sm text-foreground/40 mt-1">
            {tickets.length === 0 ? 'You have not reported any issues yet.' : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(t => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}
    </div>
  );
}