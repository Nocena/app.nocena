// pages/login.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getUserFromDgraph } from '../lib/api/dgraph';
import { useAuth, User } from '../contexts/AuthContext';
import AuthenticationLayout from '../components/layout/AuthenticationLayout';
import { ConnectKitButton } from 'connectkit';
import { AccountType } from '../lib/types';
import { useAccount } from 'wagmi';
import { fetchAvailableLensAccounts } from '@utils/lensUtils';
import { useLensAuth } from '../contexts/LensAuthProvider';
import LoadingSpinner from '@components/ui/LoadingSpinner';

type FormValues = {
  username: string;
  password: string;
};

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountType | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<{
    account: AccountType,
    userData: any,
  } []>([]);
  const {
    address: walletAddress,
  } = useAccount()
  const {authenticate, isAuthenticating, client} = useLensAuth()

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (walletAddress) {
      setIsLoadingAccounts(true)
      fetchAvailableLensAccounts(client, walletAddress).then(async (accounts) => {
        const accountsWithUserData = await Promise.all(
          accounts.map(async (account) => {
            const userData = await getUserFromDgraph(account.localName);
            return userData ? { account, userData } : null;
          })
        );

        const validAccounts = accountsWithUserData.filter(item => !!item);
        setAvailableAccounts(validAccounts);
        setIsLoadingAccounts(false);
      }).catch(err => {
        console.log('error fetching accounts', err)
        setIsLoadingAccounts(false)
      })
    }
  }, [walletAddress])

  const handleSelectAccount = async (account: AccountType, userData: any) => {
    setSelectedAccount(account)
    await authenticate(account.accountAddress, walletAddress!)

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
  };

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

  return (
    <AuthenticationLayout title="Welcome player" subtitle="Login with your account to start the game">
      <div className="w-full space-y-4 mb-6">
        {
          isLoadingAccounts ? (
            <div className="text-center py-10">
              <LoadingSpinner size="md" />
              <p className="mt-2 text-gray-300">Loading Accounts...</p>
            </div>
          ) : (
            !!walletAddress && availableAccounts.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {availableAccounts.map(({account, userData}) => (
                  <div
                    key={account.accountAddress}
                    className="p-4 border rounded-xl cursor-pointer hover:bg-pink-900 hover:-translate-y-0.5 transition-all"
                    onClick={() => handleSelectAccount(account, userData)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center w-full">
                        <img
                          className="w-10 h-10 rounded-full mr-4"
                          src={account.avatar}
                          alt={account.localName}
                        />
                        <div>
                          <p className="font-bold">{account.displayName}</p>
                          <p className="text-sm text-gray-500">@{account.localName}</p>
                        </div>
                      </div>
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAccount(account, userData);
                        }}
                        disabled={selectedAccount === account && isAuthenticating}
                      >
                        {selectedAccount === account && isAuthenticating ? 'Loading...' : 'Use'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <p>
                  No Accounts Available
                </p>
              </div>
            )
          )
        }

        <div className="flex justify-center mb-3 w-full">
          <ConnectKitButton label="login" mode="dark" />
        </div>
      </div>

      <div className="text-center">
        <p>
        If you are new here{' '}
          <Link href="/register" className="text-nocenaPink cursor-pointer">
            enter invite code
          </Link>
        </p>
      </div>
    </AuthenticationLayout>
  );
};

export default LoginPage;
