import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Avatar from '../common/Avatar';
import {
  LayoutDashboard, Package, Users, Truck, ArrowLeftRight,
  BookOpen, BarChart3, ShoppingCart, LogOut,
  Tag, Smartphone, Monitor
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Products', icon: Package, to: '/admin/products' },
  { label: 'Categories', icon: Tag, to: '/admin/categories' },
  { label: 'Staff', icon: Users, to: '/admin/staff', adminOnly: true },
  { label: 'Suppliers', icon: Truck, to: '/admin/suppliers' },
  { label: 'Returns', icon: ArrowLeftRight, to: '/admin/returns' },
  { label: 'Transactions', icon: ShoppingCart, to: '/admin/transactions' },
  { label: 'Ledger', icon: BookOpen, to: '/admin/ledger', adminOnly: true },
  { label: 'Reports', icon: BarChart3, to: '/admin/reports', adminOnly: true },
];

const AdminSidebar = ({ mobilePreview = false }) => {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const adminBase = mobilePreview ? '/mobile-admin' : '/admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-brand">
          <div className="logo-icon">🧵</div>
          <div>
            <div className="logo-text">TexPOS</div>
            <div className="logo-sub">Admin Portal</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Admin navigation">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map(item => {
          if (item.adminOnly && !isAdmin()) return null;
          return (
            <NavLink
              key={item.to}
              to={`${adminBase}${item.to.replace('/admin', '')}`}
              title={item.label}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={17} className="nav-item-icon" />
              {item.label}
            </NavLink>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: 16 }}>Portal</div>
        <NavLink to={mobilePreview ? '/mobile-admin/billing' : '/billing'} title="Billing Portal" className="nav-item">
          <ShoppingCart size={17} className="nav-item-icon" />
          Billing Portal
        </NavLink>
        <NavLink
          to={mobilePreview ? '/admin/dashboard' : '/mobile-admin/dashboard'}
          title={mobilePreview ? 'Switch to Desktop Portal' : 'Switch to Mobile Portal'}
          className="nav-item mobile-view-switch"
        >
          {mobilePreview ? <Monitor size={17} className="nav-item-icon" /> : <Smartphone size={17} className="nav-item-icon" />}
          {mobilePreview ? 'Desktop view' : 'Mobile view'}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <Avatar name={user?.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name truncate">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
