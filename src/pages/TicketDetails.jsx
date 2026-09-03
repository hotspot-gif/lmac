import { db } from '@/api/db';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';

import { STATUS_OPTIONS } from '@/lib/categories';
import StatusBadge from '@/components/StatusBadge';
import UrgencyBadge from '@/components/UrgencyBadge';
import TicketTimeline from '@/components/TicketTimeline';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from
'@/components/ui/select';
import {
  Card, CardContent } from
'@/components/ui/card';
import {
  ArrowLeft, Loader2, Save, CheckCircle2, AlertCircle, MessageSquare } from
'lucide-react';
import { formatDateTime } from '@/lib/authUtils';

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useCustomAuth();
  const [ticket, setTicket] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [response, setResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmComplete, setConfirmComplete] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      const t = await db.entities.Ticket.get(id);
      if (!isAdmin && t.reporter_id !== currentUser.id) {
        navigate('/', { replace: true });
        return;
      }
      setTicket(t);
      setNewStatus(t.status);
      const u = await db.entities.TicketUpdate.filter({ ticket_id: id }, 'created_date', 200);
      setUpdates(u || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const recordUpdate = async (updateType, message, prevStatus, newStatusVal) => {
    await db.entities.TicketUpdate.create({
      ticket_id: id,
      update_type: updateType,
      previous_status: prevStatus || null,
      new_status: newStatusVal || null,
      message: message || null,
      created_by: currentUser.id,
      created_by_name: currentUser.full_name,
      created_by_role: currentUser.role
    });
  };

  const notifyReporter = async (ticketData, oldStatus, newStatusVal) => {
    if (!ticketData.reporter_email) return;
    try {
      await db.integrations.Core.SendEmail({
        to: ticketData.reporter_email,
        subject: `[${ticketData.ticket_number}] Ticket status updated to "${newStatusVal}"`,
        body: [
          `Hello ${ticketData.reporter_name || 'Team Member'},`,
          '',
          `The status of your ticket has been updated by an administrator.`,
          '',
          `Ticket Number : ${ticketData.ticket_number}`,
          `Subject       : ${ticketData.subject}`,
          `Previous Status : ${oldStatus}`,
          `New Status      : ${newStatusVal}`,
          `Updated By      : ${currentUser.full_name} (${currentUser.role})`,
          '',
          'Please log in to the MarketFlow portal to view the full details and any responses.',
          '',
          'Regards,',
          'MarketFlow Team',
        ].join('\n'),
      });
    } catch (e) {
      console.error('Failed to send status notification email:', e);
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === ticket.status) return;
    setActionLoading(true);
    setError('');
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'Completed') {
        updateData.completed_at = new Date().toISOString();
      }
      await db.entities.Ticket.update(id, updateData);
      await recordUpdate('status_change', null, ticket.status, newStatus);
      await notifyReporter(ticket, ticket.status, newStatus);
      await loadTicket();
    } catch {
      setError('Failed to update status.');
    }
    setActionLoading(false);
  };

  const handleResponse = async () => {
    if (!response.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      await recordUpdate('response', response.trim(), null, null);
      setResponse('');
      await loadTicket();
    } catch {
      setError('Failed to post response.');
    }
    setActionLoading(false);
  };

  const handleComplete = async () => {
    setActionLoading(true);
    setError('');
    try {
      await db.entities.Ticket.update(id, {
        status: 'Completed',
        completed_at: new Date().toISOString()
      });
      await recordUpdate('completed', 'Issue marked as completed.', ticket.status, 'Completed');
      await notifyReporter(ticket, ticket.status, 'Completed');
      setConfirmComplete(false);
      await loadTicket();
    } catch {
      setError('Failed to complete ticket.');
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-foreground animate-spin" />
      </div>);

  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-foreground/50">Ticket not found.</p>
        <Link to="/" className="text-[#245bc1] text-sm mt-2 inline-block hover:underline">Go back</Link>
      </div>);

  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
        
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Ticket Header */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="bg-foreground p-5 sm:p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-accent text-xs font-mono font-semibold mb-1">{ticket.ticket_number}</p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{ticket.subject}</h1>
            </div>
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <InfoItem label="Category" value={ticket.category} />
            <InfoItem label="Sub Category" value={ticket.sub_category} />
            <InfoItem label="Impact" value={ticket.impact} />
            <div>
              <p className="text-xs text-foreground/50 mb-1">Urgency</p>
              <UrgencyBadge level={ticket.urgency} />
            </div>
            <InfoItem label="Reported By" value={ticket.reporter_name} />
            <InfoItem label="Role" value={ticket.reporter_role} />
            <InfoItem label="Territory" value={ticket.reporter_territory} />
            <InfoItem label="Designation" value={ticket.reporter_designation} />
            <InfoItem label="Created" value={formatDateTime(ticket.created_date)} />
            <InfoItem label="Last Updated" value={formatDateTime(ticket.updated_date)} />
          </div>
          <div className="mt-4 pt-4 border-t border-foreground/8">
            <p className="text-xs text-foreground/50 mb-1">Description</p>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {isAdmin &&
      <Card className="border-0 shadow-lg rounded-2xl p-5 sm:p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Admin Actions
          </h2>

          {error &&
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
        }

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="rounded-xl bg-white border-foreground/15">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button
              onClick={handleStatusUpdate}
              disabled={actionLoading || newStatus === ticket.status}
              className="rounded-xl bg-[#245bc1] hover:bg-[#245bc1]/90 text-white h-10">
              
                <Save className="w-4 h-4 mr-1.5" /> Save Status
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium text-sm">Add Response</Label>
              <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your detailed response to this ticket..."
              rows={4}
              className="rounded-xl bg-white border-foreground/15 resize-none" />
            
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                onClick={handleResponse}
                disabled={actionLoading || !response.trim()}
                className="flex-1 rounded-xl bg-foreground hover:bg-foreground/90 text-white">
                
                  <MessageSquare className="w-4 h-4 mr-1.5" /> Post Response
                </Button>
                {ticket.status !== 'Completed' &&
              <Button
                onClick={() => setConfirmComplete(true)}
                disabled={actionLoading}
                className="flex-1 sm:flex-none rounded-xl bg-[#08dc7d] hover:bg-[#08dc7d]/90 text-white">
                
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark Completed
                  </Button>
              }
              </div>
            </div>
          </div>
        </Card>
      }

      {/* Activity Timeline */}
      <Card className="border-0 shadow-lg rounded-2xl p-5 sm:p-6">
        <h2 className="font-bold text-foreground mb-4">Activity Timeline</h2>
        <TicketTimeline updates={updates} />
      </Card>

      {/* Complete Confirmation */}
      {confirmComplete &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="border-0 shadow-2xl rounded-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">Mark as Completed?</h3>
              <p className="text-sm text-foreground/60 mb-5">
                This will close ticket {ticket.ticket_number}. The reporter will be notified of the completion.
              </p>
              <div className="flex gap-3">
                <Button
                onClick={() => setConfirmComplete(false)}
                variant="outline"
                className="flex-1 rounded-xl border-foreground/15 text-foreground">
                
                  Cancel
                </Button>
                <Button
                onClick={handleComplete}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-[#08dc7d] hover:bg-[#08dc7d]/90 text-white">
                
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      }
    </div>);

}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-foreground/50 mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value || '—'}</p>
    </div>);

}