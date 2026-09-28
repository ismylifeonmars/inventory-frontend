'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Eye,
  ShoppingCart,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import Shell from '@/components/layout/Shell';
import Modal from '@/components/ui/Modal';
import { StockBadge } from '@/components/ui/Badge';
import { productsApi, categoriesApi } from '@/lib/api';
import { CategoryDto, ProductDto, ProductRequest } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ProductDto | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProductRequest>({
    name: '',
    categoryName: '',
    unitPrice: 0,
    stockQuantity: 0,
    description: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.getAll();
      if (res.categories) {
        setCategories(res.categories);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (searchQuery.trim()) {
        res = await productsApi.getByName(searchQuery.trim(), page, 10);
      } else if (selectedCategory) {
        res = await productsApi.getByCategoryName(selectedCategory, page, 10);
      } else {
        res = await productsApi.getAll(page, 10);
      }

      if (res.products) {
        setProducts(res.products);
      }
      if (res.paginationResponse) {
        setTotalPages(res.paginationResponse.totalPages || 1);
        setTotalElements(res.paginationResponse.totalElements || 0);
      }
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to load products', e.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, page, toastError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle Create Product
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryName || formData.unitPrice <= 0) {
      toastError('Validation error', 'Please fill in all required product attributes.');
      return;
    }

    setActionLoading(true);
    try {
      await productsApi.create(formData);
      success('Product Added', `${formData.name} is now available in inventory.`);
      setIsCreateOpen(false);
      setFormData({ name: '', categoryName: '', unitPrice: 0, stockQuantity: 0, description: '' });
      loadProducts();
      loadCategories();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to create product', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Product
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;

    setActionLoading(true);
    try {
      await productsApi.update(activeProduct.id, formData);
      success('Product Updated', `${formData.name} was successfully updated.`);
      setIsEditOpen(false);
      loadProducts();
      loadCategories();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to update product', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Product
  const handleDelete = async () => {
    if (!activeProduct) return;
    setActionLoading(true);
    try {
      await productsApi.delete(activeProduct.id);
      success('Product Deleted', `${activeProduct.name} has been removed.`);
      setIsDeleteOpen(false);
      loadProducts();
      loadCategories();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to delete product', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      categoryName: categories[0]?.name || '',
      unitPrice: 10.0,
      stockQuantity: 10,
      description: '',
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (p: ProductDto) => {
    setActiveProduct(p);
    setFormData({
      name: p.name,
      categoryName: p.categoryName,
      unitPrice: p.unitPrice,
      stockQuantity: p.stockQuantity,
      description: p.description,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (p: ProductDto) => {
    setActiveProduct(p);
    setIsDeleteOpen(true);
  };

  const openDetailModal = async (p: ProductDto) => {
    try {
      const full = await productsApi.getById(p.id);
      setActiveProduct(full.product || p);
    } catch {
      setActiveProduct(p);
    }
    setIsDetailOpen(true);
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Product Inventory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Catalog of {totalElements} items across {categories.length} categories
          </p>
        </div>

        {isAdmin && (
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div className="input-with-icon" style={{ flex: '1 1 280px' }}>
            <Search size={16} className="input-icon-left" />
            <input
              type="text"
              className="form-input"
              placeholder="Search products by title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 1 220px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.productSize || 0})
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setPage(0);
              }}
              className="btn btn-ghost btn-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name & Description</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Sales Usage</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No products matched your query.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        maxWidth: '340px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {p.description}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.categoryName}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.unitPrice)}</td>
                    <td>
                      <StockBadge quantity={p.stockQuantity} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {p.transactionLinesCount || 0} orders
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {/* Detail Inspector */}
                        <button
                          onClick={() => openDetailModal(p)}
                          className="btn btn-ghost btn-icon"
                          title="View Details"
                          style={{ padding: '6px' }}
                        >
                          <Eye size={15} />
                        </button>

                        {/* Quick POS Sale link */}
                        <Link
                          href={`/transactions/new?productId=${p.id}&type=Sale`}
                          className="btn btn-ghost btn-icon"
                          title="Sell this item"
                          style={{ padding: '6px', color: 'var(--success)' }}
                        >
                          <ShoppingCart size={15} />
                        </Link>

                        {/* Admin Controls */}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(p)}
                              className="btn btn-ghost btn-icon"
                              title="Edit Product"
                              style={{ padding: '6px', color: 'var(--primary)' }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(p)}
                              className="btn btn-ghost btn-icon"
                              title="Delete Product"
                              style={{ padding: '6px', color: 'var(--danger)' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
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
            Showing Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} items total)
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

      {/* CREATE PRODUCT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Inventory Product"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 4K Ultra HD Camera"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={formData.categoryName}
              onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              required
            >
              <option value="">Select a Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={formData.unitPrice || ''}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Stock Quantity</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea
              rows={3}
              className="form-textarea"
              placeholder="Features, technical specs, warranty information..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Inventory Product"
      >
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={formData.categoryName}
              onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={formData.unitPrice || ''}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Product Deletion"
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
            Delete {activeProduct?.name}?
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            This will permanently remove the item from active inventory records. This action cannot be undone.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(false)}
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
            {actionLoading ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      </Modal>

      {/* PRODUCT DETAIL MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Product Information"
      >
        {activeProduct && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <span className="badge badge-neutral" style={{ marginBottom: '0.5rem' }}>
                {activeProduct.categoryName}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeProduct.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                {activeProduct.description}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              background: 'var(--bg-surface)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit Price</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatCurrency(activeProduct.unitPrice)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stock Status</div>
                <div style={{ marginTop: '0.25rem' }}>
                  <StockBadge quantity={activeProduct.stockQuantity} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical Orders</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {activeProduct.transactionLinesCount || 0} order items
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Item ID</div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {activeProduct.id}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Link
                href={`/transactions/new?productId=${activeProduct.id}&type=Sale`}
                className="btn btn-primary"
              >
                <ShoppingCart size={16} />
                <span>Create Sale</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Shell>
  );
}
