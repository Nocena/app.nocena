// pages/login.tsx - Minimalist design aligned with other screens
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { getUserFromDgraph } from '../lib/api/dgraph';
import { User, useAuth } from '../contexts/AuthContext';
import AuthenticationLayout from '../components/layout/AuthenticationLayout';
import ThematicContainer from '../components/ui/ThematicContainer';
import { client, chain } from '../lib/thirdweb';
import { inAppWallet, createWallet } from 'thirdweb/wallets';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);

  const isProcessingLogin = useRef(false);
  const checkedAddresses = useRef<Set<string>>(new Set());

  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const account = useActiveAccount();

  const wallets = [
    inAppWallet({
      auth: {
        options: ['google', 'apple', 'facebook', 'discord', 'telegram', 'x', 'email', 'phone'],
      },
    }),
    createWallet('io.metamask'),
    createWallet('com.coinbase.wallet'),
    createWallet('walletConnect'),
    createWallet('com.trustwallet.app'),
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ User already authenticated, redirecting to home:', user.username);
      router.push('/home');
    }
  }, [isAuthenticated, user, router]);

  // Handle user login when account connects
  useEffect(() => {
    const handleUserLogin = async () => {
      const currentAddress = account?.address;

      if (!currentAddress) {
        setWalletChecked(false);
        setError('');
        return;
      }

      if (isAuthenticated) {
        return;
      }

      if (isProcessingLogin.current) {
        return;
      }

      if (checkedAddresses.current.has(currentAddress)) {
        return;
      }

      if (loading) {
        return;
      }

      isProcessingLogin.current = true;
      setLoading(true);
      setError('');
      setWalletChecked(false);

      try {
        const userData = await getUserFromDgraph(currentAddress);
        checkedAddresses.current.add(currentAddress);
        setWalletChecked(true);

        if (!userData) {
          setError('account_not_found');
          setLoading(false);
          isProcessingLogin.current = false;
          return;
        }

        // Format user data for context
        const formattedUser: User = {
          id: userData.id,
          username: userData.username,
          bio: userData.bio || '',
          wallet: userData.wallet,
          profilePicture: userData.profilePicture || '/images/profile.png',
          coverPhoto: userData.coverPhoto || '/images/cover.jpg',
          trailerVideo: userData.trailerVideo || '/trailer.mp4',
          earnedTokens: userData.earnedTokens || 0,
          earnedTokensDay: userData.earnedTokensDay || userData.earnedTokensToday || 0,
          earnedTokensWeek: userData.earnedTokensWeek || userData.earnedTokensThisWeek || 0,
          earnedTokensMonth: userData.earnedTokensMonth || userData.earnedTokensThisMonth || 0,
          personalField1Type: userData.personalField1Type || '',
          personalField1Value: userData.personalField1Value || '',
          personalField1Metadata: userData.personalField1Metadata || '',
          personalField2Type: userData.personalField2Type || '',
          personalField2Value: userData.personalField2Value || '',
          personalField2Metadata: userData.personalField2Metadata || '',
          personalField3Type: userData.personalField3Type || '',
          personalField3Value: userData.personalField3Value || '',
          personalField3Metadata: userData.personalField3Metadata || '',
          lensHandle: userData.lensHandle || '',
          lensAccountId: userData.lensAccountId || '',
          lensTransactionHash: userData.lensTransactionHash || '',
          lensMetadataUri: userData.lensMetadataUri || '',
          pushSubscription: userData.pushSubscription || '',
          dailyChallenge: userData.dailyChallenge || '0'.repeat(365),
          weeklyChallenge: userData.weeklyChallenge || '0'.repeat(52),
          monthlyChallenge: userData.monthlyChallenge || '0'.repeat(12),
          followers: Array.isArray(userData.followers) ? userData.followers : [],
          following: Array.isArray(userData.following) ? userData.following : [],
          notifications: Array.isArray(userData.notifications) ? userData.notifications : [],
          completedChallenges: Array.isArray(userData.completedChallenges) ? userData.completedChallenges : [],
          receivedPrivateChallenges: Array.isArray(userData.receivedPrivateChallenges)
            ? userData.receivedPrivateChallenges
            : [],
          createdPrivateChallenges: Array.isArray(userData.createdPrivateChallenges)
            ? userData.createdPrivateChallenges
            : [],
          createdPublicChallenges: Array.isArray(userData.createdPublicChallenges)
            ? userData.createdPublicChallenges
            : [],
          participatingPublicChallenges: Array.isArray(userData.participatingPublicChallenges)
            ? userData.participatingPublicChallenges
            : [],
        };

        await login(formattedUser);
        router.push('/home');
      } catch (err) {
        console.error('💥 Login error:', err);
        setError('network_error');
      } finally {
        setLoading(false);
        isProcessingLogin.current = false;
      }
    };

    handleUserLogin();
  }, [account?.address, login, router, isAuthenticated]);

  // Clear checked addresses when wallet disconnects
  useEffect(() => {
    if (!account?.address) {
      checkedAddresses.current.clear();
    }
  }, [account?.address]);

  const renderErrorState = () => {
    if (error === 'account_not_found') {
      return (
        <ThematicContainer
          color="nocenaPink"
          glassmorphic={true}
          asButton={false}
          rounded="2xl"
          className="p-6 text-center"
        >
          <h3 className="text-lg font-bold text-white mb-2">Account Not Found</h3>
          <p className="text-sm text-gray-300 mb-4">
            Your wallet is connected, but you need an invite code to create your profile.
          </p>
          <Link href="/register">
            <button className="text-nocenaPink hover:text-nocenaPink/80 font-medium">Go create profile →</button>
          </Link>
        </ThematicContainer>
      );
    }

    if (error === 'network_error') {
      return (
        <ThematicContainer
          color="nocenaPink"
          glassmorphic={true}
          asButton={false}
          rounded="2xl"
          className="p-6 text-center"
        >
          <h3 className="text-lg font-bold text-white mb-2">Network Error</h3>
          <p className="text-sm text-gray-300 mb-4">Failed to check your profile. Please try again.</p>
          <button
            onClick={() => {
              setError('');
              if (account?.address) {
                checkedAddresses.current.delete(account.address);
              }
            }}
            className="text-nocenaPink hover:text-nocenaPink/80 font-medium"
          >
            Retry Connection
          </button>
        </ThematicContainer>
      );
    }

    return null;
  };

  return (
    <AuthenticationLayout title="Welcome challenger" subtitle="It's time to lock in">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Main Login Card */}
        {!account ? (
          <ThematicContainer
            color="nocenaBlue"
            glassmorphic={true}
            asButton={false}
            rounded="2xl"
            className="p-8 text-center"
          >
            <h3 className="text-xl font-bold text-white mb-2">Connect Your Account</h3>
            <p className="text-sm text-gray-300 mb-6">Sign in with your wallet or social account</p>

            <ConnectButton
              client={client}
              chain={chain}
              wallets={wallets}
              theme="dark"
              connectModal={{
                title: 'Connect to Nocena',
                titleIcon: '/logo/LogoDark.png',
              }}
            />
          </ThematicContainer>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <ThematicContainer
                color="nocenaPink"
                glassmorphic={true}
                asButton={false}
                rounded="2xl"
                className="p-8 text-center"
              >
                <div className="w-16 h-16 border-4 border-nocenaPink/20 border-t-nocenaPink rounded-full animate-spin mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Checking Profile</h3>
                <p className="text-sm text-gray-300 mb-4">Verifying your account details...</p>
                <div className="bg-black/30 rounded-lg px-3 py-2 inline-block">
                  <span className="text-xs font-mono text-gray-400">
                    {account.address.slice(0, 8)}...{account.address.slice(-6)}
                  </span>
                </div>
              </ThematicContainer>
            ) : walletChecked && !error ? (
              <ThematicContainer
                color="nocenaPurple"
                glassmorphic={true}
                asButton={false}
                rounded="2xl"
                className="p-8 text-center"
              >
                <h3 className="text-xl font-bold text-white mb-2">Profile Connected</h3>
                <p className="text-sm text-gray-300 mb-4">Successfully verified your account</p>

                <div className="bg-black/30 rounded-lg px-3 py-2 inline-block mb-6">
                  <span className="text-xs font-mono text-gray-400">
                    {account.address.slice(0, 8)}...{account.address.slice(-6)}
                  </span>
                </div>

                <ConnectButton
                  client={client}
                  chain={chain}
                  wallets={wallets}
                  theme="dark"
                  connectModal={{
                    title: 'Connect to Nocena',
                    titleIcon: '/logo/LogoDark.png',
                  }}
                />
              </ThematicContainer>
            ) : (
              <ThematicContainer
                color="nocenaBlue"
                glassmorphic={true}
                asButton={false}
                rounded="2xl"
                className="p-8 text-center"
              >
                <h3 className="text-xl font-bold text-white mb-2">Wallet Connected</h3>
                <p className="text-sm text-gray-300 mb-4">Checking your profile status...</p>

                <div className="bg-black/30 rounded-lg px-3 py-2 inline-block mb-6">
                  <span className="text-xs font-mono text-gray-400">
                    {account.address.slice(0, 8)}...{account.address.slice(-6)}
                  </span>
                </div>

                <ConnectButton
                  client={client}
                  chain={chain}
                  wallets={wallets}
                  theme="dark"
                  connectModal={{
                    title: 'Connect to Nocena',
                    titleIcon: '/logo/LogoDark.png',
                  }}
                />
              </ThematicContainer>
            )}
          </div>
        )}

        {/* Error State */}
        {error && renderErrorState()}

        {/* Registration Link */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {error === 'account_not_found' ? (
              <>
                Need to register first?{' '}
                <Link href="/register" className="text-nocenaPink hover:text-nocenaPink/80 font-medium">
                  Input invite code
                </Link>
              </>
            ) : (
              <>
                New challenger?{' '}
                <Link href="/register" className="text-nocenaPink hover:text-nocenaPink/80 font-medium">
                  Create your profile
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </AuthenticationLayout>
  );
};

export default LoginPage;
