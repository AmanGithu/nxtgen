import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';

const CertInquiries = () => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const deleteInquiry = async (item: any) => {
    try {
      await api.delete(`/admin/cert-inquiries/${item.id}`);
      setPendingDelete(null);
      await fetchInquiries();
    } catch (err) {
      console.error('Failed to delete enquiry:', err);
    }
  };

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/cert-inquiries');
      if (res.data.success) setInquiries(res.data.inquiries);
    } catch (err) {
      console.error('Failed to fetch cert inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/cert-inquiries/${id}/status`, { status: newStatus });
      fetchInquiries();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-6 p-6 text-strong">
      {pendingDelete && (
        <ConfirmDialog
          title="Dismiss this enquiry?"
          message={`The enquiry from ${pendingDelete.userName || pendingDelete.userEmail || 'this person'} will be removed from the list.`}
          confirmLabel="Dismiss"
          onConfirm={() => deleteInquiry(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      <div>
        <h1 className="font-display text-2xl font-bold">Certification Inquiries & Lead Submissions</h1>
        <p className="text-xs text-text-muted">Manage candidate inquiries submitted from certification "Contact Us" CTA popups.</p>
      </div>

      <div className="rounded-xl border border-line bg-bg-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-bg-card text-xs uppercase text-text-muted">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Certification</th>
              <th className="px-6 py-3">Candidate</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Status Badge</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-text-muted">Loading inquiries...</td></tr>
            ) : inquiries.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-text-muted">No certification inquiries submitted yet.</td></tr>
            ) : (
              inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-elevate">
                  <td className="px-6 py-4 text-xs text-text-muted">{new Date(inq.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-semibold text-brand-orange">{inq.certificationName}</td>
                  <td className="px-6 py-4 font-medium text-strong">{inq.userName}</td>
                  <td className="px-6 py-4 text-xs text-text-muted">{inq.userEmail}<br />{inq.userPhone}</td>
                  <td className="px-6 py-4">
                    <select
                      value={inq.status}
                      onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                      className={`rounded px-2.5 py-1 text-xs font-bold ${
                        inq.status === 'NEW' ? 'bg-brand-orange/20 text-brand-orange' :
                        inq.status === 'CONTACTED' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setPendingDelete(inq)}
                        title="Dismiss this enquiry"
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CertInquiries;
