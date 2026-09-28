'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sun,
  Moon,
  ShoppingCart,
  Activity,
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname === '/products') return 'Inventory Catalog';
    if (pathname === '/categories') return 'Product Categories';
    if (pathname === '/transactions/new') return 'Point of Sale / New Transaction';
    if (pathname === '/transactions') return 'Transaction History';
    if (pathname === '/users') return 'System User Directory';
    return 'Management Portal';
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="header-title">{getPageTitle()}</h2>
      </div>

      <div className="header-right">
        {/* Backend Connected Indicator */}
        <div
          className="status-pill"
          style={{ border: '1px solid var(--success-border)', background: 'var(--success-bg)' }}
        >
          <span className="status-indicator" />
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
            Live Backend
          </span>
        </div>

        {/* Quick New Transaction Shortcut */}
        {pathname !== '/transactions/new' && (
          <Link href="/transactions/new" className="btn btn-primary btn-sm">
            <ShoppingCart size={15} />
            <span>New Sale</span>
          </Link>
        )}

        {/* Dark/Light mode toggle */}
        {/*<button*/}
        {/*  onClick={toggleTheme}*/}
        {/*  className="btn btn-secondary btn-icon"*/}
        {/*  title="Toggle color theme"*/}
        {/*  style={{ width: '36px', height: '36px' }}*/}
        {/*>*/}
        {/*  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}*/}
        {/*</button>*/}
      </div>
    </header>
  );
}
