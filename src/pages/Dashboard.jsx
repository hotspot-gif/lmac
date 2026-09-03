import { db } from '@/api/db';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';
import { useLanguage } from '@/lib/LanguageContext';

import StatCard from '@/components/StatCard';
import TicketCard from '@/components/TicketCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, Inbox, Clock, AlertOctagon, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const STATUS_CHART_COLORS = {
  Open: '#245bc1',
  'In Progress': '#00D7FF',
  Pending: 'hsl(45 97% 50%)',
  Completed: '#08dc7d'
};

export default function Dashboard() {
  const { currentUser, isAdmin } = useCustomAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin-dashboard', { replace: true });
      return;
    }
    loadTickets();
  }, [isAdmin]);

  const loadTickets = async () => {
    try {
      const data = await db.entities.Ticket.filter(
        { reporter_id: currentUser.id },
        '-created_date',
        100
      );
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
    highUrgency: tickets.filter(t => t.urgency === 'Many Customers' || t.urgency === 'Few Customers').length,
  };
  const statusChartData = ['Open', 'In Progress', 'Pending', 'Completed'].map(status => ({
    statusKey: status,
    name: t(status),
    value: tickets.filter(ticket => ticket.status === status).length
  }));

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
        <p className="text-accent text-sm font-medium mb-1">{t('Welcome back')}</p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">{t('hello', { name: currentUser?.full_name })}</h1>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
            {currentUser?.role}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
            {currentUser?.designation}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
            {currentUser?.territory}
          </span>
        </div>
      </div>

      {/* Report Issue CTA */}
      <Button
        onClick={() => navigate('/report-issue')}
        className="w-full h-14 rounded-2xl bg-[#245bc1] hover:bg-[#245bc1]/90 text-white font-semibold text-base shadow-md shadow-[#245bc1]/20"
      >
        <PlusCircle className="w-5 h-5 mr-2" /> {t('reportIssue')}
      </Button>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard label={t('Total Cases')} value={stats.total} icon={FileText} color="bg-foreground/5" textColor="text-foreground" />
        <StatCard label={t('Open')} value={stats.open} icon={Inbox} color="bg-[#245bc1]/10" textColor="text-[#245bc1]" />
        <StatCard label={t('In Progress')} value={stats.inProgress} icon={Clock} color="bg-[#00D7FF]/10" textColor="text-[#00a7cc]" />
        <StatCard label={t('Pending')} value={stats.pending} icon={Clock} color="bg-accent/15" textColor="text-secondary" />
        <StatCard label={t('Completed')} value={stats.completed} icon={CheckCircle2} color="bg-[#08dc7d]/10" textColor="text-[#06a85e]" />
        <StatCard label={t('High Urgency')} value={stats.highUrgency} icon={AlertOctagon} color="bg-primary/10" textColor="text-primary" />
      </div>

      <div className="bg-white rounded-2xl border border-foreground/8 p-4 sm:p-5">
        <h2 className="text-lg font-bold text-foreground mb-4">{t('My Cases by Status')}</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {statusChartData.map(status => (
                  <Cell key={status.statusKey} fill={STATUS_CHART_COLORS[status.statusKey]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Tickets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{t('My Reported Cases')}</h2>
          <Link to="/my-tickets" className="text-sm text-[#245bc1] font-medium hover:underline">
            {t('View all')}
          </Link>
        </div>
        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-foreground/8 p-10 text-center">
            <Inbox className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/50 font-medium">{t('No tickets reported yet')}</p>
            <p className="text-sm text-foreground/40 mt-1">{t('Click "Report an Issue" to create your first ticket.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.slice(0, 6).map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}