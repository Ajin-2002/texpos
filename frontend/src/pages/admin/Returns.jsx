import React, { useEffect, useState } from 'react';
import { transactionAPI } from '../../api';
import { PageLoader } from '../../components/common/Spinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ArrowLeftRight } from 'lucide-react';

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    transactionAPI.getAll({ type: 'return', limit: 50 })
      .then(res => { setReturns(res.data.data); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalReturned = returns.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Returns</h1>
          <p className="page-subtitle">{total} return transactions</p>
        </div>
        <div className="card" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArrowLeftRight size={16} color="var(--warning)" />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Returned</div>
            <div style={{ fontWeight: 700, color: 'var(--warning)', fontSize: 15 }}>{formatCurrency(totalReturned)}</div>
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Return Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Original Invoice</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Processed By</th>
                </tr>
              </thead>
              <tbody>
                {returns.length === 0 && (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <ArrowLeftRight size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                      <div className="empty-state-title">No returns recorded</div>
                    </div>
                  </td></tr>
                )}
                {returns.map(r => (
                  <tr key={r._id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--warning)' }}>{r.invoiceNumber}</span></td>
                    <td style={{ fontSize: 12 }}>{formatDate(r.createdAt, 'datetime')}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{r.customerName}</div>
                      {r.customerPhone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.customerPhone}</div>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{r.originalTransaction?.invoiceNumber || '—'}</td>
                    <td>{r.items?.length} item(s)</td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(r.totalAmount)}</td>
                    <td style={{ maxWidth: 150 }}>
                      <div className="truncate" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.returnReason || '—'}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.staffName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
