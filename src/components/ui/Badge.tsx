'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: React.ReactNode;
}

export default function Badge({
  children,
  variant = 'neutral',
  icon,
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export function StockBadge({ quantity }: { quantity: number }) {
  if (quantity <= 0) {
    return <Badge variant="danger">Out of Stock</Badge>;
  }
  if (quantity <= 5) {
    return <Badge variant="warning">Low ({quantity})</Badge>;
  }
  return <Badge variant="success">In Stock ({quantity})</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const isAdm = role?.toUpperCase() === 'ADMIN';
  return (
    <Badge variant={isAdm ? 'info' : 'neutral'}>
      {isAdm ? 'Administrator' : 'Standard User'}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const isSale = type?.toLowerCase() === 'sale';
  return (
    <Badge variant={isSale ? 'success' : 'info'}>
      {isSale ? 'Sale' : 'Purchase / Restock'}
    </Badge>
  );
}

export function SaleBadge({ saleType }: { saleType: string }) {
  const isMpesa = saleType?.toUpperCase() === 'MPESA';
  return (
    <Badge variant={isMpesa ? 'warning' : 'neutral'}>
      {isMpesa ? 'M-PESA' : 'CASH'}
    </Badge>
  );
}
