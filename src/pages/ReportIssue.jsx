import { db } from '@/api/db';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';

import { IMPACT_OPTIONS, URGENCY_OPTIONS, MOBILE_NETWORK_CATEGORIES } from '@/lib/categories';
import CategorySelect from '@/components/CategorySelect';
import DropdownSelect from '@/components/DropdownSelect';
import MsisdnInput, { MAX_MSISDNS } from '@/components/MsisdnInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';

const MAX_DESC = 2000;

export default function ReportIssue() {
  const { currentUser } = useCustomAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: '', subCategory: '', impact: '', urgency: '', subject: '', description: '', msisdns: ['']
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Please select a category.';
    if (!form.subCategory) e.subCategory = 'Please select a subcategory.';
    if (!form.impact) e.impact = 'Please select an impact level.';
    if (!form.urgency) e.urgency = 'Please select an urgency level.';
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (form.description.length > MAX_DESC) e.description = `Description must be ${MAX_DESC} characters or fewer.`;
    if (form.urgency && form.urgency !== 'No Customer Impact') {
      const isMobileNetwork = MOBILE_NETWORK_CATEGORIES.includes(form.category);
      if (form.urgency === 'Single customers') {
        if (isMobileNetwork) {
          const validMsisdns = form.msisdns.filter(m => m.trim());
          if (validMsisdns.length === 0) e.msisdns = 'At least one MSISDN is required.';
        }
      } else {
        const validMsisdns = form.msisdns.filter(m => m.trim());
        if (validMsisdns.length === 0) e.msisdns = 'At least one MSISDN is required.';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const generateTicketNumber = async () => {
    const year = new Date().getFullYear();
    const all = await db.entities.Ticket.list('-created_date', 1000);
    const yearTickets = (all || []).filter(t => t.ticket_number?.includes(`INC-${year}-`));
    const next = yearTickets.length + 1;
    return `INC-${year}-${String(next).padStart(6, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const ticketNumber = await generateTicketNumber();
      const createdTicket = await db.entities.Ticket.create({
        ticket_number: ticketNumber,
        reporter_id: currentUser.id,
        reporter_name: currentUser.full_name,
        reporter_email: currentUser.corporate_email,
        reporter_role: currentUser.role,
        reporter_designation: currentUser.designation,
        reporter_territory: currentUser.territory,
        category: form.category,
        sub_category: form.subCategory,
        impact: form.impact,
        urgency: form.urgency,
        subject: form.subject.trim(),
        description: form.description.trim(),
        msisdns: showMsisdns ? form.msisdns.filter(m => m.trim()).slice(0, msisdnMax) : [],
        status: 'Open',
      });
      await db.entities.TicketUpdate.create({
        ticket_id: createdTicket.id,
        update_type: 'created',
        message: `Issue reported by ${currentUser.full_name}.`,
        created_by: currentUser.id,
        created_by_name: currentUser.full_name,
        created_by_role: currentUser.role,
      });
      // The DB trigger guarantees a unique ticket number even when two users
      // report issues at the same time — always show the stored value.
      setSuccess(createdTicket.ticket_number || ticketNumber);
    } catch (err) {
      setErrors({ submit: 'Failed to submit ticket. Please try again.' });
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden text-center">
          <div className="bg-[#08dc7d]/10 p-8">
            <div className="w-16 h-16 rounded-full bg-[#08dc7d] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Issue Reported Successfully</h2>
            <p className="text-sm text-foreground/60 mb-4">Your issue has been reported successfully.</p>
            <div className="inline-block bg-foreground text-accent px-6 py-3 rounded-xl">
              <p className="text-xs uppercase tracking-wide text-white/60 mb-0.5">Ticket ID</p>
              <p className="text-xl font-mono font-bold">{success}</p>
            </div>
          </div>
          <div className="p-5 flex gap-3">
            <Button
              onClick={() => navigate('/my-tickets')}
              className="flex-1 rounded-xl bg-foreground hover:bg-foreground/90 text-white"
            >
              View My Tickets
            </Button>
            <Button
              onClick={() => {
                setSuccess(null);
                setForm({ category: '', subCategory: '', impact: '', urgency: '', subject: '', description: '', msisdns: [''] });
              }}
              variant="outline"
              className="flex-1 rounded-xl border-foreground/15 text-foreground"
            >
              Report Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isSingleCustomer = form.urgency === 'Single customers';
  const showMsisdns = form.urgency && form.urgency !== 'No Customer Impact' &&
    (!isSingleCustomer || MOBILE_NETWORK_CATEGORIES.includes(form.category));
  const msisdnMax = isSingleCustomer ? 1 : MAX_MSISDNS;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-foreground">Report an Issue</h1>
        <p className="text-sm text-foreground/50 mt-1">Fill in the details below to report a market issue.</p>
      </div>

      <Card className="border-0 shadow-lg rounded-2xl p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <CategorySelect
            category={form.category}
            subCategory={form.subCategory}
            onCategoryChange={(v) => setForm(prev => ({ ...prev, category: v }))}
            onSubCategoryChange={(v) => setForm(prev => ({ ...prev, subCategory: v }))}
            errors={errors}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Impact <span className="text-red-500">*</span></Label>
              <DropdownSelect
                value={form.impact}
                onChange={(val) => setForm({ ...form, impact: val })}
                options={IMPACT_OPTIONS.map(o => ({ value: o, label: o }))}
                placeholder="Select impact"
                error={errors.impact}
              />
              {errors.impact && <p className="text-xs text-red-500">{errors.impact}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Urgency <span className="text-red-500">*</span></Label>
              <DropdownSelect
                value={form.urgency}
                onChange={(val) => setForm(prev => ({
                  ...prev,
                  urgency: val,
                  msisdns: val === 'Single customers' ? prev.msisdns.slice(0, 1) : prev.msisdns
                }))}
                options={URGENCY_OPTIONS.map(o => ({ value: o, label: o }))}
                placeholder="Select urgency"
                error={errors.urgency}
              />
              {errors.urgency && <p className="text-xs text-red-500">{errors.urgency}</p>}
            </div>
          </div>

          {showMsisdns && (
            <MsisdnInput
              msisdns={form.msisdns}
              onChange={(v) => setForm({ ...form, msisdns: v })}
              error={errors.msisdns}
              maxEntries={msisdnMax}
            />
          )}

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Subject <span className="text-red-500">*</span></Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief summary of the issue"
              maxLength={150}
              className={`rounded-xl bg-white ${errors.subject ? 'border-red-400' : 'border-foreground/15'}`}
            />
            {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-medium">Description <span className="text-red-500">*</span></Label>
              <span className={`text-xs ${form.description.length > MAX_DESC ? 'text-red-500' : 'text-foreground/40'}`}>
                {form.description.length} / {MAX_DESC}
              </span>
            </div>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide a detailed description of the issue..."
              rows={6}
              maxLength={MAX_DESC}
              className={`rounded-xl bg-white resize-none ${errors.description ? 'border-red-400' : 'border-foreground/15'}`}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          {errors.submit && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex-1 rounded-xl border-foreground/15 text-foreground hover:bg-background h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-foreground hover:bg-foreground/90 text-white font-medium h-11"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Submit Report</>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}