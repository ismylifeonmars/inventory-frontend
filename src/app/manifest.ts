import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Laine Beauty - Stock & Ledger',
    short_name: 'Laine Beauty',
    description: 'Enterprise Inventory Control, Real-Time Analytics & Point of Sale Management',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#0b0f19',
    theme_color: '#0b0f19',
    orientation: 'portrait-primary',
    categories: ['business', 'finance', 'productivity', 'shopping'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Point of Sale (New Sale)',
        short_name: 'POS',
        description: 'Open point of sale checkout counter',
        url: '/transactions/new',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Product Inventory',
        short_name: 'Products',
        description: 'View and manage product catalog',
        url: '/products',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Transaction Ledger',
        short_name: 'Transactions',
        description: 'View sales and purchase logs',
        url: '/transactions',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
