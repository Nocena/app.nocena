import React, { useState } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from './login';
import RegisterPage from './register';

function MyApp({ Component, pageProps }: any) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  const showRegisterPage = () => {
    setShowLogin(false);
    router.push('/register');
  };

  const showLoginPage = () => {
    setShowLogin(true);
    router.push('/login');
  };

  const handleLogin = (userData: any) => {
    // Mocked login flow with localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setShowLogin(false);
    router.push('/'); // Redirect to home
  };

  const handleRegister = (userData: any) => {
    setUser(userData);
    router.push('/login'); // Redirect to login after registration
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowLogin(true);
    router.push('/login');
  };

  return (
    <>
      {user ? (
        <AppLayout user={user || 'Guest'} handleLogout={handleLogout}>
          <Component {...pageProps} />
        </AppLayout>
      ) : showLogin ? (
        <LoginPage showRegisterPage={showRegisterPage} handleLogin={handleLogin} />
      ) : (
        <RegisterPage showLoginPage={showLoginPage} handleRegister={handleRegister} />
      )}
    </>
  );
}

export default MyApp;