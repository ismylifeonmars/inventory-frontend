'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Boxes, Mail, Lock, User, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phoneNumber || !password) {
      toastError('Missing fields', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        phoneNumber,
        role,
        password,
      });
      success('Account created!', `Welcome to ApexInventory as ${role}.`);
      router.push('/');
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Registration Failed', e.message || 'Unable to register user.');
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
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Join the inventory management system
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-card)', marginBottom: '1.5rem' }}>
            <Link
              href="/login"
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
              Sign In
            </Link>
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
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name-input">Full Name</label>
              <div className="input-with-icon">
                <User size={17} className="input-icon-left" />
                <input
                  id="name-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={17} className="input-icon-left" />
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number</label>
              <div className="input-with-icon">
                <Phone size={17} className="input-icon-left" />
                <input
                  id="reg-phone"
                  type="tel"
                  className="form-input"
                  placeholder="+254 712 345 678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Account Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`btn ${role === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center' }}
                >
                  <ShieldCheck size={16} />
                  <span>ADMIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`btn ${role === 'USER' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center' }}
                >
                  <User size={16} />
                  <span>STAFF / USER</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div className="input-with-icon">
                <Lock size={17} className="input-icon-left" />
                <input
                  id="reg-password"
                  type="password"
                  className="form-input"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Creating Account...' : 'Complete Registration'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
