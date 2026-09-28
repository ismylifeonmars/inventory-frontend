'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  Package,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import Shell from '@/components/layout/Shell';
import Modal from '@/components/ui/Modal';
import { categoriesApi } from '@/lib/api';
import { CategoryDto, CategoryRequest } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function CategoriesPage() {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryDto | null>(null);

  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.getAll();
      if (res.categories) {
        setCategories(res.categories);
      }
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to load categories', e.message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toastError('Validation error', 'Category name cannot be empty');
      return;
    }

    setActionLoading(true);
    try {
      await categoriesApi.create({ name: categoryName.trim() });
      success('Category Created', `Category "${categoryName}" has been established.`);
      setIsCreateOpen(false);
      setCategoryName('');
      loadCategories();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to create category', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory || !categoryName.trim()) return;

    setActionLoading(true);
    try {
      await categoriesApi.update(activeCategory.id, { name: categoryName.trim() });
      success('Category Updated', `Category updated to "${categoryName}".`);
      setIsEditOpen(false);
      loadCategories();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to update category', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!activeCategory) return;

    setActionLoading(true);
    try {
      await categoriesApi.delete(activeCategory.id);
      success('Category Deleted', `Category "${activeCategory.name}" removed.`);
      setIsDeleteOpen(false);
      loadCategories();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to delete category', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (cat: CategoryDto) => {
    setActiveCategory(cat);
    setCategoryName(cat.name);
    setIsEditOpen(true);
  };

  const openDeleteModal = (cat: CategoryDto) => {
    setActiveCategory(cat);
    setIsDeleteOpen(true);
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
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Product Categories</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Organize warehouse products into logical departments and collections
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setCategoryName('');
              setIsCreateOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Create New Category</span>
          </button>
        )}
      </div>

      {/* Category Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <FolderOpen size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3>No categories found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Add your first category to begin grouping inventory items.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {categories.map((cat) => (
            <div key={cat.id} className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-glass-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <Layers size={20} />
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => openEditModal(cat)}
                        className="btn btn-ghost btn-icon"
                        title="Edit Category"
                        style={{ padding: '6px', color: 'var(--text-secondary)' }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(cat)}
                        className="btn btn-ghost btn-icon"
                        title="Delete Category"
                        style={{ padding: '6px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {cat.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  <Package size={14} />
                  <span>{cat.productSize} active products listed</span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <Link
                  href={`/products`}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span>Browse Products</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Product Category"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Peripherals, Machinery, Audio"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              autoFocus
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
              {actionLoading ? 'Saving...' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT CATEGORY MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Category Name"
      >
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              autoFocus
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
              {actionLoading ? 'Saving...' : 'Update Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Category"
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
            Delete {activeCategory?.name}?
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Are you sure you want to delete this category? Make sure no critical products are orphaned.
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
            {actionLoading ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </Modal>
    </Shell>
  );
}
