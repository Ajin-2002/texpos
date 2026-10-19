import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/admin/AdminLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Staff from './pages/admin/Staff';
import Suppliers from './pages/admin/Suppliers';
import Transactions from './pages/admin/Transactions';
import Returns from './pages/admin/Returns';
import Ledger from './pages/admin/Ledger';
import Reports from './pages/admin/Reports';
import BillingPortal from './pages/billing/BillingPortal';
import MobileAdminDemo from './pages/admin/MobileAdminDemo';
import useAuthStore from './store/authStore';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/billing" replace />;
  return children;
};

const App = () => {
  return (
    <>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#ffffff',
          color: '#1a2e22',
          border: '1px solid #dce8df',
          fontSize: '13px',
          boxShadow: '0 4px 16px rgba(50,90,65,0.1)',
        },
        success: { iconTheme: { primary: '#3d9970', secondary: 'white' } },
        error: { iconTheme: { primary: '#d9534f', secondary: 'white' } },
      }}
    />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/mobile-admin-demo" element={<MobileAdminDemo />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="staff" element={<ProtectedRoute adminOnly><Staff /></ProtectedRoute>} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="returns" element={<Returns />} />
        <Route path="ledger" element={<ProtectedRoute adminOnly><Ledger /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
      </Route>

      {/* Dedicated phone-width review route, using the same admin pages and actions */}
      <Route path="/mobile-admin" element={<ProtectedRoute adminOnly><AdminLayout mobilePreview /></ProtectedRoute>}>
        <Route index element={<Navigate to="/mobile-admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="staff" element={<ProtectedRoute adminOnly><Staff /></ProtectedRoute>} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="returns" element={<Returns />} />
        <Route path="ledger" element={<ProtectedRoute adminOnly><Ledger /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
      </Route>

      {/* Billing Portal */}
      <Route path="/billing" element={<ProtectedRoute><BillingPortal /></ProtectedRoute>} />
      <Route path="/mobile-admin/billing" element={<ProtectedRoute adminOnly><BillingPortal mobilePreview /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
};

export default App;
