'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Menu,
} from 'lucide-react';

interface BottomNavProps {
  onToggleMenu: () => void;
  isMenuOpen: boolean;
}

export default function BottomNav({ onToggleMenu, isMenuOpen }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: LayoutDashboard },
    { label: 'Catalog', href: '/products', icon: Package },
    { label: 'POS Sale', href: '/transactions/new', icon: ShoppingCart, isPrimary: true },
    { label: 'Ledger', href: '/transactions', icon: Receipt },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.href === '/transactions'
              ? pathname === '/transactions'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-bottom-nav-item primary-action ${isActive ? 'active' : ''}`}
                aria-label={item.label}
              >
                <div className="primary-action-icon">
                  <Icon size={20} />
                </div>
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}

        {/* Menu / Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleMenu}
          className={`mobile-bottom-nav-item ${isMenuOpen ? 'active' : ''}`}
          aria-label="Open menu"
        >
          <Menu size={20} />
          <span className="mobile-nav-label">Menu</span>
        </button>
      </div>
    </nav>
  );
}
