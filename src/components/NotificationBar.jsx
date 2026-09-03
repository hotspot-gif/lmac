import { db } from '@/api/db';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';

import { Bell, RefreshCw, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { formatDateTime } from '@/lib/authUtils';

const seenKey = (userId) => `mirt_notif_seen_${userId}`;

export default function NotificationBar() {
  const { currentUser, isAdmin } = useCustomAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSeenDate, setLastSeenDate] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (currentUser?.id) {
      setLastSeenDate(localStorage.getItem(seenKey(currentUser.id)) || null);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const [updates, allTickets] = await Promise.all([
        db.entities.TicketUpdate.list('-created_date', 50),
        db.entities.Ticket.list('-created_date', 200)
      ]);
      const ticketMap = new Map((allTickets || []).map(t => [t.id, t]));
      let relevant = (updates || []).filter(u =>
        ['status_change', 'response', 'completed'].includes(u.update_type) &&
        u.created_by !== currentUser.id
      );
      if (!isAdmin) {
        const myTicketIds = new Set((allTickets || []).filter(t => t.reporter_id === currentUser.id).map(t => t.id));
        relevant = relevant.filter(u => myTicketIds.has(u.ticket_id));
      }
      setNotifications(relevant.slice(0, 20).map(u => ({ ...u, ticket: ticketMap.get(u.ticket_id) })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const unreadCount = notifications.filter(n => !lastSeenDate || n.created_date > lastSeenDate).length;

  const handleToggle = () => {
    const newOpen = !open;
    setOpen(newOpen);
    if (newOpen && notifications.length > 0 && currentUser?.id) {
      const latest = notifications[0].created_date;
      setLastSeenDate(latest);
      localStorage.setItem(seenKey(currentUser.id), latest);
    }
  };

  const getIcon = (type) => {
    if (type === 'status_change') return <RefreshCw className="w-4 h-4 text-[#245bc1]" />;
    if (type === 'response') return <MessageSquare className="w-4 h-4 text-foreground" />;
    if (type === 'completed') return <CheckCircle2 className="w-4 h-4 text-[#08dc7d]" />;
    return <Bell className="w-4 h-4 text-foreground" />;
  };

  const getDescription = (n) => {
    if (n.update_type === 'status_change') {
      return `Status changed from "${n.previous_status}" to "${n.new_status}"`;
    }
    if (n.update_type === 'response') {
      return n.message ? `Response: "${n.message.length > 80 ? n.message.slice(0, 80) + '…' : n.message}"` : 'New response added';
    }
    if (n.update_type === 'completed') {
      return n.message || 'Ticket marked as completed';
    }
    return 'Ticket updated';
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-foreground/10 hover:border-foreground/20 transition-colors"
      >
        <div className="relative">
          <Bell className="w-4 h-4 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#245bc1] text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:inline">Notifications</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-96 overflow-y-auto rounded-xl bg-white border border-foreground/10 shadow-xl z-50">
            <div className="sticky top-0 bg-foreground px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Notifications</h3>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-foreground/50">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-foreground/50">No new notifications</div>
            ) : (
              <div className="divide-y divide-foreground/5">
                {notifications.map(n => {
                  const isNew = !lastSeenDate || n.created_date > lastSeenDate;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        setOpen(false);
                        navigate(`/tickets/${n.ticket_id}`);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-foreground/5 flex gap-3 ${isNew ? 'bg-[#245bc1]/5' : ''}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">{getIcon(n.update_type)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{getDescription(n)}</p>
                        <p className="text-xs text-foreground/50 mt-0.5">
                          {n.ticket?.ticket_number || 'Ticket'} · {n.created_by_name}
                        </p>
                        <p className="text-xs text-foreground/40">{formatDateTime(n.created_date)}</p>
                      </div>
                      {isNew && <span className="w-2 h-2 rounded-full bg-[#245bc1] flex-shrink-0 mt-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}