import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getUserFromDgraph, verifyPassword } from '../lib/api/dgraph';
import PrimaryButton from '../components/ui/PrimaryButton';
import { User, useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../lib/utils/security';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Sanitize user inputs
    const sanitizedIdentifier = sanitizeInput(identifier);
    const sanitizedPassword = sanitizeInput(password);

    try {
      const user = await getUserFromDgraph(sanitizedIdentifier);

      if (!user) {
        setError('No user found with the provided username or email.');
        setShowForgotPassword(true);
        return;
      }

      const isPasswordValid = verifyPassword(sanitizedPassword, user.passwordHash);

      if (isPasswordValid) {
        const userData: User = {
          id: user.id,
          username: user.username,
          email: user.email,
          wallet: user.wallet,
          bio: user.bio,
          profilePicture: user.profilePicture,
          earnedTokens: user.earnedTokens,
          dailyChallenge: user.dailyChallenge,
          weeklyChallenge: user.weeklyChallenge,
          monthlyChallenge: user.monthlyChallenge,
          followers: user.followers || [],
          following: user.following || [],
        };

        await login(userData);
        router.push('/home');
      } else {
        setError('Incorrect password. Please try again.');
        setShowForgotPassword(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to login. Please try again later.');
    }
  };

  const handleShowRegisterPage = () => {
    router.push('/register');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-nocenaBg text-white">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-4">
          <img src="/logo/LogoDark.png" alt="Logo" className="max-w-full h-auto mx-auto" />
        </div>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="mb-3">
            <label htmlFor="identifier" className="block mb-1">
              Username or Email
            </label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter username or email"
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
              placeholder="Enter password"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {showForgotPassword && (
            <div className="text-right mb-3">
              <a href="/forgot-password" className="text-indigo-500 cursor-pointer">
                Forgot password?
              </a>
            </div>
          )}

          <div className="mb-3">
            <PrimaryButton text="Login" onClick={handleSignIn} />
          </div>

          <div className="text-center">
            <p>
              Don’t have an account?{' '}
              <a onClick={handleShowRegisterPage} className="text-nocenaBlue cursor-pointer">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
