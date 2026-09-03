import { db } from '@/api/db';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';

import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import UrgencyBadge from '@/components/UrgencyBadge';
import { formatDate } from '@/lib/authUtils';
import { FileText, Inbox, Clock, CheckCircle2, AlertOctagon, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, isAdmin } = useCustomAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    pending: tickets.filter(t => t.status === 'Pending').length,
    completed: tickets.filter(t => t.status === 'Completed').length,
    serviceImpact: tickets.filter(t => t.impact === 'Telecom/POS/Activations/TopUps/MNP' && t.status !== 'Completed').length,
    manyCustomers: tickets.filter(t => t.urgency === 'Many Customers' && t.status !== 'Completed').length,
  };

  const activeTickets = tickets
    .filter(t => t.status !== 'Completed')
    .sort((a, b) => {
      const urgencyOrder = { 'Many Customers': 0, 'Few Customers': 1, 'Single customers': 2, 'No Customer Impact': 3 };
      return (urgencyOrder[a.urgency] || 4) - (urgencyOrder[b.urgency] || 4);
    })
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-foreground to-foreground rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-foreground/10">
        <p className="text-accent text-sm font-medium mb-1">Welcome back</p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Hello, {currentUser?.full_name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10">
            {currentUser?.role}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10">
            {currentUser?.designation}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10">
            {currentUser?.territory}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Pending Cases Summary</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          <StatCard label="Total Tickets" value={stats.total} icon={FileText} color="bg-foreground/5" textColor="text-foreground" />
          <StatCard label="Open" value={stats.open} icon={Inbox} color="bg-[#245bc1]/10" textColor="text-[#245bc1]" />
          <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="bg-[#00D7FF]/10" textColor="text-[#00a7cc]" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-accent/15" textColor="text-secondary" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="bg-[#08dc7d]/10" textColor="text-[#06a85e]" />
          <StatCard label="Service Impact" value={stats.serviceImpact} icon={AlertOctagon} color="bg-primary/10" textColor="text-primary" />
          <StatCard label="Many Customers" value={stats.manyCustomers} icon={AlertTriangle} color="bg-destructive/30" textColor="text-destructive-foreground" />
        </div>
      </div>

      {/* Active Tickets Needing Attention */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Tickets Requiring Attention</h2>
          <Link to="/all-tickets" className="text-sm text-[#245bc1] font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {activeTickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-foreground/8 p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#08dc7d] mx-auto mb-3" />
            <p className="text-foreground/50 font-medium">All caught up!</p>
            <p className="text-sm text-foreground/40 mt-1">No active tickets require attention.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-foreground/8 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background text-foreground/60 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Ticket ID</th>
                    <th className="text-left px-4 py-3 font-medium">Subject</th>
                    <th className="text-left px-4 py-3 font-medium">Reported By</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Urgency</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  {activeTickets.map(t => (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      className="cursor-pointer hover:bg-background/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#245bc1]">{t.ticket_number}</td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{t.subject}</td>
                      <td className="px-4 py-3 text-foreground/70">{t.reporter_name}</td>
                      <td className="px-4 py-3 text-foreground/70 text-xs">{t.category}</td>
                      <td className="px-4 py-3"><UrgencyBadge level={t.urgency} /></td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-foreground/50 text-xs">{formatDate(t.created_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-foreground/5">
              {activeTickets.map(t => (
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-foreground/50">{t.reporter_name} · {t.category}</p>
                    <UrgencyBadge level={t.urgency} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}