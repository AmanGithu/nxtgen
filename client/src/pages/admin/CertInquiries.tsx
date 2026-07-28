import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../../services/api';

const CertInquiries = () => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

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
    <div className="space-y-6 p-6 text-white">
      <div>
        <h1 className="font-display text-2xl font-bold">Certification Inquiries & Lead Submissions</h1>
        <p className="text-xs text-text-muted">Manage candidate inquiries submitted from certification "Contact Us" CTA popups.</p>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-bg-surface overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.08] bg-bg-card text-xs uppercase text-text-muted">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Certification</th>
              <th className="px-6 py-3">Candidate</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Status Badge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.08]">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">Loading inquiries...</td></tr>
            ) : inquiries.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">No certification inquiries submitted yet.</td></tr>
            ) : (
              inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-xs text-text-muted">{new Date(inq.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-semibold text-brand-orange">{inq.certificationName}</td>
                  <td className="px-6 py-4 font-medium text-white">{inq.userName}</td>
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
