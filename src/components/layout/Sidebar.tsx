'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Layers,
  Receipt,
  ShoppingCart,
  Users,
  LogOut,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Categories', href: '/categories', icon: Layers },
    { label: 'New Transaction (POS)', href: '/transactions/new', icon: ShoppingCart },
    { label: 'Transaction History', href: '/transactions', icon: Receipt },
  ];

  if (isAdmin) {
    navItems.push({ label: 'User Directory', href: '/users', icon: Users });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <Boxes size={22} />
        </div>
        <div className="brand-text">
          <h1>Laine Beauty</h1>
          <span>Stock & Ledger</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.href === '/transactions'
              ? pathname === '/transactions'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Guest User'}</div>
            <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isAdmin && <ShieldCheck size={12} color="var(--primary)" />}
              <span>{user?.role || 'USER'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost btn-icon"
            title="Sign Out"
            style={{ padding: '6px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
