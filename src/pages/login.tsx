// pages/login.tsx - Updated to match enhanced registration
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { getUserFromDgraph } from '../lib/api/dgraph';
import PrimaryButton from '../components/ui/PrimaryButton';
import { User, useAuth } from '../contexts/AuthContext';
import AuthenticationLayout from '../components/layout/AuthenticationLayout';
import { client, chain } from '../lib/thirdweb';

// Import wallet connectors you want to use
import { inAppWallet, createWallet } from 'thirdweb/wallets';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);

  // Refs to prevent multiple simultaneous login attempts
  const isProcessingLogin = useRef(false);
  const checkedAddresses = useRef<Set<string>>(new Set());

  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();

  // Thirdweb v5 hooks
  const account = useActiveAccount();

  // Configure which wallets/login methods to show
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

  console.log('🔄 LOGIN PAGE RENDER:', {
    accountAddress: account?.address,
    loading,
    error,
    isAuthenticated,
    userExists: !!user,
    walletChecked,
    isProcessingLogin: isProcessingLogin.current,
    checkedAddresses: Array.from(checkedAddresses.current),
  });

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

      console.log('🎯 LOGIN EFFECT TRIGGERED:', {
        currentAddress,
        loading,
        isProcessingLogin: isProcessingLogin.current,
        alreadyChecked: currentAddress ? checkedAddresses.current.has(currentAddress) : false,
        isAuthenticated,
        walletChecked,
      });

      // Exit early if no address
      if (!currentAddress) {
        console.log('❌ No wallet address, resetting state');
        setWalletChecked(false);
        setError('');
        return;
      }

      // Exit early if already authenticated
      if (isAuthenticated) {
        console.log('✅ Already authenticated, skipping login');
        return;
      }

      // Exit early if already processing
      if (isProcessingLogin.current) {
        console.log('⏳ Already processing login, skipping');
        return;
      }

      // Exit early if this address was already checked
      if (checkedAddresses.current.has(currentAddress)) {
        console.log('🔄 Address already checked, skipping API call');
        return;
      }

      // Exit early if currently loading
      if (loading) {
        console.log('⏳ Already loading, skipping');
        return;
      }

      console.log('🚀 STARTING LOGIN PROCESS for address:', currentAddress);

      isProcessingLogin.current = true;
      setLoading(true);
      setError('');
      setWalletChecked(false);

      try {
        console.log('📡 Calling getUserFromDgraph...');

        // Check if user exists in our database
        const userData = await getUserFromDgraph(currentAddress);

        console.log('📡 getUserFromDgraph response:', {
          userExists: !!userData,
          username: userData?.username,
          wallet: userData?.wallet,
          hasLensData: !!(userData?.lensHandle || userData?.lensAccountId),
          hasPersonalFields: !!(userData?.personalField1Type || userData?.personalField2Type || userData?.personalField3Type),
        });

        // Mark this address as checked to prevent future API calls
        checkedAddresses.current.add(currentAddress);
        setWalletChecked(true);

        if (!userData) {
          console.log('❌ No user found for wallet, showing registration prompt');
          setError('account_not_found');
          setLoading(false);
          isProcessingLogin.current = false;
          return;
        }

        // Format user data for our context - enhanced to match registration
        const formattedUser: User = {
          // Core user fields
          id: userData.id,
          username: userData.username,
          bio: userData.bio || '',
          wallet: userData.wallet,
          profilePicture: userData.profilePicture || '/images/profile.png',
          coverPhoto: userData.coverPhoto || '/images/cover.jpg',
          trailerVideo: userData.trailerVideo || '/trailer.mp4',
          
          // Token fields - ensure consistent naming with registration
          earnedTokens: userData.earnedTokens || 0,
          earnedTokensDay: userData.earnedTokensDay || userData.earnedTokensToday || 0,
          earnedTokensWeek: userData.earnedTokensWeek || userData.earnedTokensThisWeek || 0,
          earnedTokensMonth: userData.earnedTokensMonth || userData.earnedTokensThisMonth || 0,

          // Personal Expression Fields - new in enhanced registration
          personalField1Type: userData.personalField1Type || '',
          personalField1Value: userData.personalField1Value || '',
          personalField1Metadata: userData.personalField1Metadata || '',
          personalField2Type: userData.personalField2Type || '',
          personalField2Value: userData.personalField2Value || '',
          personalField2Metadata: userData.personalField2Metadata || '',
          personalField3Type: userData.personalField3Type || '',
          personalField3Value: userData.personalField3Value || '',
          personalField3Metadata: userData.personalField3Metadata || '',

          // Lens Protocol Fields - new in enhanced registration
          lensHandle: userData.lensHandle || '',
          lensAccountId: userData.lensAccountId || '',
          lensTransactionHash: userData.lensTransactionHash || '',
          lensMetadataUri: userData.lensMetadataUri || '',

          // Notification and challenge tracking
          pushSubscription: userData.pushSubscription || '',
          dailyChallenge: userData.dailyChallenge || '0'.repeat(365),
          weeklyChallenge: userData.weeklyChallenge || '0'.repeat(52),
          monthlyChallenge: userData.monthlyChallenge || '0'.repeat(12),

          // Social connections - ensure arrays
          followers: Array.isArray(userData.followers) ? userData.followers : [],
          following: Array.isArray(userData.following) ? userData.following : [],
          
          // Activity arrays - ensure they exist
          notifications: Array.isArray(userData.notifications) ? userData.notifications : [],
          completedChallenges: Array.isArray(userData.completedChallenges) ? userData.completedChallenges : [],
          receivedPrivateChallenges: Array.isArray(userData.receivedPrivateChallenges) ? userData.receivedPrivateChallenges : [],
          createdPrivateChallenges: Array.isArray(userData.createdPrivateChallenges) ? userData.createdPrivateChallenges : [],
          createdPublicChallenges: Array.isArray(userData.createdPublicChallenges) ? userData.createdPublicChallenges : [],
          participatingPublicChallenges: Array.isArray(userData.participatingPublicChallenges) ? userData.participatingPublicChallenges : [],
        };

        console.log('👤 Enhanced formatted user data:', {
          id: formattedUser.id,
          username: formattedUser.username,
          wallet: formattedUser.wallet,
          lensHandle: formattedUser.lensHandle,
          lensAccountId: formattedUser.lensAccountId,
          hasPersonalFields: !!(formattedUser.personalField1Type || formattedUser.personalField2Type || formattedUser.personalField3Type),
          followersCount: formattedUser.followers.length,
          followingCount: formattedUser.following.length,
          tokenFields: {
            total: formattedUser.earnedTokens,
            day: formattedUser.earnedTokensDay,
            week: formattedUser.earnedTokensWeek,
            month: formattedUser.earnedTokensMonth,
          },
          challengeProgress: {
            daily: formattedUser.dailyChallenge.length,
            weekly: formattedUser.weeklyChallenge.length,
            monthly: formattedUser.monthlyChallenge.length,
          }
        });

        // Login successful
        console.log('🔐 Calling login function...');
        await login(formattedUser);

        console.log('✅ Login successful, redirecting to home');
        router.push('/home');
      } catch (err) {
        console.error('💥 Login error:', err);
        setError('network_error');
        // Don't mark as checked on network error so it can retry
      } finally {
        console.log('🏁 Login process finished');
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

  const handleContinueRegistration = () => {
    console.log('🔀 Redirecting to registration');
    router.push('/register');
  };

  const renderErrorState = () => {
    if (error === 'account_not_found') {
      return (
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
          <p className="text-red-400 text-sm text-center">
            Wallet connected! Complete your profile to start challenging.
          </p>
        </div>
      );
    }

    if (error === 'network_error') {
      return (
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
          <div className="text-center space-y-2">
            <p className="text-red-400 text-sm font-semibold">Network Error</p>
            <p className="text-red-300 text-xs">Failed to check your profile. Please try again.</p>
            <button
              onClick={() => {
                setError('');
                if (account?.address) {
                  checkedAddresses.current.delete(account.address);
                }
              }}
              className="text-nocenaPink hover:text-nocenaPink/80 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <AuthenticationLayout title="Welcome back" subtitle="Connect your identity to continue">
      <div className="w-full space-y-8">
        {/* Main Action Card */}
        <div className="bg-gray-800/50 rounded-[2rem] p-8 border border-gray-600">
          {!account ? (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-white font-bold text-xl">Choose Your Profile</h3>
                <p className="text-gray-300 text-sm">
                  Your wallet is your identity. Connect to access your profile and challenges.
                </p>
              </div>

              <div className="py-4">
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
              </div>

              <div className="text-xs text-gray-400 max-w-sm mx-auto">
                No usernames, no passwords. Your blockchain wallet serves as your secure digital identity.
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-nocenaBlue border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-semibold">Checking your profile...</p>
                    <p className="text-gray-400 text-sm font-mono">
                      {account.address.slice(0, 8)}...{account.address.slice(-6)}
                    </p>
                  </div>
                </div>
              ) : walletChecked && !error ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-semibold text-lg">Profile Connected</p>
                    <p className="text-gray-300 text-sm font-mono bg-black/30 rounded-lg px-3 py-1 inline-block">
                      {account.address.slice(0, 8)}...{account.address.slice(-6)}
                    </p>
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
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-nocenaBlue rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-semibold text-lg">Wallet Connected</p>
                    <p className="text-gray-300 text-sm font-mono bg-black/30 rounded-lg px-3 py-1 inline-block">
                      {account.address.slice(0, 8)}...{account.address.slice(-6)}
                    </p>
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
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error/Registration State */}
        {error && renderErrorState()}

        {/* Social Media Style Features */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-300 text-sm">
              {error === 'account_not_found' ? (
                <>
                  You're almost there -{' '}
                  <Link
                    href="/register?skip_wallet=true"
                    className="text-nocenaPink hover:text-nocenaPink/80 font-semibold"
                  >
                    continue with registration
                  </Link>
                </>
              ) : (
                <>
                  New challenger?{' '}
                  <Link href="/register" className="text-nocenaPink hover:text-nocenaPink/80 font-semibold">
                    Create your profile
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* Identity Benefits */}
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700 space-y-4">
            <h4 className="text-white font-semibold text-center">Your Digital Identity</h4>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-nocenaBlue rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-white text-sm font-medium">One Wallet, One Identity</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-nocenaPurple rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-white text-sm font-medium">Earn While You Play</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-nocenaPink rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-white text-sm font-medium">Cross-Platform Profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticationLayout>
  );
};

export default LoginPage;
