// ============================================================================
// Data layer for LMAC — backed by Supabase (Postgres + Auth + Row Level
// Security). Replaces the Base44 platform client while keeping the exact same
// `db` interface, so page code works unchanged:
//
//   db.entities.Staff.list / filter / get / create / update / delete
//   db.entities.Ticket...
//   db.entities.TicketUpdate...
//   db.auth.me / logout / isAuthenticated / redirectToLogin / ...
//   db.integrations.Core.SendEmail / UploadFile   (no-ops on this deployment)
//   db.rpc(name, params) — calls Postgres functions (admin_* helpers)
//
// Tables map 1:1 to the entities (staff, tickets, ticket_updates) and sorting
// keeps the same '-created_date' convention used across the app.
// ============================================================================
import { supabase } from '@/lib/supabaseClient';

const TABLE_MAP = {
  Staff: 'staff',
  Ticket: 'tickets',
  TicketUpdate: 'ticket_updates',
};

function applySort(query, sort) {
  if (!sort) return query;
  const descending = sort.startsWith('-');
  const column = descending ? sort.slice(1) : sort;
  return query.order(column, { ascending: !descending, nullsFirst: false });
}

function applyLimit(query, limit) {
  return limit ? query.limit(limit) : query;
}

async function finalize(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

function makeEntity(table) {
  return {
    list(sort, limit) {
      return finalize(applyLimit(applySort(supabase.from(table).select('*'), sort), limit));
    },
    filter(where, sort, limit) {
      let query = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(where || {})) {
        query = query.eq(key, value);
      }
      return finalize(applyLimit(applySort(query, sort), limit));
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data || null;
    },
    async create(payload) {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    },
  };
}

const db = {
  entities: new Proxy({}, {
    get(_target, entityName) {
      if (typeof entityName !== 'string') return undefined;
      return makeEntity(TABLE_MAP[entityName] || entityName.toLowerCase());
    },
  }),

  // Call a Postgres function (SECURITY DEFINER helpers defined in supabase_schema.sql)
  async rpc(fnName, params) {
    const { data, error } = await supabase.rpc(fnName, params || {});
    if (error) throw new Error(error.message);
    return data;
  },

  auth: {
    async isAuthenticated() {
      const { data } = await supabase.auth.getSession();
      return !!data?.session;
    },
    async me() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session?.user) return null;
      const { data: profile, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (error) return null;
      return profile || null;
    },
    async logout() {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
      try { localStorage.removeItem('mirt_auth_session'); } catch { /* ignore */ }
    },
    redirectToLogin() {
      window.location.assign('/login');
    },
    setToken() { /* no-op: the Supabase client manages its own session */ },
    loginWithProvider() {
      throw new Error('SSO login is not configured for this deployment.');
    },
    register() {
      throw new Error('Public registration is disabled. Accounts are created by administrators.');
    },
    verifyOtp() {
      throw new Error('Public registration is disabled. Accounts are created by administrators.');
    },
    resendOtp() {
      throw new Error('Public registration is disabled. Accounts are created by administrators.');
    },
    async resetPasswordRequest(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
      return true;
    },
    async resetPassword({ resetToken, newPassword }) {
      const first = await supabase.auth.verifyOtp({ token_hash: resetToken, type: 'recovery' });
      if (first.error) {
        const second = await supabase.auth.verifyOtp({ token: resetToken, type: 'recovery' });
        if (second.error) throw new Error(second.error.message);
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      return true;
    },
  },

  integrations: {
    Core: {
      // Base44 sent status-change emails from the platform. Supabase has no
      // built-in email provider, so this is a safe no-op (see README to wire
      // up an email provider such as Resend via a Supabase Edge Function).
      async SendEmail(payload) {
        console.info('[SendEmail] skipped — email delivery is not configured:', payload?.to, payload?.subject);
        return { queued: false, skipped: true };
      },
      async UploadFile() {
        return { file_url: '' };
      },
    },
  },
};

export { db };
export const base44 = db; // backwards-compatible alias
export default db;