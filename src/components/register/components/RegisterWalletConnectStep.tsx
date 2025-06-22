// components/register/components/RegisterWalletConnectStep.tsx
import React from 'react';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client, chain } from '../../../lib/thirdweb';

// Import wallet connectors
import { inAppWallet, createWallet } from 'thirdweb/wallets';

interface RegisterWalletConnectStepProps {
  onWalletConnected: () => void;
}

const RegisterWalletConnectStep: React.FC<RegisterWalletConnectStepProps> = ({ onWalletConnected }) => {
  const account = useActiveAccount();

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

  return (
    <div className="w-full space-y-6">
      <div className="bg-gray-800/50 rounded-[2rem] p-6 border border-gray-600">
        <div className="text-center space-y-4">
          <h3 className="text-white font-semibold text-lg">Connect Your Wallet</h3>
          <p className="text-gray-300 text-sm">
            Connect your wallet to create your Nocena account. No passwords needed!
          </p>
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
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-xl">
              <p className="text-green-400 text-sm">
                Wallet connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </p>
              <button
                onClick={onWalletConnected}
                className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-500 hover:to-green-400 transition-all"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
        <h4 className="text-white font-semibold mb-2">Why Wallet Authentication?</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• No passwords to remember or forget</li>
          <li>• Your challenge rewards go directly to your wallet</li>
          <li>• Enhanced security with blockchain technology</li>
          <li>• Easy integration with DeFi and other Web3 apps</li>
        </ul>
      </div>

      {/* Social Login Benefits for Crypto Users */}
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
        <h4 className="text-white font-semibold mb-2">Connect with Your Community</h4>
        <div className="grid grid-cols-2 gap-2 text-gray-300 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Discord Communities</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
            <span>Telegram Groups</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>X (Twitter) Crypto</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-nocenaPink rounded-full"></div>
            <span>Social Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterWalletConnectStep;
