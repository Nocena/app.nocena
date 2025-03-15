import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { useAuth, AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from './login';
import RegisterPage from './register';
import { default as IOSPWAPrompt } from '../components/PWA/iOSPWAPrompt';
import { default as AndroidPWAPrompt } from '../components/PWA/AndroidPWAPrompt';

function MyAppContent({ Component, pageProps }: AppProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isIOS, setIsIOS] = React.useState(false);
  const [isAndroid, setIsAndroid] = React.useState(false);

  useEffect(() => {
    // Detect device type on client side only
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsIOS(/ipad|iphone|ipod/.test(ua) && !(window as any).MSStream);
      setIsAndroid(/android/.test(ua));
    }
    
    // Redirect to login if user is not authenticated and not already on login or register page
    if (!loading && !user && !['/login', '/register'].includes(router.pathname)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  // Render platform-specific prompts
  const renderPWAPrompt = () => {
    if (isIOS) {
      return <IOSPWAPrompt />;
    }
    if (isAndroid) {
      return <AndroidPWAPrompt />;
    }
    return null;
  };

  if (!user) {
    // Show login or register page based on current route
    return (
      <>
        <Head>
          <title>Nocena</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no" />
          <meta name="theme-color" content="#000000" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
        </Head>
        {router.pathname === '/register' ? <RegisterPage /> : <LoginPage />}
        {renderPWAPrompt()}
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Nocena</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <AppLayout handleLogout={logout}>
        <Component {...pageProps} />
      </AppLayout>
      {renderPWAPrompt()}
    </>
  );
}

function MyApp(props: AppProps) {
  return (
    <AuthProvider>
      <MyAppContent {...props} />
    </AuthProvider>
  );
}

export default MyApp;