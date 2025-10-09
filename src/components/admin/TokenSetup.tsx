import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useManageRewardMinters, useIsRewardMinter } from '../../hooks/contracts/useNocenite';
import { useDualTokens } from '../../hooks/contracts/useDualTokens';

export function TokenSetup() {
  const { address } = useAccount();
  const { addRewardMinter, isPending, error } = useManageRewardMinters();
  const { data: isRewardMinter } = useIsRewardMinter(address as `0x${string}`);
  const { nctBalance, ncxBalance } = useDualTokens();
  const [setupAddress, setSetupAddress] = useState(address || '');

  const handleAddRewardMinter = () => {
    if (setupAddress) {
      addRewardMinter(setupAddress as `0x${string}`);
    }
  };

  if (!address) {
    return (
      <div className="p-4 bg-yellow-100 rounded-lg">
        <p>Please connect your wallet to set up token rewards</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md">
      <h2 className="text-xl font-bold mb-4">Token System Setup</h2>

      {/* Current Status */}
      <div className="mb-6 space-y-2">
        <h3 className="font-semibold">Current Status:</h3>
        <p>
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
        <p>Can Mint NCT: {isRewardMinter ? '✅ Yes' : '❌ No'}</p>
        <p>NCT Balance: {nctBalance.formatted}</p>
        <p>NCX Balance: {ncxBalance.formatted}</p>
      </div>

      {/* Setup Section */}
      {!isRewardMinter && (
        <div className="space-y-4">
          <h3 className="font-semibold">Authorize Reward Minter:</h3>
          <input
            type="text"
            value={setupAddress}
            onChange={(e) => setSetupAddress(e.target.value)}
            placeholder="Wallet address to authorize"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleAddRewardMinter}
            disabled={isPending || !setupAddress}
            className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
          >
            {isPending ? 'Adding...' : 'Add Reward Minter'}
          </button>
          {error && <p className="text-red-500 text-sm">{error.message}</p>}
        </div>
      )}

      {isRewardMinter && (
        <div className="p-4 bg-green-100 rounded">
          <p className="text-green-800">✅ This wallet is authorized to mint NCT rewards!</p>
        </div>
      )}
    </div>
  );
}

// Add display name for Fast Refresh compatibility
TokenSetup.displayName = 'TokenSetup';
