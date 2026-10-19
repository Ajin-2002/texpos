import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Lock, ShieldCheck, Sparkles } from 'lucide-react';

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
      <main className="login-shell">
        <section className="login-brand-panel" aria-label="TexPOS introduction">
          <div className="login-brand-lockup">
            <div className="login-brand-mark">🧵</div>
            <span>TexPOS</span>
          </div>
          <div className="login-brand-message">
            <span className="login-kicker"><Sparkles size={13} /> RETAIL, IN GOOD ORDER</span>
            <h1>Everything your store needs, in one place.</h1>
            <p>Manage your products, sales and day-to-day operations with a workspace built for your team.</p>
          </div>
          <div className="login-brand-foot"><span className="login-brand-dot" /> Textile point of sale</div>
          <div className="login-brand-decoration login-brand-decoration-one" />
          <div className="login-brand-decoration login-brand-decoration-two" />
        </section>

        <section className="login-form-panel">
          <div className="login-form-content">
            <div className="login-mobile-brand"><span className="login-brand-mark">🧵</span><strong>TexPOS</strong></div>
            <div className="login-heading">
              <span className="login-welcome">WELCOME BACK</span>
              <h2>Sign in to your account</h2>
              <p>Enter your work email and password to continue.</p>
            </div>
            <form onSubmit={handleSubmit} id="login-form">
              <div className="form-group">
                <label className="login-label" htmlFor="email">Work email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input login-input"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <div className="login-password-heading">
                  <label className="login-label" htmlFor="password">Password</label>
                  <Lock size={14} />
                </div>
                <div className="input-group has-suffix">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input login-input"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg login-submit"
                disabled={isLoading}
                id="login-submit"
              >
                {isLoading
                  ? <><span className="spinner" style={{ width: 17, height: 17 }} /> Signing in...</>
                  : <><LogIn size={17} /> Sign In</>
                }
              </button>
            </form>
            <div className="login-security"><ShieldCheck size={15} /><span>Your account is protected with secure sign-in.</span></div>
          </div>
          <footer className="login-footer">TexPOS <span>·</span> Retail operations, simplified</footer>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
