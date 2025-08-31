// components/register/components/RegisterWalletConnectStep.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client, chain } from '../../../lib/thirdweb';

// Import wallet connectors
import { inAppWallet, createWallet } from 'thirdweb/wallets';

interface RegisterWalletConnectStepProps {
  onWalletConnected: () => void;
}

const RegisterWalletConnectStep: React.FC<RegisterWalletConnectStepProps> = ({ onWalletConnected }) => {
  const account = useActiveAccount();
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Configure which wallets/login methods to show - same as login page
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

  // Check if wallet already exists in database
  const checkWalletExists = async (walletAddress: string): Promise<boolean> => {
    try {
      console.log('🔍 [FRONTEND] Checking wallet:', walletAddress);

      const response = await fetch('/api/registration/checkWallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: walletAddress }),
      });

      console.log('🔍 [FRONTEND] Response status:', response.status);
      console.log('🔍 [FRONTEND] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 [FRONTEND] Response not ok, error text:', errorText);
        throw new Error('Failed to check wallet');
      }

      const data = await response.json();
      console.log('🔍 [FRONTEND] Response data:', data);
      return data.exists;
    } catch (error) {
      console.error('🔍 [FRONTEND] Error checking wallet:', error);
      throw error;
    }
  };

  // Effect to check wallet when account changes
  useEffect(() => {
    if (account?.address) {
      setIsCheckingWallet(true);
      setWalletError(null);

      checkWalletExists(account.address)
        .then((exists) => {
          if (exists) {
            setWalletError(
              'This wallet is already registered with another account. Please use a different wallet or sign in instead.',
            );
          } else {
            setWalletError(null);
          }
        })
        .catch((error) => {
          console.error('Error checking wallet:', error);
          setWalletError('Failed to verify wallet. Please try again.');
        })
        .finally(() => {
          setIsCheckingWallet(false);
        });
    }
  }, [account?.address]);

  const handleContinue = () => {
    if (walletError) {
      return; // Don't continue if there's an error
    }
    onWalletConnected();
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-gray-800/50 rounded-[2rem] p-6 border border-gray-600">
        <div className="text-center space-y-4">
          <h3 className="text-white font-semibold text-lg">Let's start the challenge</h3>
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

          {account && (
            <div className="mt-4 space-y-3">
              {/* Loading state */}
              {isCheckingWallet && (
                <div className="p-3 bg-blue-500/20 border border-blue-500 rounded-xl">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-400 text-sm">Verifying wallet...</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {walletError && !isCheckingWallet && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-xl">
                  <p className="text-red-400 text-sm">{walletError}</p>
                  <div className="mt-3 flex space-x-2">
                    <Link
                      href="/login"
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all text-center text-sm"
                    >
                      Sign In Instead
                    </Link>
                  </div>
                </div>
              )}

              {/* Success state */}
              {!walletError && !isCheckingWallet && (
                <div className="p-3 bg-green-500/20 border border-green-500 rounded-xl">
                  <p className="text-green-400 text-sm">
                    Wallet connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </p>
                  <button
                    onClick={handleContinue}
                    className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-500 hover:to-green-400 transition-all"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterWalletConnectStep;
