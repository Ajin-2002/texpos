import React, { useEffect, useState } from 'react';
import { transactionAPI } from '../../api';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { PageLoader } from '../../components/common/Spinner';
import { TrendingUp, ShoppingBag, Package, Users, AlertTriangle, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useLocation, useNavigate } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, gradient, change, changeLabel }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ marginTop: 6 }}>{value}</div>
        {change !== undefined && (
          <div className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>
            <ArrowUpRight size={12} style={{ transform: change < 0 ? 'rotate(90deg)' : 'none' }} />
            {changeLabel}
          </div>
        )}
      </div>
      <div className="stat-icon">
        <Icon size={20} color="var(--primary-dark)" />
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card" style={{ padding: '10px 14px', minWidth: 120, fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {entry.name === 'count' ? entry.value : formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const mobileAdmin = location.pathname.startsWith('/mobile-admin');

  useEffect(() => {
    transactionAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(mobileAdmin ? '/mobile-admin/billing' : '/billing')}>
          <ShoppingBag size={16} />
          New Sale
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(data?.todaySales?.total || 0)}
          icon={TrendingUp}
          gradient="var(--primary)"
          changeLabel={`${data?.todaySales?.count || 0} transactions`}
          change={1}
        />
        <StatCard
          label="This Month"
          value={formatCurrency(data?.monthSales?.total || 0)}
          icon={ShoppingBag}
          gradient="var(--secondary)"
          changeLabel={`${data?.monthSales?.count || 0} orders`}
          change={1}
        />
        <StatCard
          label="Total Products"
          value={formatNumber(data?.totalProducts || 0)}
          icon={Package}
          gradient="var(--success)"
          changeLabel="Active items"
          change={0}
        />
        <StatCard
          label="Active Staff"
          value={formatNumber(data?.totalStaff || 0)}
          icon={Users}
          gradient="var(--warning)"
          changeLabel="Team members"
          change={0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Sales Chart */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 20, fontSize: 15 }}>
            Sales — Last 7 Days
          </h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.last7Days || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => v.split('-').slice(1).join('/')} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 20, fontSize: 15 }}>
            Top Products (This Month)
          </h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topProducts || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                  {(data?.topProducts || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Low Stock Alert */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>Low Stock Alert</h3>
          </div>
          {(!data?.lowStockProducts?.length) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>✅ All products are well-stocked!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.lowStockProducts.map(p => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: 'var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${p.stock <= 0 ? 'badge-danger' : 'badge-warning'}`}>
                      {p.stock <= 0 ? 'Out of Stock' : `${p.stock} left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            className="btn btn-secondary w-full"
            style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
            onClick={() => navigate(`${mobileAdmin ? '/mobile-admin' : '/admin'}/products?lowStock=true`)}
          >
            View All Low Stock
          </button>
        </div>

        {/* Year Summary */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 16, fontSize: 15 }}>
            Year Overview
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Annual Revenue', value: formatCurrency(data?.yearSales?.total || 0), color: '#6366f1' },
              { label: 'Total Transactions', value: formatNumber(data?.totalTransactions || 0), color: '#0ea5e9' },
              { label: 'Annual Orders', value: formatNumber(data?.yearSales?.count || 0), color: '#10b981' },
              { label: 'Avg. Order Value', value: data?.yearSales?.count ? formatCurrency((data?.yearSales?.total || 0) / data.yearSales.count) : '₹0', color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: 'var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
