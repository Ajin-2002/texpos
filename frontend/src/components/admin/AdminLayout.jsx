import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import useAuthStore from '../../store/authStore';
import { Toaster } from 'react-hot-toast';

const AdminLayout = ({ mobilePreview = false }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className={`app-layout${mobilePreview ? ' mobile-layout-preview' : ''}`}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#fff', color: '#1a2e22', border: '1px solid #dce8df', fontSize: '13px', boxShadow: '0 4px 16px rgba(50,90,65,0.1)' },
          success: { iconTheme: { primary: '#3d9970', secondary: 'white' } },
          error: { iconTheme: { primary: '#d9534f', secondary: 'white' } },
        }}
      />
      <AdminSidebar mobilePreview={mobilePreview} />
      <main className="main-area">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
