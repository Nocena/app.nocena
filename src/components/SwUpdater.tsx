'use client';
import { useEffect, useRef, useState } from 'react';

const CURRENT = process.env.NEXT_PUBLIC_APP_VERSION!;

export default function SwUpdater() {
  const [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);
  const checking = useRef(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // When the new SW activates, reload to get fresh assets
        window.location.reload();
      });

      // watch for updates found by the browser
      navigator.serviceWorker.addEventListener('message', (e) => {
        // optional: handle version messages here
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (checking.current) return;
      checking.current = true;
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        const data = await res.json();
        if (data.version && data.version !== CURRENT) {
          const reg = await navigator.serviceWorker.getRegistration();
          // Trigger update check
          await reg?.update();

          // If there's a waiting SW, we can show the prompt
          if (reg?.waiting) {
            setUpdateReady(reg.waiting);
          } else if (reg?.installing) {
            reg.installing.addEventListener('statechange', () => {
              if (reg.waiting) setUpdateReady(reg.waiting);
            });
          }
        }
      } catch (_) {
        // ignore
      } finally {
        checking.current = false;
      }
    }, 60_000); // check every minute (tune as you like)
    return () => clearInterval(interval);
  }, []);

  const confirmUpdate = () => {
    updateReady?.postMessage({ type: 'SKIP_WAITING' });
  };

  return updateReady ? (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        padding: 12,
        border: '1px solid',
        borderRadius: 8,
        background: 'white',
        zIndex: 9999,
      }}
    >
      <strong>New version available</strong>
      <div style={{ marginTop: 8 }}>A newer build has been deployed. Reload to update.</div>
      <button style={{ marginTop: 8 }} onClick={confirmUpdate}>
        Update now
      </button>
    </div>
  ) : null;
}
