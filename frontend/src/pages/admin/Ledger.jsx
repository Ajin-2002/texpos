import React, { useEffect, useState, useCallback } from 'react';
import { ledgerAPI } from '../../api';
import Modal from '../../components/common/Modal';
import { PageLoader } from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { Plus, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/helpers';

const typeColors = {
  sale: 'badge-success', return: 'badge-warning', expense: 'badge-danger',
  income: 'badge-primary', purchase: 'badge-info', adjustment: 'badge-muted'
};

const Ledger = () => {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0 });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: 'expense', category: '', description: '', amount: '', debit: '', credit: '', date: new Date().toISOString().split('T')[0] });
  const LIMIT = 20;

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (typeFilter) params.type = typeFilter;
      const res = await ledgerAPI.getAll(params);
      setEntries(res.data.data);
      setSummary(res.data.summary);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load ledger'); }
    finally { setLoading(false); }
  }, [startDate, endDate, typeFilter, page]);

  useEffect(() => { loadLedger(); }, [loadLedger]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: parseFloat(form.amount) || 0, debit: form.type === 'expense' || form.type === 'purchase' ? parseFloat(form.amount) || 0 : 0, credit: form.type === 'income' || form.type === 'sale' ? parseFloat(form.amount) || 0 : 0 };
      await ledgerAPI.create(payload);
      toast.success('Entry added!');
      setModal(false);
      loadLedger();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add entry'); }
  };

  const net = summary.totalCredit - summary.totalDebit;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ledger</h1>
          <p className="page-subtitle">Financial records and accounting</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)} id="add-entry-btn">
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Income', value: formatCurrency(summary.totalCredit), icon: TrendingUp, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Total Expense', value: formatCurrency(summary.totalDebit), icon: TrendingDown, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Net Balance', value: formatCurrency(Math.abs(net)), icon: BookOpen, color: net >= 0 ? 'var(--success)' : 'var(--danger)', bg: net >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' },
        ].map(card => (
          <div key={card.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <card.icon size={20} color={card.color} />
            </div>
            <div>
              <div className="stat-label">{card.label}</div>
              <div className="stat-value" style={{ fontSize: 20, color: card.color }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-row">
        <input type="date" className="form-input" style={{ width: 150 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
        <input type="date" className="form-input" style={{ width: 150 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
        <select className="form-select" style={{ width: 150 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="sale">Sale</option>
          <option value="return">Return</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="purchase">Purchase</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? <PageLoader /> : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Credit</th>
                  <th>Debit</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <BookOpen size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                      <div className="empty-state-title">No entries found</div>
                    </div>
                  </td></tr>
                )}
                {entries.map(e => (
                  <tr key={e._id}>
                    <td style={{ fontSize: 12 }}>{formatDate(e.date, 'datetime')}</td>
                    <td><span className={`badge ${typeColors[e.type] || 'badge-muted'}`}>{e.type}</span></td>
                    <td style={{ maxWidth: 200 }}><div className="truncate" style={{ fontSize: 13 }}>{e.description}</div></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{e.referenceNumber || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{e.credit > 0 ? formatCurrency(e.credit) : '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{e.debit > 0 ? formatCurrency(e.debit) : '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.createdBy?.name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {total > LIMIT && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(Math.ceil(total / LIMIT), 8) }, (_, i) => i + 1).map(n => (
              <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}>›</button>
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Ledger Entry" size="md"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddEntry} form="ledger-form" type="submit">Add Entry</button>
        </>}
      >
        <form id="ledger-form" onSubmit={handleAddEntry}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Entry Type *</label>
              <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="purchase">Purchase</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Rent, Salary, Utilities..." />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="Brief description of this entry" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Ledger;
