import { useState, useEffect } from 'react';
import {
  Users,
  Filter,
  Search,
  MessageSquare,
  PhoneCall,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  FileText,
  Building2,
  Wrench,
  Award,
  BookOpen,
  Briefcase,
  Headphones,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Lead {
  id: string;
  ctaType: string;
  sourceCategory: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CLOSED';
  metadata: any;
  notes: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { key: 'ALL', label: 'All Leads', icon: Users },
  { key: 'WHATSAPP', label: 'WhatsApp Leads', icon: MessageSquare },
  { key: 'COURSE', label: 'Course Leads', icon: BookOpen },
  { key: 'INTERNSHIP', label: 'Internship Leads', icon: Briefcase },
  { key: 'CERTIFICATION', label: 'Certification Leads', icon: Award },
  { key: 'TOOL', label: 'AI Tools Leads', icon: Wrench },
  { key: 'JOB_SUPPORT', label: 'Job Support Leads', icon: Headphones },
  { key: 'CORPORATE', label: 'Corporate Leads', icon: Building2 },
  { key: 'AI_COORDINATOR', label: 'AI Coordinator Leads', icon: PhoneCall },
];

export default function LeadManagerDashboard() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [countsMap, setCountsMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Lead Details Modal state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editStatus, setEditStatus] = useState<string>('NEW');
  const [editNotes, setEditNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [activeCategory, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (activeCategory !== 'ALL') params.append('ctaType', activeCategory);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        setCountsMap(data.countsMap || {});
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string, notes?: string) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: data.lead.status, notes: data.lead.notes } : l))
        );
        if (selectedLead?.id === leadId) {
          setSelectedLead(data.lead);
        }
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold font-display text-white">Lead Manager Dashboard</h1>
          <p className="text-xs text-text-muted mt-1">
            Track and manage leads generated across all CTA types (WhatsApp, Contact Form, AI Coordinator, etc.).
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2 text-xs font-bold text-white hover:bg-white/[0.12] transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Main Grid: Left Category Menu + Right Lead Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Category Menu Panel */}
        <div className="lg:col-span-3 rounded-2xl border border-white/[0.08] bg-bg-card p-3 space-y-1">
          <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider px-3 py-1.5 block">
            Lead Categories
          </span>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = cat.key === 'ALL' ? Object.values(countsMap).reduce((a, b) => a + b, 0) : countsMap[cat.key] || 0;
            const isSelected = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                  isSelected
                    ? 'bg-gradient-to-r from-[#D4AF37]/20 to-brand-orange/15 text-amber-300 border border-[#D4AF37]/30 shadow-md'
                    : 'text-text-muted hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className={isSelected ? 'text-[#D4AF37]' : 'text-text-muted'} />
                  <span>{cat.label}</span>
                </div>
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                    isSelected ? 'bg-[#D4AF37] text-black' : 'bg-white/[0.06] text-text-muted'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Lead Management Workspace */}
        <div className="lg:col-span-9 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-bg-card p-3">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name, email, or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
                className="w-full rounded-xl border border-white/[0.08] bg-bg-surface pl-9 pr-3 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={14} className="text-[#D4AF37] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-bg-surface px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Lead Cards List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-bg-card border border-white/[0.06]" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-12 text-center text-text-muted">
              <Users size={32} className="mx-auto mb-2 text-text-muted opacity-50" />
              <p className="text-sm font-semibold">No leads found in this category.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="group rounded-2xl border border-white/[0.08] bg-bg-card p-4 transition-all hover:border-[#D4AF37]/40 hover:bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                        {lead.fullName}
                      </span>
                      <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/20">
                        {lead.ctaType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span>✉️ {lead.email}</span>
                      {lead.phone && <span>📞 {lead.phone}</span>}
                      <span>📅 {new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Status Select */}
                    <select
                      value={lead.status}
                      onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                      className={clsx(
                        'rounded-xl border px-3 py-1.5 text-xs font-bold focus:outline-none transition-colors',
                        lead.status === 'NEW'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          : lead.status === 'CONTACTED'
                            ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                            : lead.status === 'IN_PROGRESS'
                              ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      )}
                    >
                      <option value="NEW" className="bg-bg-surface text-white">NEW</option>
                      <option value="CONTACTED" className="bg-bg-surface text-white">CONTACTED</option>
                      <option value="IN_PROGRESS" className="bg-bg-surface text-white">IN PROGRESS</option>
                      <option value="CLOSED" className="bg-bg-surface text-white">CLOSED</option>
                    </select>

                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setEditStatus(lead.status);
                        setEditNotes(lead.notes || '');
                      }}
                      className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white hover:bg-white/[0.1] transition-colors"
                    >
                      Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── LEAD DETAILS MODAL ─── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.12] bg-bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">{selectedLead.ctaType} LEAD DETAILS</span>
                <h3 className="text-lg font-bold text-white">{selectedLead.fullName}</h3>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-bg-card p-3 rounded-xl border border-white/[0.06]">
                <div>
                  <span className="text-text-muted block">Email Address</span>
                  <span className="font-bold text-white">{selectedLead.email}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Phone Number</span>
                  <span className="font-bold text-white">{selectedLead.phone || 'N/A'}</span>
                </div>
                <div className="mt-2">
                  <span className="text-text-muted block">Source Category</span>
                  <span className="font-bold text-amber-300">{selectedLead.sourceCategory || 'General'}</span>
                </div>
                <div className="mt-2">
                  <span className="text-text-muted block">Created Date</span>
                  <span className="font-bold text-white">{new Date(selectedLead.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="font-bold text-white block mb-1">Update Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              {/* Notes Editor */}
              <div>
                <label className="font-bold text-white block mb-1">Lead Notes & Activity</label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add status notes or follow-up logs…"
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-xl border border-white/[0.1] px-4 py-2 text-xs font-semibold text-text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={updating}
                onClick={async () => {
                  await handleUpdateStatus(selectedLead.id, editStatus, editNotes);
                  setSelectedLead(null);
                }}
                className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-brand-orange px-5 py-2 text-xs font-black text-black shadow-md hover:opacity-90"
              >
                {updating ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
