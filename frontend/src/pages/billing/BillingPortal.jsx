import React, { useEffect, useState, useCallback, useRef } from 'react';
import { productAPI, transactionAPI, customerAPI } from '../../api';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { formatCurrency, debounce } from '../../utils/helpers';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import BillPrint from './BillPrint';
import { Toaster } from 'react-hot-toast';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, User, CreditCard,
  Banknote, Smartphone, LogOut, X, Percent, Package, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BillingPortal = () => {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const cart = useCartStore();

  // Products
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('');
  const [search, setSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Customer
  const [customers, setCustomers] = useState([]);
  const [custSearch, setCustSearch] = useState('');
  const [showCustDrop, setShowCustDrop] = useState(false);

  // Payment
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [processing, setProcessing] = useState(false);
  const [discountInput, setDiscountInput] = useState('');

  // Bill Print
  const [billModal, setBillModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  // New Customer Modal
  const [newCustModal, setNewCustModal] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '' });

  const searchRef = useRef(null);

  useEffect(() => {
    productAPI.getCategories().then(r => setCategories(r.data.data));
    loadProducts();
  }, []);

  const loadProducts = useCallback(async (s = '', cat = '') => {
    setLoadingProducts(true);
    try {
      const params = { limit: 50, isActive: true };
      if (s) params.search = s;
      if (cat) params.category = cat;
      const res = await productAPI.getAll(params);
      setProducts(res.data.data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoadingProducts(false); }
  }, []);

  const debouncedSearch = useCallback(debounce((s, cat) => loadProducts(s, cat), 350), [loadProducts]);

  const handleSearchChange = (v) => { setSearch(v); debouncedSearch(v, activeCat); };
  const handleCatChange = (cat) => { setActiveCat(cat); loadProducts(search, cat); };

  const handleAddToCart = (product) => {
    const result = cart.addItem(product);
    if (result && !result.success) toast.error(result.message);
    else {
      toast.success(`${product.name} added`, { duration: 1000, style: { fontSize: 12 } });
    }
  };

  // Customer search
  const searchCustomers = useCallback(debounce(async (s) => {
    if (!s) { setCustomers([]); return; }
    const res = await customerAPI.getAll({ search: s });
    setCustomers(res.data.data);
  }, 400), []);

  const handleCustSearchChange = (v) => { setCustSearch(v); searchCustomers(v); setShowCustDrop(true); };

  const selectCustomer = (c) => {
    cart.setCustomer(c);
    setCustSearch(c.name);
    setShowCustDrop(false);
  };

  const clearCustomer = () => {
    cart.setCustomer(null);
    setCustSearch('');
    setCustomers([]);
  };

  const addNewCustomer = async () => {
    try {
      const res = await customerAPI.create(newCust);
      selectCustomer(res.data.data);
      setNewCustModal(false);
      setNewCust({ name: '', phone: '', email: '' });
      toast.success('Customer added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add customer'); }
  };

  const handleDiscount = (v) => {
    setDiscountInput(v);
    cart.setDiscount(parseFloat(v) || 0);
  };

  const openPayment = () => {
    if (!cart.items.length) return toast.error('Cart is empty');
    setAmountPaid('');
    setPayModal(true);
  };

  const processPayment = async () => {
    const total = cart.getTotal();
    const paid = parseFloat(amountPaid) || 0;
    if (payMethod === 'cash' && paid < total) return toast.error(`Insufficient amount. Need ₹${total.toFixed(2)}`);

    setProcessing(true);
    try {
      const payload = {
        items: cart.items.map(i => ({
          product: i.product,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
          taxPercent: i.taxPercent,
        })),
        customer: cart.customer?._id,
        customerName: cart.customer?.name || 'Walk-in Customer',
        customerPhone: cart.customer?.phone || '',
        paymentMethod: payMethod,
        paymentDetails: { cash: payMethod === 'cash' ? paid : 0, card: payMethod === 'card' ? total : 0, upi: payMethod === 'upi' ? total : 0 },
        amountPaid: paid || total,
        discountAmount: cart.discount,
      };

      const res = await transactionAPI.create(payload);
      setLastTransaction(res.data.data);
      cart.clear();
      cart.setDiscount(0);
      setDiscountInput('');
      setPayModal(false);
      setBillModal(true);
      toast.success(`Sale complete! Invoice ${res.data.data.invoiceNumber}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    } finally { setProcessing(false); }
  };

  const subtotal = cart.getSubtotal();
  const tax = cart.getTaxAmount();
  const discount = cart.discount;
  const total = cart.getTotal();
  const itemCount = cart.getItemCount();
  const change = parseFloat(amountPaid) - total;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: 'var(--border-bright)', fontSize: '13px' } }} />

      {/* Top Bar */}
      <div style={{ background: 'var(--bg-elevated)', borderBottom: 'var(--border)', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🧵</div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, background: 'linear-gradient(135deg, var(--primary-light), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TexPOS Billing</span>
          </div>
          {isAdmin() && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/dashboard')} style={{ fontSize: 12 }}>
              <ArrowLeft size={13} /> Admin Panel
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>👤 {user?.name}</span>
          <button className="btn btn-ghost btn-icon" onClick={() => { logout(); navigate('/login'); }} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Main Billing Layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 370px', overflow: 'hidden' }}>
        {/* LEFT — Products */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>
          {/* Search + Category Filter */}
          <div style={{ padding: '12px 16px', borderBottom: 'var(--border)', background: 'var(--bg-elevated)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <Search size={15} color="var(--text-muted)" />
              <input ref={searchRef} placeholder="Search product, SKU, barcode..." value={search} onChange={e => handleSearchChange(e.target.value)} />
              {search && <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => handleSearchChange('')}><X size={13} /></button>}
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: 'var(--border)', overflowX: 'auto', background: 'var(--bg-elevated)', flexShrink: 0 }}>
            <button
              className={`btn btn-sm ${!activeCat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleCatChange('')}
              style={{ flexShrink: 0 }}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c._id}
                className={`btn btn-sm ${activeCat === c._id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleCatChange(c._id)}
                style={{ flexShrink: 0 }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {loadingProducts ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state" style={{ paddingTop: 60 }}>
                <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div className="empty-state-title">No products found</div>
                <div className="empty-state-subtitle">Try a different search or category</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
                {products.map(p => {
                  const inCart = cart.items.find(i => i.product === p._id);
                  const finalPrice = p.sellingPrice * (1 - (p.discountPercent || 0) / 100);
                  return (
                    <div
                      key={p._id}
                      className={`product-card ${p.stock <= 0 ? 'out-of-stock' : ''}`}
                      onClick={() => p.stock > 0 && handleAddToCart(p)}
                      style={{
                        border: inCart ? '1px solid var(--primary)' : undefined,
                        background: inCart ? 'rgba(99,102,241,0.08)' : undefined,
                      }}
                    >
                      {/* Stock badge */}
                      {p.stock <= p.minStock && p.stock > 0 && (
                        <div style={{ position: 'absolute', top: 6, right: 6 }}>
                          <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 6px' }}>Low</span>
                        </div>
                      )}
                      {inCart && (
                        <div style={{ position: 'absolute', top: 6, left: 6, width: 20, height: 20, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                          {inCart.quantity}
                        </div>
                      )}
                      <div style={{ marginBottom: 6 }}>
                        {p.category && <div style={{ fontSize: 10, color: 'var(--primary-light)', marginBottom: 3, fontWeight: 600 }}>{typeof p.category === 'object' ? p.category.name : ''}</div>}
                        <div className="product-card-name">{p.name}</div>
                        <div className="product-card-sku">{p.sku || p.barcode || ''}</div>
                        {p.fabric && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.fabric} {p.color ? `• ${p.color}` : ''}</div>}
                      </div>
                      <div className="product-card-price">
                        {formatCurrency(finalPrice)}<span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>/{p.unit}</span>
                      </div>
                      {p.discountPercent > 0 && <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 2 }}>-{p.discountPercent}% off</div>}
                      <div className="product-card-stock">
                        {p.stock <= 0 ? <span style={{ color: 'var(--danger)' }}>Out of stock</span> : `${p.stock} ${p.unit}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Cart */}
        <div className="cart-panel">
          {/* Cart Header */}
          <div className="cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={17} color="var(--primary-light)" />
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>Cart</span>
              {itemCount > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{itemCount}</span>}
            </div>
            {cart.items.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => { cart.clear(); setDiscountInput(''); }} style={{ color: 'var(--danger)', fontSize: 12 }}>
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {/* Customer Select */}
          <div style={{ padding: '10px 14px', borderBottom: 'var(--border)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <User size={13} color="var(--text-muted)" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                style={{ fontSize: 13, padding: '7px 10px', paddingRight: cart.customer ? 30 : 10 }}
                placeholder="Search or walk-in customer..."
                value={custSearch}
                onChange={e => handleCustSearchChange(e.target.value)}
                onFocus={() => custSearch && setShowCustDrop(true)}
              />
              {cart.customer && (
                <button style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={clearCustomer}>
                  <X size={13} />
                </button>
              )}
              {showCustDrop && customers.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: 'var(--border-bright)', borderRadius: 'var(--radius-md)', zIndex: 100, maxHeight: 180, overflowY: 'auto', marginTop: 4, boxShadow: 'var(--shadow-md)' }}>
                  {customers.map(c => (
                    <div key={c._id} style={{ padding: '8px 12px', cursor: 'pointer', transition: 'var(--transition)', fontSize: 13 }}
                      onMouseDown={() => selectCustomer(c)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {c.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone} · {c.loyaltyPoints || 0} pts</div>}
                    </div>
                  ))}
                  <div style={{ padding: '8px 12px', cursor: 'pointer', borderTop: 'var(--border)', color: 'var(--primary-light)', fontSize: 12, fontWeight: 600 }}
                    onMouseDown={() => { setNewCust({ name: custSearch, phone: '', email: '' }); setNewCustModal(true); setShowCustDrop(false); }}
                  >
                    <Plus size={12} style={{ display: 'inline', marginRight: 4 }} /> Add new customer "{custSearch}"
                  </div>
                </div>
              )}
            </div>
            {cart.customer && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--success)' }}>
                ✓ {cart.customer.name} · {cart.customer.loyaltyPoints || 0} loyalty pts
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="cart-items">
            {cart.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <div style={{ fontSize: 13 }}>Click products to add to cart</div>
              </div>
            ) : (
              cart.items.map(item => (
                <div key={item.product} className="cart-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cart-item-name truncate">{item.productName}</div>
                    <div className="cart-item-price">
                      {formatCurrency(item.finalPrice)}/{item.unit}
                      {item.discountPercent > 0 && <span style={{ color: 'var(--success)', marginLeft: 4 }}>-{item.discountPercent}%</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => cart.updateQuantity(item.product, item.quantity - 1)}>
                        <Minus size={11} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => cart.updateQuantity(item.product, item.quantity + 1)} disabled={item.quantity >= item.maxStock}>
                        <Plus size={11} />
                      </button>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary-light)' }}>
                      {formatCurrency(item.finalPrice * item.quantity)}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-icon" onClick={() => cart.removeItem(item.product)} style={{ color: 'var(--danger)', padding: 4 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            {/* Discount Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Percent size={13} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Discount (₹)</span>
              <input
                type="number"
                className="form-input"
                style={{ width: 90, padding: '5px 8px', fontSize: 13, textAlign: 'right' }}
                value={discountInput}
                onChange={e => handleDiscount(e.target.value)}
                min="0"
                placeholder="0.00"
              />
            </div>

            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discount > 0 && <div className="summary-row"><span style={{ color: 'var(--success)' }}>Discount</span><span style={{ color: 'var(--success)' }}>-{formatCurrency(discount)}</span></div>}
            {tax > 0 && <div className="summary-row"><span>Tax</span><span>{formatCurrency(tax)}</span></div>}
            <div className="summary-row total"><span>Total</span><span style={{ color: 'var(--primary-light)' }}>{formatCurrency(total)}</span></div>

            <button
              className="btn btn-success w-full btn-lg"
              style={{ marginTop: 12, width: '100%', justifyContent: 'center', fontSize: 15 }}
              onClick={openPayment}
              disabled={!cart.items.length}
              id="process-payment-btn"
            >
              <CreditCard size={18} />
              Process Payment · {formatCurrency(total)}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title="Process Payment" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setPayModal(false)}>Cancel</button>
          <button className="btn btn-success btn-lg" onClick={processPayment} disabled={processing} style={{ minWidth: 150 }}>
            {processing ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <CreditCard size={16} />}
            {processing ? 'Processing...' : `Pay ${formatCurrency(total)}`}
          </button>
        </>}
      >
        <div>
          {/* Payment Method */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Method</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'upi', label: 'UPI', icon: Smartphone },
              ].map(m => (
                <button
                  key={m.id}
                  className={`btn ${payMethod === m.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPayMethod(m.id)}
                  style={{ flexDirection: 'column', gap: 4, padding: '12px 8px' }}
                >
                  <m.icon size={20} />
                  <span style={{ fontSize: 12 }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16 }}>
            <div className="summary-row"><span>Items ({itemCount})</span><span>{formatCurrency(subtotal)}</span></div>
            {discount > 0 && <div className="summary-row"><span style={{ color: 'var(--success)' }}>Discount</span><span style={{ color: 'var(--success)' }}>-{formatCurrency(discount)}</span></div>}
            {tax > 0 && <div className="summary-row"><span>Tax</span><span>{formatCurrency(tax)}</span></div>}
            <div className="summary-row total"><span>Total Due</span><span style={{ color: 'var(--primary-light)', fontSize: 20 }}>{formatCurrency(total)}</span></div>
          </div>

          {/* Amount Paid (cash only) */}
          {payMethod === 'cash' && (
            <div>
              <div className="form-group">
                <label className="form-label">Amount Received (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ fontSize: 18, padding: '10px 14px', fontWeight: 700 }}
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  placeholder={total.toFixed(2)}
                  min={total}
                  autoFocus
                />
              </div>
              {/* Quick cash buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000].filter((v, i, a) => a.indexOf(v) === i).map(v => (
                  <button key={v} className="btn btn-secondary btn-sm" onClick={() => setAmountPaid(v.toString())}>
                    ₹{v.toFixed(0)}
                  </button>
                ))}
              </div>
              {amountPaid && parseFloat(amountPaid) >= total && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 14 }}>
                  💵 Change: <strong style={{ color: 'var(--success)', fontSize: 16 }}>{formatCurrency(parseFloat(amountPaid) - total)}</strong>
                </div>
              )}
            </div>
          )}

          {payMethod !== 'cash' && (
            <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {payMethod === 'upi' ? '📱 Collect UPI payment confirmation' : '💳 Swipe/tap card for ₹' + total.toFixed(2)}
            </div>
          )}
        </div>
      </Modal>

      {/* New Customer Modal */}
      <Modal isOpen={newCustModal} onClose={() => setNewCustModal(false)} title="Add New Customer" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setNewCustModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={addNewCustomer}>Add Customer</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} placeholder="Customer name" required />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} placeholder="Mobile number" />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={newCust.email} onChange={e => setNewCust({ ...newCust, email: e.target.value })} placeholder="Email address" />
        </div>
      </Modal>

      {/* Bill Print Modal */}
      <Modal isOpen={billModal} onClose={() => setBillModal(false)} title="Transaction Complete 🎉" size="md"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setBillModal(false)}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Bill</button>
        </>}
      >
        {lastTransaction && <BillPrint transaction={lastTransaction} />}
      </Modal>
    </div>
  );
};

export default BillingPortal;
