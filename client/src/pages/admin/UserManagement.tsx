import { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Shield, Mail, CheckCircle2, X } from 'lucide-react';
import api from '../../services/api';

interface UserItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'ADMIN' | 'STUDENT' | 'SITE_USER';
  status: string;
  createdAt: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT' as 'ADMIN' | 'STUDENT' | 'SITE_USER',
  });
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { search: search || undefined, role: roleFilter || undefined, page, limit: 10 }
      });
      if (res.data.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/users/invite', inviteForm);
      if (res.data.success) {
        setInviteSuccess(`Password set link sent via Resend to ${inviteForm.email}`);
        setTimeout(() => {
          setInviteSuccess('');
          setIsInviteOpen(false);
          setInviteForm({ email: '', firstName: '', lastName: '', role: 'STUDENT' });
          fetchUsers();
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to invite user:', err);
    }
  };

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">User Directory & Provisioning</h1>
          <p className="text-xs text-text-muted">Manage system users, role permissions, and send email invite tokens.</p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90"
        >
          <UserPlus size={16} />
          ➕ Invite User via Resend Link
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/[0.08] bg-bg-surface p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-bg-card pl-10 pr-4 py-2 text-sm text-white focus:border-brand-orange focus:outline-hidden"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-bg-card px-4 py-2 text-sm text-white focus:border-brand-orange focus:outline-hidden"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="STUDENT">STUDENT</option>
          <option value="SITE_USER">SITE_USER</option>
        </select>
      </div>

      {/* Users Data Table */}
      <div className="rounded-xl border border-white/[0.08] bg-bg-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.08] bg-bg-card text-xs uppercase text-text-muted">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.08]">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-semibold text-white">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-6 py-4 text-text-muted">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded bg-bg-card border border-white/[0.08] px-2 py-1 text-xs text-brand-orange font-bold focus:outline-hidden"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="STUDENT">STUDENT</option>
                      <option value="SITE_USER">SITE_USER</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-text-muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── INVITE USER MODAL ─── */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-display text-lg font-bold text-white">Invite User (Resend Email)</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-text-muted hover:text-white"><X size={20} /></button>
            </div>

            {inviteSuccess ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-brand-orange" />
                <p className="mt-2 text-sm font-semibold text-white">{inviteSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted">First Name</label>
                  <input
                    type="text" required placeholder="Alex" value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Last Name</label>
                  <input
                    type="text" placeholder="Sterling" value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Email Address</label>
                  <input
                    type="email" required placeholder="alex@example.com" value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Assigned Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2 text-sm text-white focus:border-brand-orange"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SITE_USER">SITE_USER</option>
                  </select>
                </div>

                <button type="submit" className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white hover:bg-brand-orange/90">
                  Send 24-hr Password Set Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
