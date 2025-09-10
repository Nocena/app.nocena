// pages/_app.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ThirdwebProvider } from 'thirdweb/react';
import { useAuth, AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';
import AppLayout from '../components/layout/AppLayout';
import SpecialPageLayout from '../components/layout/SpecialPageLayout';
import LoginPage from './login';
import RegisterPage from './register';
import { default as IOSPWAPrompt } from '../components/PWA/iOSPWAPrompt';
import { default as AndroidPWAPrompt } from '../components/PWA/AndroidPWAPrompt';
import UpdateNotification from '../components/PWA/UpdateNotification';
import CacheDebugger from '../components/PWA/CacheDebugger';
import { BackgroundTaskProvider, useBackgroundTasks } from '../contexts/BackgroundTaskContext';
import { permissionManager } from '../lib/utils/permissionManager';

// Simple loading indicator component for route changes
const LoadingIndicator = () => (
  <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
    <div className="h-full bg-blue-500 animate-progressBar"></div>
  </div>
);

function MyAppContent({ Component, pageProps }: AppProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Safe pathname access
  const currentPathname = router?.pathname || '';

  // Initialize permission manager early
  useEffect(() => {
    const initPermissions = async () => {
      try {
        await permissionManager.initialize();
        console.log('Permission manager initialized successfully');
      } catch (error) {
        console.error('Failed to initialize permission manager:', error);
      }
    };

    initPermissions();
  }, []);

  // Handle service worker messages for permission management
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED' && event.data?.preservePermissions) {
        console.log('Service worker updated, refreshing permissions...');
        // Small delay to allow new SW to settle
        setTimeout(() => {
          permissionManager.forceRefresh();
        }, 1000);
      }

      if (event.data?.type === 'REFRESH_PERMISSIONS') {
        console.log('Service worker requested permission refresh');
        permissionManager.forceRefresh();
      }

      if (event.data?.type === 'PERIODIC_PERMISSION_CHECK') {
        // Silent refresh for periodic checks
        permissionManager.forceRefresh();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // Handle route change loading indicator
  useEffect(() => {
    if (!router?.events) return; // Safety check

    const handleStart = () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      const timeout = setTimeout(() => setIsRouteChanging(true), 100);
      setLoadingTimeout(timeout);
    };

    const handleComplete = () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      setIsRouteChanging(false);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router, loadingTimeout]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsIOS(/ipad|iphone|ipod/.test(ua) && !(window as any).MSStream);
      setIsAndroid(/android/.test(ua));
    }

    // Safety check for router and pathname
    if (!router?.pathname) return;

    const publicRoutes = ['/login', '/register', '/admin/seed-invites', '/test-admin'];
    const isPublicRoute =
      publicRoutes.some((route) => currentPathname.startsWith(route)) || currentPathname.startsWith('/admin/');

    if (!loading && !user && !isPublicRoute) {
      router.replace('/login');
    }
  }, [user, loading, router, currentPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        window.dispatchEvent(new Event('nocena_app_background'));
      } else if (document.visibilityState === 'visible') {
        window.dispatchEvent(new Event('nocena_app_foreground'));
        // Refresh permissions when app comes back to foreground
        setTimeout(() => {
          permissionManager.forceRefresh();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Early return if router is not ready
  if (!router?.pathname) {
    return (
      <>
        <Head>
          <title>Nocena</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no"
          />
          <meta name="theme-color" content="#000000" />
        </Head>
        <div className="flex h-screen w-screen items-center justify-center bg-[#121212]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Nocena</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no"
          />
          <meta name="theme-color" content="#000000" />
        </Head>
        <div className="flex h-screen w-screen items-center justify-center bg-[#121212]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </>
    );
  }

  const renderPWAPrompt = () => {
    if (isIOS) {
      return <IOSPWAPrompt />;
    }
    if (isAndroid) {
      return <AndroidPWAPrompt />;
    }
    return null;
  };

  // Define layout types
  const noLayoutPages = ['/login', '/register'];
  const specialPages = ['/browsing', '/completing', '/createchallenge'];
  const isAdminPage = currentPathname.startsWith('/admin/') || currentPathname === '/test-admin';

  // Determine layout type
  const isSpecialPage = specialPages.includes(currentPathname);
  const shouldUseAppLayout = !noLayoutPages.includes(currentPathname) && !isAdminPage && !isSpecialPage;
  const shouldUseSpecialLayout = isSpecialPage && user;

  console.log('Layout decision:', {
    currentPathname,
    isSpecialPage,
    shouldUseAppLayout,
    shouldUseSpecialLayout,
    user: !!user,
  });

  // Handle public routes (login, register, admin)
  if (
    !user &&
    (currentPathname === '/login' ||
      currentPathname === '/register' ||
      currentPathname.startsWith('/admin/') ||
      currentPathname === '/test-admin')
  ) {
    return (
      <>
        <Head>
          <title>Nocena</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no"
          />
          <meta name="theme-color" content="#000000" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
        </Head>
        {isRouteChanging && <LoadingIndicator />}
        {currentPathname === '/register' ? (
          <RegisterPage />
        ) : currentPathname === '/login' ? (
          <LoginPage />
        ) : (
          <Component {...pageProps} />
        )}
        {renderPWAPrompt()}
        <UpdateNotification />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Head>
          <title>Nocena</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no"
          />
          <meta name="theme-color" content="#000000" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
        </Head>
        {isRouteChanging && <LoadingIndicator />}
        <div className="flex h-screen w-screen items-center justify-center bg-[#121212]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
        {renderPWAPrompt()}
        <UpdateNotification />
      </>
    );
  }

  // Get page title for special pages
  const getSpecialPageTitle = () => {
    switch (currentPathname) {
      case '/completing':
        return 'Complete Challenge';
      case '/createchallenge':
        return 'Create Challenge';
      case '/browsing':
        return 'Browse';
      default:
        return 'Nocena';
    }
  };

  return (
    <>
      <Head>
        <title>Nocena</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no"
        />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      {isRouteChanging && <LoadingIndicator />}

      {shouldUseSpecialLayout ? (
        <SpecialPageLayout showHeader={currentPathname !== '/completing'}>
          <Component {...pageProps} />
        </SpecialPageLayout>
      ) : shouldUseAppLayout ? (
        <AppLayout handleLogout={logout}>
          <Component {...pageProps} />
        </AppLayout>
      ) : (
        <Component {...pageProps} />
      )}

      {renderPWAPrompt()}
      <UpdateNotification />
      <CacheDebugger />
    </>
  );
}

function MyApp(props: AppProps) {
  return (
    <ThirdwebProvider>
      <AuthProvider>
        <BackgroundTaskProvider>
          <MyAppContent {...props} />
        </BackgroundTaskProvider>
      </AuthProvider>
    </ThirdwebProvider>
  );
}

export default MyApp;
