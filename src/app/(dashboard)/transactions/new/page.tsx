'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Smartphone,
  ArrowLeft,
  Package,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import Shell from '@/components/layout/Shell';
import Modal from '@/components/ui/Modal';
import { StockBadge, TypeBadge, SaleBadge } from '@/components/ui/Badge';
import { productsApi, transactionsApi } from '@/lib/api';
import { ProductDto, TransactionDtoSecond, TransactionLineRequest } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

interface CartItem {
  product: ProductDto;
  quantity: number;
  unitPrice: number;
}

function NewTransactionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Transaction form state
  const [transactionType, setTransactionType] = useState<'Sale' | 'Purchase'>('Sale');
  const [saleType, setSaleType] = useState<'CASH' | 'MPESA'>('CASH');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Success Receipt Modal
  const [completedTx, setCompletedTx] = useState<TransactionDtoSecond | null>(null);

  // Initial load
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await productsApi.getAll(0, 50);
      if (res.products) {
        setProducts(res.products);

        // Pre-select product from URL params if present (e.g. from low stock alert)
        const initialProdId = searchParams.get('productId');
        const initialType = searchParams.get('type') as 'Sale' | 'Purchase';
        if (initialType) setTransactionType(initialType);

        if (initialProdId) {
          const matched = res.products.find(p => p.id === initialProdId);
          if (matched) {
            setCart([{ product: matched, quantity: 1, unitPrice: matched.unitPrice }]);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Cart operations
  const addToCart = (product: ProductDto) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.unitPrice }];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const updateUnitPrice = (productId: string, price: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, unitPrice: Math.max(0, price) } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const grandTotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  // Submit Transaction
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toastError('Cart is empty', 'Add at least one product before submitting');
      return;
    }

    // If sale, validate inventory
    if (transactionType === 'Sale') {
      for (const item of cart) {
        if (item.product.stockQuantity < item.quantity) {
          toastError(
            'Insufficient Stock',
            `${item.product.name} only has ${item.product.stockQuantity} in stock (requested: ${item.quantity}).`
          );
          return;
        }
      }
    }

    const payloadLines: TransactionLineRequest[] = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    setSubmitting(true);
    try {
      const res = await transactionsApi.create({
        transactionType,
        saleType,
        email: user?.email || 'admin@inventory.com',
        transactionLineRequests: payloadLines,
      });

      success('Transaction Created', `${transactionType} record of $${grandTotal.toFixed(2)} recorded successfully.`);
      if (res.transactionDtoSecond) {
        setCompletedTx(res.transactionDtoSecond);
      } else {
        clearCart();
        router.push('/transactions');
      }
      loadProducts();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Transaction failed', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(val);
  };

  return (
    <Shell>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/transactions" className="btn btn-secondary btn-icon" title="Back to history">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Point of Sale / New Transaction</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Create customer sales invoices or log incoming warehouse purchases
            </p>
          </div>
        </div>
      </div>

      {/* POS Two-Column Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 0.8fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Product Selection */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="card-title">Select Inventory Items</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Click any card to add to order
            </span>
          </div>

          {/* Search Box */}
          <div className="input-with-icon">
            <Search size={16} className="input-icon-left" />
            <input
              type="text"
              className="form-input"
              placeholder="Search items by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Product Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.85rem',
            maxHeight: '520px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}>
            {loadingProducts ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Loading catalog items...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No matching products found
              </div>
            ) : (
              filteredProducts.map(p => {
                const inCart = cart.find(c => c.product.id === p.id);
                const isOutOfStock = transactionType === 'Sale' && p.stockQuantity <= 0;

                return (
                  <button
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    disabled={isOutOfStock}
                    style={{
                      background: inCart ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                      border: inCart ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      textAlign: 'left',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.45 : 1,
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {inCart && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'var(--primary)',
                        color: '#fff',
                        borderRadius: 'var(--radius-full)',
                        padding: '1px 6px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}>
                        {inCart.quantity}x
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                      {p.categoryName}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                        {formatCurrency(p.unitPrice)}
                      </span>
                      <StockBadge quantity={p.stockQuantity} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Transaction Cart & Options */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="card-title">Order Ledger</h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger)', fontSize: '0.75rem' }}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Transaction Type Picker: Sale vs Purchase */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Transaction Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setTransactionType('Sale')}
                className={`btn ${transactionType === 'Sale' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center' }}
              >
                <ShoppingCart size={15} />
                <span>Customer Sale (Deduct)</span>
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('Purchase')}
                className={`btn ${transactionType === 'Purchase' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center' }}
              >
                <Package size={15} />
                <span>Restock Purchase (Add)</span>
              </button>
            </div>
          </div>

          {/* Payment Method Picker: CASH vs MPESA */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Payment Channel</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSaleType('CASH')}
                className={`btn ${saleType === 'CASH' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center' }}
              >
                <CreditCard size={15} />
                <span>Cash Register</span>
              </button>
              <button
                type="button"
                onClick={() => setSaleType('MPESA')}
                className={`btn ${saleType === 'MPESA' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center' }}
              >
                <Smartphone size={15} />
                <span>M-PESA Mobile</span>
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0.75rem 0',
            maxHeight: '280px',
            overflowY: 'auto',
          }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No items added yet. Click an item from the left catalog to add.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-surface)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatCurrency(item.unitPrice)} each
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="btn btn-secondary btn-icon"
                        style={{ padding: '4px', width: '26px', height: '26px' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="btn btn-secondary btn-icon"
                        style={{ padding: '4px', width: '26px', height: '26px' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Line total */}
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: '70px', textAlign: 'right' }}>
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="btn btn-ghost btn-icon"
                      style={{ padding: '4px', color: 'var(--danger)' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grand Total & Checkout Button */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Grand Total:</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatCurrency(grandTotal)}
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {submitting ? 'Processing Transaction...' : `Complete ${transactionType} (${saleType})`}
            </button>
          </div>
        </div>
      </div>

      {/* RECEIPT / CONFIRMATION MODAL */}
      <Modal
        isOpen={!!completedTx}
        onClose={() => {
          setCompletedTx(null);
          clearCart();
          router.push('/transactions');
        }}
        title="Transaction Completed"
      >
        {completedTx && (
          <div>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Payment Processed</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                Invoice Ref: {completedTx.id}
              </p>
            </div>

            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Type:</span>
                <TypeBadge type={completedTx.transactionType} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Channel:</span>
                <SaleBadge saleType={completedTx.saleType} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Authorized Agent:</span>
                <span>{completedTx.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                <span>{new Date(completedTx.createdAt).toLocaleString()}</span>
              </div>

              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--success)' }}>{formatCurrency(completedTx.totalAmount)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setCompletedTx(null);
                  clearCart();
                }}
                className="btn btn-secondary"
              >
                <RotateCcw size={15} />
                <span>New Transaction</span>
              </button>
              <button
                onClick={() => {
                  setCompletedTx(null);
                  clearCart();
                  router.push('/transactions');
                }}
                className="btn btn-primary"
              >
                <Receipt size={15} />
                <span>View All Records</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Shell>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading Point of Sale...</div>}>
      <NewTransactionContent />
    </Suspense>
  );
}
