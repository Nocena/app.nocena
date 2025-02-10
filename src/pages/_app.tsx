import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth, AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from './login';
import RegisterPage from './register';

function MyAppContent({ Component, pageProps }: any) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if user is not authenticated and not already on login or register page
    if (!loading && !user && !['/login', '/register'].includes(router.pathname)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <p>Loading...</p>; // Show a loading state while user data is being loaded
  }

  if (!user) {
    // Show login or register page based on current route
    return router.pathname === '/register' ? (
      <RegisterPage />
    ) : (
      <LoginPage />
    );
  }

  return (
    <AppLayout user={user} handleLogout={logout}>
      <Component {...pageProps} />
    </AppLayout>
  );
}

function MyApp(props: any) {
  return (
    <AuthProvider>
      <MyAppContent {...props} />
    </AuthProvider>
  );
}

export default MyApp;
