import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { registerUser } from '../utils/api/dgraph';
import { createPolygonWallet } from '../utils/api/polygon';
import PrimaryButton from '../components/ui/PrimaryButton';
import { User, useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../utils/security';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const hashPassword = (password: string) => {
    return btoa(password); // Placeholder: replace with secure hashing in production
  };

  const handleRegisterClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Sanitize user inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedUsername || !sanitizedEmail || !sanitizedPassword) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    const passwordHash = hashPassword(sanitizedPassword);

    try {
      const wallet = createPolygonWallet();

      const userPayload = {
        username: sanitizedUsername,
        email: sanitizedEmail,
        bio: '',
        wallet: wallet.address,
        passwordHash,
        profilePicture: '/images/profile.png',
        earnedTokens: 0,
        dailyChallenge: '0'.repeat(365),
        weeklyChallenge: '0'.repeat(52),
        monthlyChallenge: '0'.repeat(12),
      };

      const addedUser = await registerUser(
        userPayload.username,
        userPayload.email,
        userPayload.passwordHash,
        userPayload.profilePicture,
        userPayload.wallet,
        userPayload.dailyChallenge,
        userPayload.weeklyChallenge,
        userPayload.monthlyChallenge
      );

      if (addedUser) {
        const userData: User = {
          id: addedUser.id,
          username: userPayload.username,
          email: userPayload.email,
          wallet: userPayload.wallet,
          bio: userPayload.bio,
          profilePicture: userPayload.profilePicture,
          earnedTokens: userPayload.earnedTokens,
          dailyChallenge: userPayload.dailyChallenge,
          weeklyChallenge: userPayload.weeklyChallenge,
          monthlyChallenge: userPayload.monthlyChallenge,
          followers: [],
          following: [],
        };

        await login(userData);
        router.push('/');
      } else {
        setError('Failed to register. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowLoginPage = () => {
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-nocenaBg text-white">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-4">
          <img src="/logo/logo.png" alt="Logo" className="max-w-full h-auto mx-auto" />
        </div>
        <form onSubmit={handleRegisterClick} className="space-y-4">
          <div className="mb-3">
            <label htmlFor="username" className="block mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="block mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
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

          <div className="mb-3">
            <PrimaryButton text={loading ? 'Registering...' : 'Register'} onPressed={handleRegisterClick} />
          </div>

          <div className="text-center">
            <p>
              Already have an account?{' '}
              <a onClick={handleShowLoginPage} className="text-nocenaBlue cursor-pointer">
                Login
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
