// pages/login.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { NocenaInput, PasswordInput } from '@components/form';
import { getUserFromDgraph } from '../lib/api/dgraph';
import PrimaryButton from '../components/ui/PrimaryButton';
import { User, useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../lib/utils/security';
import { verifyPassword } from '../lib/utils/passwordUtils';
import AuthenticationLayout from '../components/layout/AuthenticationLayout';

type FormValues = {
  username: string;
  password: string;
};

const LoginPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const onSubmitSignIn = async (values: FormValues) => {
    setError('');
    setLoading(true);

    try {
      // Get user data from backend
      const userData = await getUserFromDgraph(values.username);

      if (!userData) {
        setError('No account found with this username.');
        setLoading(false);
        return;
      }

      console.log('Found user:', userData); // Debug log

      // Securely verify password
      const isPasswordValid = await verifyPassword(values.password, userData.passwordHash);

      if (!isPasswordValid) {
        setError('Invalid password. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Password verified successfully'); // Debug log

      // Format followers and following to ensure they're arrays
      // This helps with the types in the AuthContext
      const formattedUser: User = {
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

  const schema = yup.object().shape({
    username: yup
      .string()
      .transform((value) => sanitizeInput(value))
      .required('Username is required'),
    password: yup
      .string()
      .transform((value) => sanitizeInput(value))
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  return (
    <AuthenticationLayout title="Welcome Back" subtitle="Login to your account to continue">
      <form onSubmit={handleSubmit(onSubmitSignIn)} className="w-full space-y-4 mb-6">
        <NocenaInput control={control} name="username" label="Username" placeholder="Enter your username" />

        <PasswordInput control={control} name="password" label="Password" placeholder="Enter your password" />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="mb-3">
          <PrimaryButton text="Login" type="submit" disabled={loading} className="w-full" />
        </div>
      </form>

      <div className="text-center">
        <p>
          Don't have an account?{' '}
          <Link href="/register" className="text-nocena-blue cursor-pointer">
            Create Account
          </Link>
        </p>
      </div>
    </AuthenticationLayout>
  );
};

export default LoginPage;
