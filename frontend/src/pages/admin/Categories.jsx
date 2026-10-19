import React, { useEffect, useState } from 'react';
import { productAPI } from '../../api';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState({ open: false, type: null, cat: null });
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const loadCats = async () => {
    const res = await productAPI.getCategories();
    setCategories(res.data.data);
  };

  useEffect(() => { loadCats(); }, []);

  const openCreate = () => { setForm({ name: '', description: '' }); setModal({ open: true, type: 'create', cat: null }); };
  const openEdit = (c) => { setForm(c); setModal({ open: true, type: 'edit', cat: c }); };
  const closeModal = () => setModal({ open: false, type: null, cat: null });

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.type === 'create') { await productAPI.createCategory(form); toast.success('Category created!'); }
      else { await productAPI.updateCategory(modal.cat._id, form); toast.success('Category updated!'); }
      closeModal(); loadCats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await productAPI.deleteCategory(id); toast.success('Category deleted'); loadCats(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{categories.length} product categories</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="add-category-btn">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid-3">
        {categories.map(c => (
          <div key={c._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tag size={18} color="var(--primary-light)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                {c.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.description}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-icon" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
              <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(c._id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.type === 'edit' ? 'Edit Category' : 'Add Category'} size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} form="cat-form" type="submit">
            {modal.type === 'edit' ? 'Update' : 'Create'}
          </button>
        </>}
      >
        <form id="cat-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Cotton Fabric" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." style={{ minHeight: 80 }} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
