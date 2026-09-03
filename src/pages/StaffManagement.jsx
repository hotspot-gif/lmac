import { db } from '@/api/db';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/lib/customAuth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { ADMIN_ROLES, STANDARD_ROLES } from '@/lib/categories';
import { toast } from '@/components/ui/use-toast';
import {
  Loader2, Search, UserPlus, Pencil, Power, PowerOff, Users, Mail
} from 'lucide-react';

const ALL_ROLES = [...ADMIN_ROLES, ...STANDARD_ROLES];

export default function StaffManagement() {
  const { isAdmin } = useCustomAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', role: '', designation: '', corporate_email: '',
    mobile_number: '', password: '', territory: '', is_active: true
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
      return;
    }
    loadStaff();
  }, [isAdmin]);

  const loadStaff = async () => {
    try {
      const data = await db.entities.Staff.list('-created_date', 200);
      setStaff(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ full_name: '', role: '', designation: '', corporate_email: '', mobile_number: '', password: '', territory: '', is_active: true });
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      full_name: s.full_name, role: s.role, designation: s.designation || '',
      corporate_email: s.corporate_email, mobile_number: s.mobile_number,
      password: '', territory: s.territory || '', is_active: s.is_active
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) {
      toast({
        title: 'Role required',
        description: 'Select a role before adding the staff member.',
        variant: 'destructive',
      });
      return;
    }
    setFormLoading(true);
    try {
      if (editing) {
        // Admin edit — routed through the admin_update_staff() SQL function so
        // the Supabase Auth user (password, ban status, email) stays in sync.
        await db.rpc('admin_update_staff', {
          p_staff_id: editing.id,
          p_full_name: form.full_name,
          p_role: form.role,
          p_designation: form.designation,
          p_corporate_email: form.corporate_email.toLowerCase().trim(),
          p_mobile_number: form.mobile_number,
          p_territory: form.territory,
          p_is_active: form.is_active,
        });
      } else {
        // Admin creates staff and the matching Supabase Auth user.
        await db.rpc('admin_create_staff', {
          p_full_name: form.full_name,
          p_role: form.role,
          p_designation: form.designation,
          p_corporate_email: form.corporate_email.toLowerCase().trim(),
          p_mobile_number: form.mobile_number,
          p_password: form.password,
          p_territory: form.territory,
        });
      }
      setShowForm(false);
      await loadStaff();
    } catch (err) {
      console.error(err);
      toast({
        title: editing ? 'Unable to update staff member' : 'Unable to add staff member',
        description: err.message || 'Please check the details and try again.',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      await db.rpc('admin_set_staff_active', { p_staff_id: s.id, p_is_active: !s.is_active });
      await loadStaff();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = staff.filter(s => {
    const matchSearch = !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.corporate_email?.toLowerCase().includes(search.toLowerCase()) ||
      s.territory?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || s.role === roleFilter;
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && s.is_active) ||
      (statusFilter === 'inactive' && !s.is_active);
    return matchSearch && matchRole && matchStatus;
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6" /> Staff Management
          </h1>
          <p className="text-sm text-foreground/50 mt-1">Manage active staff accounts.</p>
        </div>
        <Button onClick={openAdd} className="rounded-xl bg-foreground hover:bg-foreground/90 text-white">
          <UserPlus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or territory..."
            className="pl-10 rounded-xl bg-white border-foreground/15"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="sm:w-36 rounded-xl bg-white border-foreground/15">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-36 rounded-xl bg-white border-foreground/15">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id} className={`border-0 shadow-sm rounded-2xl p-4 ${!s.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                ADMIN_ROLES.includes(s.role) ? 'bg-primary/10 text-primary' : 'bg-[#245bc1]/10 text-[#245bc1]'
              }`}>
                {s.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{s.full_name}</p>
                <p className="text-xs text-foreground/50 truncate">{s.designation}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                s.is_active ? 'bg-[#08dc7d]/10 text-[#06a85e]' : 'bg-gray-100 text-gray-500'
              }`}>
                {s.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-foreground/60">
              <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{s.corporate_email}</span></p>
              <p><span className="font-medium text-foreground/70">Role:</span> {s.role}</p>
              <p><span className="font-medium text-foreground/70">Territory:</span> {s.territory}</p>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-foreground/5">
              <Button
                onClick={() => openEdit(s)}
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg border-foreground/15 text-foreground text-xs h-8"
              >
                <Pencil className="w-3 h-3 mr-1" /> Edit
              </Button>
              <Button
                onClick={() => toggleActive(s)}
                variant="outline"
                size="sm"
                className={`flex-1 rounded-lg text-xs h-8 ${
                  s.is_active
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-[#08dc7d]/30 text-[#06a85e] hover:bg-[#08dc7d]/5'
                }`}
              >
                {s.is_active ? <><PowerOff className="w-3 h-3 mr-1" /> Deactivate</> : <><Power className="w-3 h-3 mr-1" /> Reactivate</>}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-foreground/8 p-10 text-center">
          <Users className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/50 font-medium">No staff found</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium text-sm">Full Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                className="rounded-xl border-foreground/15"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Role <span className="text-red-500">*</span></Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="rounded-xl border-foreground/15"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Designation</Label>
                <Input
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="rounded-xl border-foreground/15"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium text-sm">Corporate Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={form.corporate_email}
                onChange={(e) => setForm({ ...form, corporate_email: e.target.value })}
                required
                className="rounded-xl border-foreground/15"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Mobile Number <span className="text-red-500">*</span></Label>
                <Input
                  value={form.mobile_number}
                  onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
                  required
                  className="rounded-xl border-foreground/15"
                />
                {!editing && <p className="text-xs text-foreground/40">Used only as the contact number.</p>}
              </div>
              {!editing && (
                <div className="space-y-2">
                  <Label className="text-foreground font-medium text-sm">Password <span className="text-red-500">*</span></Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                    className="rounded-xl border-foreground/15"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-foreground/40">At least 6 characters.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Territory</Label>
                <Input
                  value={form.territory}
                  onChange={(e) => setForm({ ...form, territory: e.target.value })}
                  className="rounded-xl border-foreground/15"
                />
              </div>
            </div>
            {editing && (
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-sm">Active Status</Label>
                <Select value={String(form.is_active)} onValueChange={(v) => setForm({ ...form, is_active: v === 'true' })}>
                  <SelectTrigger className="rounded-xl border-foreground/15"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="rounded-xl border-foreground/15 text-foreground">
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} className="rounded-xl bg-foreground hover:bg-foreground/90 text-white">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Save Changes' : 'Add Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}