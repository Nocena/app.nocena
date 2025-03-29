// pages/login.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getUserFromDgraph } from '../lib/api/dgraph';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../lib/utils/security';
import { verifyPassword } from '../lib/utils/passwordUtils';
import Image from 'next/image';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedUsername || !sanitizedPassword) {
      setError('Both username and password are required.');
      setLoading(false);
      return;
    }

    try {
      // Get user data from backend
      const userData = await getUserFromDgraph(sanitizedUsername);

      if (!userData) {
        setError('No account found with this username.');
        setLoading(false);
        return;
      }

      console.log('Found user:', userData); // Debug log

      // Securely verify password
      const isPasswordValid = await verifyPassword(sanitizedPassword, userData.passwordHash);

      if (!isPasswordValid) {
        setError('Invalid password. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Password verified successfully'); // Debug log

      // Format followers and following to ensure they're arrays
      // This helps with the types in the AuthContext
      const formattedUser = {
        ...userData,
        followers: Array.isArray(userData.followers) ? userData.followers : [],
        following: Array.isArray(userData.following) ? userData.following : [],
      };

      // Login successful
      await login(formattedUser);
      router.push('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const redirectToRegister = () => {
    router.push('/register');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-nocenaBg text-white">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-64 mb-20 relative">
            <Image src="/logo/eyes.png" alt="Nocena Logo" width={256} height={256} priority />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-300">Login to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="mb-3">
            <label htmlFor="username" className="block mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="block mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="mb-3">
            <PrimaryButton
              text={loading ? 'Logging in...' : 'Login'}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            />
          </div>
        </form>

        <div className="text-center">
          <p>
            Don't have an account?{' '}
            <button onClick={redirectToRegister} className="text-nocenaBlue cursor-pointer">
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
