// pages/_app.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ThirdwebProvider } from 'thirdweb/react';
import { useAuth, AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from './login';
import RegisterPage from './register';
import { default as IOSPWAPrompt } from '../components/PWA/iOSPWAPrompt';
import { default as AndroidPWAPrompt } from '../components/PWA/AndroidPWAPrompt';
import { WalletProvider } from '../contexts/WalletProvider';
import { LensAuthProvider } from '../contexts/LensAuthProvider';

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

  const noLayoutPages = ['/login', '/register'];
  const isAdminPage = currentPathname.startsWith('/admin/') || currentPathname === '/test-admin';
  const shouldUseAppLayout = !noLayoutPages.includes(currentPathname) && !isAdminPage;

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
      </>
    );
  }

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

      {shouldUseAppLayout ? (
        <AppLayout handleLogout={logout}>
          <Component {...pageProps} />
        </AppLayout>
      ) : (
        <Component {...pageProps} />
      )}

      {renderPWAPrompt()}
    </>
  );
}

function MyApp(props: AppProps) {
  return (
    <ThirdwebProvider>
      <AuthProvider>
        <MyAppContent {...props} />
      </AuthProvider>
    </ThirdwebProvider>
  );
}

export default MyApp;
