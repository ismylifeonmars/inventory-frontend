'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  ShieldCheck,
  User as UserIcon,
  Receipt,
} from 'lucide-react';
import Shell from '@/components/layout/Shell';
import Modal from '@/components/ui/Modal';
import { RoleBadge } from '@/components/ui/Badge';
import { usersApi } from '@/lib/api';
import { UpdateUserRequest, UserDto } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editUser, setEditUser] = useState<UserDto | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserDto | null>(null);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll();
      if (res.users) {
        setUsers(res.users);
      }
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to load user directory', e.message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  const openEditModal = (u: UserDto) => {
    setEditUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phoneNumber: u.phoneNumber,
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setActionLoading(true);
    try {
      await usersApi.update(editUser.id, formData);
      success('User Updated', `Details for ${formData.name} updated successfully.`);
      setEditUser(null);
      loadUsers();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to update user', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    setActionLoading(true);
    try {
      await usersApi.delete(deleteUser.id);
      success('User Deleted', `${deleteUser.name} has been removed from system.`);
      setDeleteUser(null);
      loadUsers();
    } catch (err: unknown) {
      const e = err as Error;
      toastError('Failed to delete user', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Shell>
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <ShieldCheck size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
          <h3>Access Restricted</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Only administrators are authorized to access the system user directory.
          </p>
        </div>
      </Shell>
    );
  }

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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>System User Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage staff accounts, administrative roles, and system credentials
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Role</th>
                <th>Phone Number</th>
                <th>Registered Date</th>
                <th>Transactions Processed</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Loading staff profiles...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No registered users located.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--primary-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                        }}>
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.name} {currentUser?.id === u.id && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
                        <Phone size={13} color="var(--text-muted)" />
                        <span>{u.phoneNumber || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
                        <Receipt size={13} color="var(--text-muted)" />
                        <span>{u.transactionsCount || 0} orders</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-ghost btn-icon"
                          title="Edit User"
                          style={{ padding: '6px', color: 'var(--primary)' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        {currentUser?.id !== u.id && (
                          <button
                            onClick={() => setDeleteUser(u)}
                            className="btn btn-ghost btn-icon"
                            title="Delete User"
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
      </div>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Update User Profile"
      >
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setEditUser(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="Delete User Profile"
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
            Delete {deleteUser?.name}?
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            This account will lose access to the system. Existing transaction records will be preserved for auditing.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setDeleteUser(null)}
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
