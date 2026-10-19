import React, { useEffect, useState } from 'react';
import { staffAPI } from '../../api';
import Modal from '../../components/common/Modal';
import Avatar from '../../components/common/Avatar';
import { PageLoader } from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

const EMPTY = { name: '', email: '', password: '', phone: '', address: '', salary: '' };

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: null, staff: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await staffAPI.getAll();
      setStaff(res.data.data);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStaff(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal({ open: true, type: 'create', staff: null }); };
  const openEdit = (s) => { setForm({ ...s, password: '' }); setModal({ open: true, type: 'edit', staff: s }); };
  const closeModal = () => setModal({ open: false, type: null, staff: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === 'create') {
        await staffAPI.create(form);
        toast.success('Staff member added!');
      } else {
        const update = { ...form };
        if (!update.password) delete update.password;
        await staffAPI.update(modal.staff._id, update);
        toast.success('Staff updated!');
      }
      closeModal();
      loadStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await staffAPI.toggle(id);
      toast.success(currentStatus ? 'Staff deactivated' : 'Staff activated');
      loadStaff();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this staff member?')) return;
    try {
      await staffAPI.delete(id);
      toast.success('Staff deleted');
      loadStaff();
    } catch { toast.error('Failed to delete'); }
  };

  const activeCount = staff.filter(s => s.isActive).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">{activeCount} active · {staff.length} total members</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="add-staff-btn">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Staff Cards */}
      {loading ? <PageLoader /> : (
        <div className="grid-3">
          {staff.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state">
                <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div className="empty-state-title">No staff members yet</div>
                <p className="empty-state-subtitle">Add your first staff member to get started</p>
              </div>
            </div>
          )}
          {staff.map(s => (
            <div key={s._id} className="card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 14, right: 14 }}>
                <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar name={s.name} size={48} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {s.phone && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>📱 {s.phone}</div>}
                {s.salary && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>💰 Salary: {formatCurrency(s.salary)}/mo</div>}
                {s.joinDate && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 Joined {formatDate(s.joinDate)}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(s)}>
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  className={`btn btn-sm ${s.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleToggle(s._id, s.isActive)}
                  title={s.isActive ? 'Deactivate' : 'Activate'}
                >
                  {s.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        onClose={closeModal}
        title={modal.type === 'edit' ? 'Edit Staff Member' : 'Add Staff Member'}
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} form="staff-form" type="submit">
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {modal.type === 'edit' ? 'Update' : 'Add Staff'}
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Staff full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="email@example.com" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{modal.type === 'edit' ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={modal.type === 'create'} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Monthly Salary (₹)</label>
              <input type="number" className="form-input" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="25000" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="City, State" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Staff;
