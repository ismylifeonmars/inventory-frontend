'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Receipt,
  ShoppingCart,
  Eye,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import Shell from '@/components/layout/Shell';
import Modal from '@/components/ui/Modal';
import { TypeBadge, SaleBadge } from '@/components/ui/Badge';
import { transactionsApi } from '@/lib/api';
import { TransactionDto, TransactionDtoSecond } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function TransactionsPage() {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [saleFilter, setSaleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [detailTx, setDetailTx] = useState<TransactionDtoSecond | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (typeFilter) {
        res = await transactionsApi.getByType(typeFilter, page, 10);
      } else if (saleFilter) {
        res = await transactionsApi.getBySaleType(saleFilter, page, 10);
      } else {
        res = await transactionsApi.getAll(page, 10);
      }

      if (res.transactions) {
        setTransactions(res.transactions);
      }
      if (res.paginationResponse) {
        setTotalPages(res.paginationResponse.totalPages || 1);
        setTotalElements(res.paginationResponse.totalElements || 0);
      }
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to load transactions', e.message);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, saleFilter, page, toastError]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const viewDetails = async (id: string) => {
    try {
      const res = await transactionsApi.getById(id);
      if (res.transactionDtoSecond) {
        setDetailTx(res.transactionDtoSecond);
      }
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Could not retrieve transaction details', e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await transactionsApi.delete(deleteId);
      success('Transaction Deleted', 'The transaction record was removed.');
      setDeleteId(null);
      loadTransactions();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to delete transaction', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(val);
  };

  return (
    <Shell>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Transaction History & Ledger</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Auditable log of sales invoices, payments, and supplier purchases
          </p>
        </div>

        <Link href="/transactions/new" className="btn btn-primary">
          <ShoppingCart size={16} />
          <span>New Transaction</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 1 200px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setSaleFilter('');
                setPage(0);
              }}
            >
              <option value="">All Types (Sale & Purchase)</option>
              <option value="Sale">Sales Only</option>
              <option value="Purchase">Purchases / Restocks Only</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 1 200px' }}>
            <select
              className="form-select"
              value={saleFilter}
              onChange={(e) => {
                setSaleFilter(e.target.value);
                setTypeFilter('');
                setPage(0);
              }}
            >
              <option value="">All Payment Channels</option>
              <option value="CASH">Cash Register</option>
              <option value="MPESA">M-PESA Mobile</option>
            </select>
          </div>

          {(typeFilter || saleFilter) && (
            <button
              onClick={() => {
                setTypeFilter('');
                setSaleFilter('');
                setPage(0);
              }}
              className="btn btn-ghost btn-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Type</th>
                <th>Payment</th>
                <th>Staff / Email</th>
                <th>Item Count</th>
                <th>Total Amount</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No transactions found for the selected filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                        #{tx.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td>
                      <TypeBadge type={tx.transactionType} />
                    </td>
                    <td>
                      <SaleBadge saleType={tx.saleType} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                        <User size={13} color="var(--text-muted)" />
                        <span>{tx.email}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {tx.transactionLinesCount || 0} line items
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(tx.totalAmount)}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => viewDetails(tx.id)}
                          className="btn btn-ghost btn-icon"
                          title="Inspect Line Items"
                          style={{ padding: '6px' }}
                        >
                          <Eye size={15} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteId(tx.id)}
                            className="btn btn-ghost btn-icon"
                            title="Delete Record"
                            style={{ padding: '6px', color: 'var(--danger)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div>
            Showing Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} total records)
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0 || loading}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
              disabled={page >= totalPages - 1 || loading}
              className="btn btn-secondary btn-sm"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* TRANSACTION LINE ITEMS DETAIL MODAL */}
      <Modal
        isOpen={!!detailTx}
        onClose={() => setDetailTx(null)}
        title="Transaction Ledger Details"
        maxWidth="620px"
      >
        {detailTx && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              background: 'var(--bg-surface)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type</div>
                <div style={{ marginTop: '0.2rem' }}><TypeBadge type={detailTx.transactionType} /></div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Channel</div>
                <div style={{ marginTop: '0.2rem' }}><SaleBadge saleType={detailTx.saleType} /></div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agent</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.2rem' }}>{detailTx.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                  {new Date(detailTx.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Transaction Line Items ({detailTx.transactionLines?.length || 0})
            </h4>

            <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailTx.transactionLines?.map((line, idx) => (
                    <tr key={line.id || idx}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{line.productName || `Product ID: ${line.productId.substring(0, 8)}...`}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {line.productId}
                        </div>
                      </td>
                      <td>{line.quantity}</td>
                      <td>{formatCurrency(line.unitPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>Grand Total:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                {formatCurrency(detailTx.totalAmount)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                onClick={() => setDetailTx(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Transaction Record"
        maxWidth="440px"
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <AlertCircle size={26} />
          </div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Delete Transaction?
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            This will remove the transaction record from the ledger. Note that existing inventory quantities will not be auto-reversed.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setDeleteId(null)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-danger"
            disabled={actionLoading}
          >
            {actionLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </Shell>
  );
}
