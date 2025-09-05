// components/register/components/RegisterWalletConnectStep.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import ThematicContainer from '../../ui/ThematicContainer';
import PrimaryButton from '../../ui/PrimaryButton';
import { client, chain } from '../../../lib/thirdweb';
import { inAppWallet, createWallet } from 'thirdweb/wallets';

interface RegisterWalletConnectStepProps {
  onWalletConnected: () => void;
}

const RegisterWalletConnectStep: React.FC<RegisterWalletConnectStepProps> = ({ onWalletConnected }) => {
  const account = useActiveAccount();
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

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

  useEffect(() => {
    if (account?.address) {
      setIsCheckingWallet(true);
      setWalletError(null);

      checkWalletExists(account.address)
        .then((exists) => {
          if (exists) {
            setWalletError('This wallet is already registered. Please use a different wallet or sign in instead.');
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
      return;
    }
    onWalletConnected();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Main Connect Card */}
      {!account ? (
        <ThematicContainer
          color="nocenaBlue"
          glassmorphic={true}
          asButton={false}
          rounded="2xl"
          className="p-8 text-center"
        >
          <div className="w-16 h-16 bg-nocenaBlue/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-nocenaBlue/30">
            <div className="w-6 h-6 border-2 border-nocenaBlue border-t-transparent rounded-full animate-spin" />
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
        <div className="space-y-6">
          {/* Checking State */}
          {isCheckingWallet && (
            <ThematicContainer
              color="nocenaPink"
              glassmorphic={true}
              asButton={false}
              rounded="2xl"
              className="p-8 text-center"
            >
              <div className="w-16 h-16 border-4 border-nocenaPink/20 border-t-nocenaPink rounded-full animate-spin mx-auto mb-6" />
              <div className="bg-black/30 rounded-lg px-3 py-2 inline-block">
                <span className="text-xs font-mono text-gray-400">
                  {account.address.slice(0, 8)}...{account.address.slice(-6)}
                </span>
              </div>
            </ThematicContainer>
          )}

          {/* Error State */}
          {walletError && !isCheckingWallet && (
            <ThematicContainer
              color="nocenaPink"
              glassmorphic={true}
              asButton={false}
              rounded="2xl"
              className="p-8 text-center"
            >
              <div className="w-16 h-16 bg-nocenaPink/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-nocenaPink/30">
                <div className="w-6 h-6 border-2 border-nocenaPink border-dashed rounded-full" />
              </div>

              <p className="text-sm text-gray-300 mb-6">{walletError}</p>

              <div className="bg-black/30 rounded-lg px-3 py-2 inline-block mb-6">
                <span className="text-xs font-mono text-gray-400">
                  {account.address.slice(0, 8)}...{account.address.slice(-6)}
                </span>
              </div>

              <div className="space-y-3">
                <Link href="/login">
                  <PrimaryButton text="Sign In Instead" className="w-full" isActive={true} />
                </Link>

                <ConnectButton
                  client={client}
                  chain={chain}
                  wallets={wallets}
                  theme="dark"
                  connectModal={{
                    title: 'Connect Different Wallet',
                    titleIcon: '/logo/LogoDark.png',
                  }}
                />
              </div>
            </ThematicContainer>
          )}

          {/* Success State */}
          {!walletError && !isCheckingWallet && (
            <ThematicContainer
              color="nocenaPurple"
              glassmorphic={true}
              asButton={false}
              rounded="2xl"
              className="p-8 text-center"
            >
              <div className="w-16 h-16 bg-nocenaPurple/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-nocenaPurple/30">
                <div className="w-6 h-6 border-2 border-nocenaPurple rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-nocenaPurple rounded-full" />
                </div>
              </div>

              <div className="bg-black/30 rounded-lg px-3 py-2 inline-block mb-6">
                <span className="text-xs font-mono text-gray-400">
                  {account.address.slice(0, 8)}...{account.address.slice(-6)}
                </span>
              </div>

              <PrimaryButton
                onClick={handleContinue}
                text="Continue Registration"
                className="w-full"
                isActive={false}
              />
            </ThematicContainer>
          )}
        </div>
      )}
    </div>
  );
};

export default RegisterWalletConnectStep;
