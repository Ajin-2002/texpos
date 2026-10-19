import React, { useEffect, useState, useCallback } from 'react';
import { transactionAPI } from '../../api';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { Search, Eye, ArrowLeftRight, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatDate, paymentLabel } from '../../utils/helpers';

const statusBadge = { completed: 'badge-success', pending: 'badge-warning', cancelled: 'badge-danger', returned: 'badge-info' };

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewModal, setViewModal] = useState({ open: false, transaction: null });
  const [returnModal, setReturnModal] = useState({ open: false, transaction: null });
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const LIMIT = 15;

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await transactionAPI.getAll(params);
      setTransactions(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [search, filterType, filterStatus, startDate, endDate, page]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const viewTransaction = async (id) => {
    try {
      const res = await transactionAPI.getOne(id);
      setViewModal({ open: true, transaction: res.data.data });
    } catch { toast.error('Failed to load transaction'); }
  };

  const openReturn = (t) => {
    setReturnItems(t.items.map(i => ({ ...i, returnQty: i.quantity, product: i.product?._id || i.product })));
    setReturnReason('');
    setReturnModal({ open: true, transaction: t });
  };

  const handleReturn = async () => {
    const items = returnItems.filter(i => i.returnQty > 0).map(i => ({ product: i.product, quantity: i.returnQty }));
    if (!items.length) return toast.error('Select items to return');
    try {
      await transactionAPI.return({ originalTransactionId: returnModal.transaction._id, items, returnReason });
      toast.success('Return processed!');
      setReturnModal({ open: false, transaction: null });
      loadTransactions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to process return'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="search-bar">
          <Search size={15} color="var(--text-muted)" />
          <input placeholder="Search invoice, customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 130 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="sale">Sale</option>
          <option value="return">Return</option>
        </select>
        <select className="form-select" style={{ width: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="returned">Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" className="form-input" style={{ width: 150 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
        <input type="date" className="form-input" style={{ width: 150 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? <PageLoader /> : (
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Staff</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr><td colSpan={9}>
                    <div className="empty-state">
                      <ShoppingBag size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                      <div className="empty-state-title">No transactions found</div>
                    </div>
                  </td></tr>
                )}
                {transactions.map(t => (
                  <tr key={t._id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary-light)' }}>{t.invoiceNumber}</span></td>
                    <td style={{ fontSize: 12 }}>{formatDate(t.createdAt, 'datetime')}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{t.customerName}</div>
                      {t.customerPhone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.customerPhone}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.staffName}</td>
                    <td>
                      <span className={`badge ${t.type === 'sale' ? 'badge-primary' : 'badge-warning'}`}>
                        {t.type === 'sale' ? '↑ Sale' : '↓ Return'}
                      </span>
                    </td>
                    <td><span className="chip">{paymentLabel(t.paymentMethod)}</span></td>
                    <td style={{ fontWeight: 700, color: t.type === 'return' ? 'var(--danger)' : 'var(--success)' }}>
                      {t.type === 'return' ? '-' : ''}{formatCurrency(t.totalAmount)}
                    </td>
                    <td><span className={`badge ${statusBadge[t.status] || 'badge-muted'}`}>{t.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => viewTransaction(t._id)} title="View Details">
                          <Eye size={15} />
                        </button>
                        {t.type === 'sale' && t.status === 'completed' && (
                          <button className="btn btn-ghost btn-icon" onClick={() => openReturn(t)} title="Process Return" style={{ color: 'var(--warning)' }}>
                            <ArrowLeftRight size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {total > LIMIT && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(Math.ceil(total / LIMIT), 10) }, (_, i) => i + 1).map(n => (
              <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}>›</button>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={viewModal.open} onClose={() => setViewModal({ open: false, transaction: null })} title={`Invoice: ${viewModal.transaction?.invoiceNumber}`} size="lg">
        {viewModal.transaction && (
          <div>
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Customer</div>
                <div style={{ fontWeight: 600 }}>{viewModal.transaction.customerName}</div>
                {viewModal.transaction.customerPhone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{viewModal.transaction.customerPhone}</div>}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Date</div>
                <div style={{ fontWeight: 600 }}>{formatDate(viewModal.transaction.createdAt, 'datetime')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>By {viewModal.transaction.staffName}</div>
              </div>
            </div>
            <div className="table-wrapper" style={{ marginBottom: 16 }}>
              <table className="table">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Tax</th><th>Total</th></tr></thead>
                <tbody>
                  {viewModal.transaction.items.map((item, i) => (
                    <tr key={i}>
                      <td><div style={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sku}</div></td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{item.discountPercent || 0}%</td>
                      <td>{item.taxPercent || 0}%</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              {[
                ['Subtotal', formatCurrency(viewModal.transaction.subtotal)],
                ['Discount', `-${formatCurrency(viewModal.transaction.discountAmount || 0)}`],
                ['Tax', formatCurrency(viewModal.transaction.taxAmount || 0)],
              ].map(([l, v]) => (
                <div key={l} className="summary-row"><span>{l}</span><span>{v}</span></div>
              ))}
              <div className="summary-row total"><span>Total</span><span>{formatCurrency(viewModal.transaction.totalAmount)}</span></div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                Payment: <strong style={{ color: 'var(--text-primary)' }}>{paymentLabel(viewModal.transaction.paymentMethod)}</strong>
                {viewModal.transaction.amountPaid > viewModal.transaction.totalAmount && (
                  <> · Change: <strong style={{ color: 'var(--success)' }}>{formatCurrency(viewModal.transaction.changeAmount)}</strong></>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Return Modal */}
      <Modal isOpen={returnModal.open} onClose={() => setReturnModal({ open: false, transaction: null })} title="Process Return"
        size="md"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setReturnModal({ open: false, transaction: null })}>Cancel</button>
          <button className="btn btn-warning" onClick={handleReturn}>Process Return</button>
        </>}
      >
        {returnModal.transaction && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Invoice: <strong style={{ color: 'var(--primary-light)' }}>{returnModal.transaction.invoiceNumber}</strong>
            </p>
            {returnItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.productName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sold: {item.quantity} {item.unit}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Return qty:</span>
                  <input type="number" className="form-input" value={item.returnQty} min="0" max={item.quantity}
                    onChange={e => setReturnItems(returnItems.map((ri, idx) => idx === i ? { ...ri, returnQty: parseInt(e.target.value) || 0 } : ri))}
                    style={{ width: 70, textAlign: 'center' }}
                  />
                </div>
              </div>
            ))}
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Return Reason</label>
              <textarea className="form-textarea" value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="Defective, wrong item, customer request..." style={{ minHeight: 70 }} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Transactions;
