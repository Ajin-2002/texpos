import React, { useEffect, useState, useCallback } from 'react';
import { supplierAPI } from '../../api';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Truck, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const EMPTY = { name: '', contactPerson: '', email: '', phone: '', address: '', gstNumber: '', balance: 0 };

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, type: null, supplier: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [balModal, setBalModal] = useState({ open: false, supplier: null });
  const [balAdj, setBalAdj] = useState({ amount: 0, type: 'add', note: '' });

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierAPI.getAll({ search });
      setSuppliers(res.data.data);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const openCreate = () => { setForm(EMPTY); setModal({ open: true, type: 'create', supplier: null }); };
  const openEdit = (s) => { setForm(s); setModal({ open: true, type: 'edit', supplier: s }); };
  const closeModal = () => setModal({ open: false, type: null, supplier: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === 'create') { await supplierAPI.create(form); toast.success('Supplier added!'); }
      else { await supplierAPI.update(modal.supplier._id, form); toast.success('Supplier updated!'); }
      closeModal(); loadSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try { await supplierAPI.delete(id); toast.success('Supplier deleted'); loadSuppliers(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleBalanceUpdate = async () => {
    try {
      await supplierAPI.updateBalance(balModal.supplier._id, balAdj);
      toast.success('Balance updated!');
      setBalModal({ open: false, supplier: null });
      loadSuppliers();
    } catch { toast.error('Failed to update balance'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{suppliers.length} suppliers registered</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="add-supplier-btn">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={15} color="var(--text-muted)" />
          <input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>GST Number</th>
                  <th>Balance (₹)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 && (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <Truck size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                      <div className="empty-state-title">No suppliers found</div>
                    </div>
                  </td></tr>
                )}
                {suppliers.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</div>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.contactPerson || '—'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{s.phone}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.gstNumber || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: s.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {formatCurrency(Math.abs(s.balance))}
                        <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
                          {s.balance > 0 ? 'We owe' : s.balance < 0 ? 'They owe' : 'Settled'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => { setBalAdj({ amount: 0, type: 'add', note: '' }); setBalModal({ open: true, supplier: s }); }} title="Update Balance">
                          <DollarSign size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(s)}><Edit2 size={15} /></button>
                        <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(s._id)} style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.open} onClose={closeModal} title={modal.type === 'edit' ? 'Edit Supplier' : 'Add Supplier'} size="md"
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} form="supplier-form" type="submit">
            {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
            {modal.type === 'edit' ? 'Update' : 'Add Supplier'}
          </button>
        </>}
      >
        <form id="supplier-form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Supplier company name" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="Manager name" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="Phone number" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="supplier@email.com" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input className="form-input" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} placeholder="15-digit GST" />
            </div>
            <div className="form-group">
              <label className="form-label">Opening Balance (₹)</label>
              <input type="number" className="form-input" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="City, State..." style={{ minHeight: 60 }} />
          </div>
        </form>
      </Modal>

      {/* Balance Update Modal */}
      <Modal isOpen={balModal.open} onClose={() => setBalModal({ open: false, supplier: null })} title="Update Supplier Balance" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setBalModal({ open: false, supplier: null })}>Cancel</button>
          <button className="btn btn-primary" onClick={handleBalanceUpdate}>Update Balance</button>
        </>}
      >
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            Current balance: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(Math.abs(balModal.supplier?.balance || 0))}</strong>
            &nbsp;({balModal.supplier?.balance >= 0 ? 'We owe them' : 'They owe us'})
          </p>
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <select className="form-select" value={balAdj.type} onChange={e => setBalAdj({ ...balAdj, type: e.target.value })}>
              <option value="add">Payment Made (Add to balance)</option>
              <option value="subtract">Payment Received (Subtract)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input type="number" className="form-input" value={balAdj.amount} onChange={e => setBalAdj({ ...balAdj, amount: parseFloat(e.target.value) || 0 })} min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <input className="form-input" value={balAdj.note} onChange={e => setBalAdj({ ...balAdj, note: e.target.value })} placeholder="Transaction note" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Suppliers;
