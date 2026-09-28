'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Smartphone,
  AlertTriangle,
  Award,
  ArrowDownRight,
  ShoppingCart,
  PackagePlus,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Shell from '@/components/layout/Shell';
import { dashboardApi, transactionsApi } from '@/lib/api';
import { DashboardResponse, ProductDto, TransactionDto } from '@/lib/types';
import { StockBadge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';

const TRANSACTION_PAGE_SIZE = 100;

function isToday(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function calculateTodayCashSales(transactions: TransactionDto[]) {
  return transactions.reduce((total, transaction) => {
    const isSale = transaction.transactionType.toLowerCase() === 'sale';
    const amount = Number(transaction.totalAmount);

    return isSale && isToday(transaction.createdAt) && Number.isFinite(amount)
      ? total + amount
      : total;
  }, 0);
}

async function getTodayCashSales() {
  const firstPage = await transactionsApi.getBySaleType('CASH', 0, TRANSACTION_PAGE_SIZE);
  const totalPages = firstPage.paginationResponse?.totalPages ?? 1;
  const remainingPages = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, pageIndex) => transactionsApi.getBySaleType('CASH', pageIndex + 1, TRANSACTION_PAGE_SIZE)
  );
  const pages = await Promise.all(remainingPages);
  const transactions = [firstPage, ...pages].flatMap((page) => page.transactions ?? []);

  return calculateTodayCashSales(transactions);
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  const [stats, setStats] = useState<DashboardResponse | null>(null);
  const [cashSales, setCashSales] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<ProductDto[]>([]);
  const [bestSelling, setBestSelling] = useState<ProductDto[]>([]);
  const [worstSelling, setWorstSelling] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [statsRes, lowRes, bestRes, worstRes, cashRes] = await Promise.allSettled([
          dashboardApi.getStatistics(),
          dashboardApi.getLowStock(),
          dashboardApi.getBestSelling(),
          dashboardApi.getWorstSelling(),
          getTodayCashSales(),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.dashboardResponse) {
          setStats(statsRes.value.dashboardResponse);
        }
        if (lowRes.status === 'fulfilled' && lowRes.value.products) {
          setLowStock(lowRes.value.products);
        }
        if (bestRes.status === 'fulfilled' && bestRes.value.products) {
          setBestSelling(bestRes.value.products);
        }
        if (worstRes.status === 'fulfilled' && worstRes.value.products) {
          setWorstSelling(worstRes.value.products);
        }
        if (cashRes.status === 'fulfilled') {
          setCashSales(cashRes.value);
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '$0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(val);
  };

  return (
    <Shell>
      {/* Welcome Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Hello, {user?.name?.split(' ')[0] || 'Operator'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Here is your live inventory status and real-time transaction summary.
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/transactions/new" className="btn btn-primary">
            <ShoppingCart size={16} />
            <span>Point of Sale</span>
          </Link>
          {isAdmin && (
            <Link href="/products" className="btn btn-secondary">
              <PackagePlus size={16} />
              <span>Products</span>
            </Link>
          )}
          {isAdmin && (
            <Link href="/categories" className="btn btn-secondary">
              <Layers size={16} />
              <span>Categories</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        {/* Total Stock Value */}
        <div className="card stat-card" style={{ '--stat-glow': 'rgba(153, 27, 27, 0.25)' } as React.CSSProperties}>
          <div className="stat-header">
            <span className="stat-label">Total Stock Valuation</span>
            <div className="stat-icon-wrapper" style={{ color: 'var(--primary)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(stats?.stockValue)}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            Real-time warehouse inventory value
          </div>
        </div>

        {/* Total Daily Sales */}
        <div className="card stat-card" style={{ '--stat-glow': 'rgba(16, 185, 129, 0.25)' } as React.CSSProperties}>
          <div className="stat-header">
            <span className="stat-label">Today&apos;s Total Sales</span>
            <div className="stat-icon-wrapper" style={{ color: 'var(--success)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {formatCurrency(stats?.totalSalesPerDay)}
          </div>
          <div className="stat-change" style={{ color: 'var(--success)' }}>
            <span>Combined Cash & M-Pesa volume</span>
          </div>
        </div>

        {/* Cash Sales */}
        <div className="card stat-card" style={{ '--stat-glow': 'rgba(153, 27, 27, 0.25)' } as React.CSSProperties}>
          <div className="stat-header">
            <span className="stat-label">Cash Sales</span>
            <div className="stat-icon-wrapper" style={{ color: 'var(--primary)' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(cashSales ?? stats?.totalCashSalesPerDay)}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            Daily physical register intake
          </div>
        </div>

        {/* M-Pesa Sales */}
        <div className="card stat-card" style={{ '--stat-glow': 'rgba(245, 158, 11, 0.25)' } as React.CSSProperties}>
          <div className="stat-header">
            <span className="stat-label">M-PESA Mobile Sales</span>
            <div className="stat-icon-wrapper" style={{ color: 'var(--warning)' }}>
              <Smartphone size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {formatCurrency(stats?.totalMpesaSalesPerDay)}
          </div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            Instant digital receipts
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner & Table */}
      {lowStock.length > 0 && (
        <div className="card" style={{
          marginBottom: '2rem',
          borderLeft: '4px solid var(--warning)',
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.05) 0%, rgba(17, 24, 39, 0.75) 100%)',
        }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--warning-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--warning)',
              }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="card-title">Low Stock Alert ({lowStock.length} items)</h3>
                <p className="card-subtitle">These products have fallen below safe replenishment thresholds.</p>
              </div>
            </div>
            <Link href="/products" className="btn btn-secondary btn-sm">
              <span>View All Products</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock Available</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((prod) => (
                  <tr key={prod.id}>
                    <td style={{ fontWeight: 600 }}>{prod.name}</td>
                    <td><span className="badge badge-neutral">{prod.categoryName}</span></td>
                    <td>{formatCurrency(prod.unitPrice)}</td>
                    <td><StockBadge quantity={prod.stockQuantity} /></td>
                    <td>
                      <Link
                        href={`/transactions/new?productId=${prod.id}&type=Purchase`}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--primary)' }}
                      >
                        <ShoppingCart size={13} />
                        <span>Restock</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaderboard Sections: Best & Worst Selling */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Top Performers */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--success-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
              }}>
                <Award size={18} />
              </div>
              <div>
                <h3 className="card-title">Best-Selling Products</h3>
                <p className="card-subtitle">Highest transaction volume products</p>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Sales Count</th>
                </tr>
              </thead>
              <tbody>
                {bestSelling.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No sales records yet
                    </td>
                  </tr>
                ) : (
                  bestSelling.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prod.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.categoryName}</div>
                      </td>
                      <td>{formatCurrency(prod.unitPrice)}</td>
                      <td><StockBadge quantity={prod.stockQuantity} /></td>
                      <td>
                        <span className="badge badge-success">
                          {prod.transactionLinesCount} transactions
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slow-Moving Products */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--info-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--info)',
              }}>
                <ArrowDownRight size={18} />
              </div>
              <div>
                <h3 className="card-title">Worst-Selling Products</h3>
                <p className="card-subtitle">Opportunities for discounts or promotions</p>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Sales Count</th>
                </tr>
              </thead>
              <tbody>
                {worstSelling.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No sales records yet
                    </td>
                  </tr>
                ) : (
                  worstSelling.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prod.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.categoryName}</div>
                      </td>
                      <td>{formatCurrency(prod.unitPrice)}</td>
                      <td><StockBadge quantity={prod.stockQuantity} /></td>
                      <td>
                        <span className="badge badge-neutral">
                          {prod.transactionLinesCount} transactions
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
