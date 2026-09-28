'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Download, WifiOff, X, Sparkles, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  installApp: () => Promise<void>;
  dismissInstallPrompt: () => void;
  showInstallBanner: boolean;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);

  useEffect(() => {
    // 1. Detect standalone (already installed) mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    // 2. Network connectivity monitoring
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Check if user previously dismissed in this session
      const dismissed = sessionStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Track installed event
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('PWA was installed successfully');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);

            // Listen for waiting SW updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setSwUpdateAvailable(true);
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('Service Worker registration failed:', err);
          });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('Error invoking PWA install:', err);
    }
  }, [deferredPrompt]);

  const dismissInstallPrompt = useCallback(() => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  }, []);

  const reloadForUpdate = () => {
    window.location.reload();
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isStandalone,
        isOnline,
        installApp,
        dismissInstallPrompt,
        showInstallBanner,
      }}
    >
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <aside
          aria-label="Offline status banner"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 9999,
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '0.45rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <WifiOff size={15} />
          <span>You are currently offline. Viewing locally cached catalog & ledger.</span>
        </aside>
      )}

      {/* SW Update Ready Toast */}
      {swUpdateAvailable && (
        <aside
          aria-label="App update available"
          style={{
            position: 'fixed',
            bottom: '5rem',
            right: '1rem',
            zIndex: 9998,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: '360px',
          }}
        >
          <Sparkles size={18} color="var(--primary)" />
          <div style={{ flex: 1, fontSize: '0.8125rem' }}>
            <div style={{ fontWeight: 600 }}>App Update Available</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Reload to use the latest version</div>
          </div>
          <button
            onClick={reloadForUpdate}
            className="btn btn-primary btn-sm"
          >
            Update
          </button>
        </aside>
      )}

      {/* Mobile Install App Banner */}
      {showInstallBanner && !isStandalone && (
        <aside
          aria-label="Install mobile application"
          className="pwa-install-banner"
          style={{
            position: 'fixed',
            bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
            left: '16px',
            right: '16px',
            maxWidth: '440px',
            margin: '0 auto',
            zIndex: 9000,
            background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.98))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 0 12px var(--primary-glow)',
            }}
          >
            <Smartphone size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>
              Install Laine Beauty App
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Fast offline access & full-screen mobile POS
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={installApp}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.5rem 0.85rem' }}
            >
              <Download size={14} />
              <span>Install</span>
            </button>
            <button
              onClick={dismissInstallPrompt}
              className="btn btn-ghost btn-icon"
              title="Dismiss"
              style={{ padding: '6px', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        </aside>
      )}

      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
}
