import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Lock, Mail } from 'lucide-react';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name}!`);
      // Auto-redirect by role — no portal toggle needed
      if (result.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/billing');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  return (
    <div className="login-page">
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)', borderRadius: '50%' }} />
      </div>

      <div className="login-card" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64,
            background: 'var(--primary)',
            borderRadius: 'var(--radius-lg)', fontSize: 30, marginBottom: 18,
            boxShadow: 'var(--shadow-primary)',
          }}>
            🧵
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800,
            color: 'var(--primary-dark)',
            letterSpacing: '-0.5px', marginBottom: 6,
          }}>
            TexPOS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, letterSpacing: '0.5px' }}>
            Textile Point of Sale System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              <Mail size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <Lock size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              Password
            </label>
            <div className="input-group has-suffix">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                style={{ paddingLeft: '14px' }}
              />
              <button
                type="button"
                className="input-suffix"
                style={{ pointerEvents: 'all', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading}
            id="login-submit"
            style={{ justifyContent: 'center', width: '100%', marginTop: 8 }}
          >
            {isLoading
              ? <><span className="spinner" style={{ width: 17, height: 17 }} /> Signing in...</>
              : <><LogIn size={17} /> Sign In</>
            }
          </button>
        </form>



      </div>
    </div>
  );
};

export default LoginPage;
