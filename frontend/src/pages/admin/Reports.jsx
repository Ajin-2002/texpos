import React, { useEffect, useState } from 'react';
import { transactionAPI } from '../../api';
import { PageLoader } from '../../components/common/Spinner';
import { formatCurrency, chartColors } from '../../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    import('../../api').then(m => m.ledgerAPI.getReports({ year }))
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <PageLoader />;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-card" style={{ padding: '10px 14px', fontSize: 12 }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontWeight: 600 }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name !== 'Orders' ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  };

  const totalSales = data?.monthlyReport?.reduce((s, m) => s + m.sales, 0) || 0;
  const totalReturns = data?.monthlyReport?.reduce((s, m) => s + m.returns, 0) || 0;
  const totalOrders = data?.monthlyReport?.reduce((s, m) => s + m.transactions, 0) || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Reports</h1>
          <p className="page-subtitle">Annual analytics and performance overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Year:</label>
          <select className="form-select" style={{ width: 100 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: `${year} Revenue`, value: formatCurrency(totalSales), gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
          { label: `${year} Orders`, value: totalOrders.toLocaleString(), gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
          { label: 'Total Returns', value: formatCurrency(totalReturns), gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
          { label: 'Net Revenue', value: formatCurrency(totalSales - totalReturns), gradient: 'linear-gradient(135deg, #10b981, #059669)' },
        ].map(card => (
          <div key={card.label} className="stat-card" style={{ '--gradient': card.gradient }}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ marginTop: 8 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly Sales Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 20 }}>Monthly Sales vs Returns</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.monthlyReport || []}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="returnsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
              <Area type="monotone" dataKey="sales" name="Sales" stroke="#6366f1" strokeWidth={2} fill="url(#salesFill)" />
              <Area type="monotone" dataKey="returns" name="Returns" stroke="#ef4444" strokeWidth={2} fill="url(#returnsFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Orders Bar Chart */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 20 }}>Monthly Order Count</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyReport || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="transactions" name="Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Pie */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 20 }}>Payment Methods</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.paymentBreakdown || []} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {(data?.paymentBreakdown || []).map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 20 }}>Top Categories by Revenue</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.topCategories || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                {(data?.topCategories || []).map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
