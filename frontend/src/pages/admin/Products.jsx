import React, { useEffect, useState, useCallback } from 'react';
import { productAPI } from '../../api';
import { formatCurrency, getStockStatus, debounce } from '../../utils/helpers';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package, Filter, RefreshCw, TrendingDown } from 'lucide-react';

const UNITS = ['pcs', 'meter', 'kg', 'liter', 'yard', 'roll'];
const EMPTY_FORM = { name: '', sku: '', barcode: '', category: '', supplier: '', description: '', costPrice: '', sellingPrice: '', discountPercent: 0, taxPercent: 0, stock: 0, minStock: 5, unit: 'pcs', fabric: '', color: '', size: '', isActive: true };

const ProductForm = ({ form, setForm, categories, suppliers, onSubmit, loading, isEdit }) => (
  <form id="product-form" onSubmit={onSubmit}>
    <div className="grid-2">
      <div className="form-group">
        <label className="form-label">Product Name *</label>
        <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Premium Cotton Fabric" />
      </div>
      <div className="form-group">
        <label className="form-label">SKU</label>
        <input className="form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. COT-001" />
      </div>
    </div>
    <div className="grid-2">
      <div className="form-group">
        <label className="form-label">Barcode</label>
        <input className="form-input" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="Scan or enter barcode" />
      </div>
      <div className="form-group">
        <label className="form-label">Unit</label>
        <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
    </div>
    <div className="grid-2">
      <div className="form-group">
        <label className="form-label">Category</label>
        <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          <option value="">Select Category</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Supplier</label>
        <select className="form-select" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
          <option value="">Select Supplier</option>
          {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>
    </div>
    <div className="grid-3">
      <div className="form-group">
        <label className="form-label">Cost Price (₹) *</label>
        <input type="number" className="form-input" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} required min="0" step="0.01" />
      </div>
      <div className="form-group">
        <label className="form-label">Selling Price (₹) *</label>
        <input type="number" className="form-input" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} required min="0" step="0.01" />
      </div>
      <div className="form-group">
        <label className="form-label">Discount (%)</label>
        <input type="number" className="form-input" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })} min="0" max="100" />
      </div>
    </div>
    <div className="grid-3">
      <div className="form-group">
        <label className="form-label">Tax (%)</label>
        <input type="number" className="form-input" value={form.taxPercent} onChange={e => setForm({ ...form, taxPercent: e.target.value })} min="0" max="100" />
      </div>
      <div className="form-group">
        <label className="form-label">Current Stock</label>
        <input type="number" className="form-input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} min="0" />
      </div>
      <div className="form-group">
        <label className="form-label">Min Stock Alert</label>
        <input type="number" className="form-input" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} min="0" />
      </div>
    </div>
    <div className="grid-3">
      <div className="form-group">
        <label className="form-label">Fabric Type</label>
        <input className="form-input" value={form.fabric} onChange={e => setForm({ ...form, fabric: e.target.value })} placeholder="Cotton, Silk..." />
      </div>
      <div className="form-group">
        <label className="form-label">Color</label>
        <input className="form-input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="White, Red..." />
      </div>
      <div className="form-group">
        <label className="form-label">Size/Variant</label>
        <input className="form-input" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="S/M/L or Free Size" />
      </div>
    </div>
    <div className="form-group">
      <label className="form-label">Description</label>
      <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Product description..." />
    </div>
    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16 }} />
      <label htmlFor="isActive" style={{ fontSize: 13.5, cursor: 'pointer', color: 'var(--text-secondary)' }}>Product is Active</label>
    </div>
  </form>
);

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [modal, setModal] = useState({ open: false, type: null, product: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stockAdj, setStockAdj] = useState({ adjustment: 0, reason: '' });
  const LIMIT = 15;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (filterCat) params.category = filterCat;
      if (filterLowStock) params.lowStock = true;
      const res = await productAPI.getAll(params);
      setProducts(res.data.data);
      setTotal(res.data.total);
    } catch (e) { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, filterCat, filterLowStock, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    Promise.all([
      productAPI.getCategories(),
      import('../../api').then(m => m.supplierAPI.getAll()),
    ]).then(([catRes, supRes]) => {
      setCategories(catRes.data.data);
      setSuppliers(supRes.data.data);
    });
  }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, type: 'create', product: null }); };
  const openEdit = (p) => {
    setForm({ ...p, category: p.category?._id || '', supplier: p.supplier?._id || '' });
    setModal({ open: true, type: 'edit', product: p });
  };
  const openStock = (p) => { setStockAdj({ adjustment: 0, reason: '' }); setModal({ open: true, type: 'stock', product: p }); };
  const closeModal = () => setModal({ open: false, type: null, product: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === 'create') {
        await productAPI.create(form);
        toast.success('Product created!');
      } else {
        await productAPI.update(modal.product._id, form);
        toast.success('Product updated!');
      }
      closeModal();
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      loadProducts();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const handleStockAdjust = async () => {
    if (!stockAdj.adjustment) return toast.error('Enter adjustment amount');
    setSaving(true);
    try {
      await productAPI.adjustStock(modal.product._id, stockAdj);
      toast.success('Stock updated!');
      closeModal();
      loadProducts();
    } catch (e) { toast.error('Failed to update stock'); }
    finally { setSaving(false); }
  };

  const debouncedSearch = useCallback(debounce(v => { setSearch(v); setPage(1); }, 400), []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{total} products in inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="add-product-btn">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar" style={{ minWidth: 280 }}>
          <Search size={15} color="var(--text-muted)" />
          <input placeholder="Search by name, SKU, barcode..." onChange={e => debouncedSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button
          className={`btn ${filterLowStock ? 'btn-warning' : 'btn-secondary'}`}
          onClick={() => { setFilterLowStock(!filterLowStock); setPage(1); }}
        >
          <TrendingDown size={14} /> Low Stock
        </button>
        <button className="btn btn-ghost" onClick={() => { setSearch(''); setFilterCat(''); setFilterLowStock(false); setPage(1); }}>
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? <PageLoader /> : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <div className="empty-state-title">No products found</div>
                    </div>
                  </td></tr>
                )}
                {products.map(p => {
                  const stockStatus = getStockStatus(p.stock, p.minStock);
                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.name}</div>
                        {p.fabric && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.fabric} {p.color ? `• ${p.color}` : ''}</div>}
                      </td>
                      <td><span className="chip">{p.category?.name || '—'}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku || '—'}</td>
                      <td style={{ fontWeight: 600 }}>
                        {formatCurrency(p.sellingPrice)}
                        {p.discountPercent > 0 && <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 4 }}>-{p.discountPercent}%</span>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.stock} {p.unit}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>min: {p.minStock}</div>
                      </td>
                      <td><span className={`badge ${stockStatus.class}`}>{stockStatus.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => openStock(p)} title="Adjust Stock" data-tooltip="Adjust Stock">
                            <Package size={15} />
                          </button>
                          <button className="btn btn-ghost btn-icon" onClick={() => openEdit(p)} title="Edit">
                            <Edit2 size={15} />
                          </button>
                          <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(p._id)} title="Delete" style={{ color: 'var(--danger)' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.ceil(total / LIMIT) }, (_, i) => i + 1).map(n => (
              <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}>›</button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modal.open && ['create', 'edit'].includes(modal.type)}
        onClose={closeModal}
        title={modal.type === 'edit' ? 'Edit Product' : 'Add New Product'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} form="product-form" type="submit">
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {modal.type === 'edit' ? 'Update Product' : 'Create Product'}
            </button>
          </>
        }
      >
        <ProductForm form={form} setForm={setForm} categories={categories} suppliers={suppliers} onSubmit={handleSubmit} loading={saving} isEdit={modal.type === 'edit'} />
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal
        isOpen={modal.open && modal.type === 'stock'}
        onClose={closeModal}
        title="Adjust Stock"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleStockAdjust} disabled={saving}>Update Stock</button>
          </>
        }
      >
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            Current stock: <strong style={{ color: 'var(--text-primary)' }}>{modal.product?.stock} {modal.product?.unit}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">Adjustment (+ to add, - to deduct)</label>
            <input type="number" className="form-input" value={stockAdj.adjustment} onChange={e => setStockAdj({ ...stockAdj, adjustment: parseInt(e.target.value) || 0 })} placeholder="e.g. 50 or -10" />
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <input className="form-input" value={stockAdj.reason} onChange={e => setStockAdj({ ...stockAdj, reason: e.target.value })} placeholder="Restocking, damage, etc." />
          </div>
          {stockAdj.adjustment !== 0 && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13 }}>
              New stock will be: <strong style={{ color: 'var(--primary-light)' }}>{Math.max(0, (modal.product?.stock || 0) + stockAdj.adjustment)} {modal.product?.unit}</strong>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Products;
