import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';
import { adminMenuAPI } from '../../services/api';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
}

const MenuEditor = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', href: '' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await adminMenuAPI.getAll();
      if (res.data.success) setItems(res.data.items);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.label.trim() || !newItem.href.trim()) return;
    setSaving(true);
    try {
      await adminMenuAPI.create({ ...newItem, sortOrder: items.length });
      setNewItem({ label: '', href: '' });
      await fetchItems();
    } catch (err) {
      console.error('Failed to create menu item:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: MenuItem) => {
    try {
      await adminMenuAPI.update(item.id, { isActive: !item.isActive });
      await fetchItems();
    } catch (err) {
      console.error('Failed to toggle menu item:', err);
    }
  };

  // Swap sortOrder with the neighbour in the given direction.
  const move = async (index: number, direction: -1 | 1) => {
    const target = items[index + direction];
    if (!target) return;
    const current = items[index];
    try {
      await Promise.all([
        adminMenuAPI.update(current.id, { sortOrder: target.sortOrder }),
        adminMenuAPI.update(target.id, { sortOrder: current.sortOrder }),
      ]);
      await fetchItems();
    } catch (err) {
      console.error('Failed to reorder menu items:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminMenuAPI.remove(id);
      await fetchItems();
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Menu Editor</h2>
        <p className="mt-1 text-sm text-text-muted">
          Controls the public navigation bar. Hidden items stay in the list but disappear from the site.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-bg-surface p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-text-muted">Label</label>
          <input
            value={newItem.label}
            onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
            placeholder="Courses"
            className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-text-muted">Link</label>
          <input
            value={newItem.href}
            onChange={(e) => setNewItem({ ...newItem, href: e.target.value })}
            placeholder="/courses"
            className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          <Plus size={16} />
          Add Item
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-bg-surface">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse bg-bg-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">
            No menu items yet. The public nav will fall back to its built-in links.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-line-subtle last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="rounded p-1 text-text-muted transition-colors hover:bg-elevate hover:text-strong disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        className="rounded p-1 text-text-muted transition-colors hover:bg-elevate hover:text-strong disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-strong">{item.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{item.href}</td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        item.isActive ? 'bg-green-500/10 text-green-400' : 'bg-elevate text-text-muted'
                      )}
                    >
                      {item.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleActive(item)}
                        title={item.isActive ? 'Hide from nav' : 'Show in nav'}
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                      >
                        {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MenuEditor;
