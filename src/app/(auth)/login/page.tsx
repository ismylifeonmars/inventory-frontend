'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Boxes, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Missing credentials', 'Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      success('Welcome back!', 'Authentication successful.');
      router.push('/');
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Authentication Failed', e.message || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(153, 27, 27, 0.18), transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(127, 29, 29, 0.14), transparent 70%), #0b0f19',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--primary-gradient)',
            boxShadow: '0 0 25px var(--primary-glow)',
            marginBottom: '1rem',
            color: '#fff',
          }}>
            <Boxes size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            ApexInventory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Enterprise stock tracking and POS management
          </p>
        </div>

        {/* Auth Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-card)', marginBottom: '1.5rem' }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.925rem',
                color: 'var(--primary)',
                borderBottom: '2px solid var(--primary)',
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
            <Link
              href="/register"
              style={{
                flex: 1,
                padding: '0.75rem',
                textAlign: 'center',
                fontWeight: 500,
                fontSize: '0.925rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Register
            </Link>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">Email Address</label>
              <div className="input-with-icon">
                <Mail size={17} className="input-icon-left" />
                <input
                  id="email-input"
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password-input">Password</label>
              <div className="input-with-icon">
                <Lock size={17} className="input-icon-left" />
                <input
                  id="password-input"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
