import React from 'react';
import { useAccount } from 'wagmi';
import { useDualTokens } from '../../hooks/contracts/useDualTokens';
import { useIsRewardMinter } from '../../hooks/contracts/useNocenite';
import { useChallengeRewards } from '../../hooks/contracts/useChallengeRewards';
import { useExecuteAirdrop } from '../../hooks/contracts/useAirdrop';
import { CHALLENGE_REWARDS } from '../../lib/constants';

export function DualTokenTest() {
  const { address, isConnected } = useAccount();
  const { nctBalance, ncxBalance, airdrop } = useDualTokens();
  const { data: isRewardMinter } = useIsRewardMinter(address as `0x${string}`);
  const { rewardDaily, rewardWeekly, rewardMonthly, isPending: rewardPending } = useChallengeRewards();
  const { executeAirdrop, isPending: airdropPending } = useExecuteAirdrop();

  if (!isConnected) {
    return (
      <div className="p-4 bg-yellow-100 rounded">
        <p>Please connect your wallet to test the dual token system</p>
      </div>
    );
  }

  const handleTestReward = (type: 'daily' | 'weekly' | 'monthly') => {
    if (!address) return;

    const walletAddress = address as `0x${string}`;

    switch (type) {
      case 'daily':
        rewardDaily(walletAddress);
        break;
      case 'weekly':
        rewardWeekly(walletAddress);
        break;
      case 'monthly':
        rewardMonthly(walletAddress);
        break;
    }
  };

  const handleTestAirdrop = () => {
    if (!address) return;
    // Test with current user as recipient
    executeAirdrop([address as `0x${string}`]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Dual Token System Test</h2>

      {/* Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">System Status</h3>
        <p>
          Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <p>Can Mint NCT: {isRewardMinter ? '✅ Yes' : '❌ No'}</p>
        <p>NCT Balance: {nctBalance.formatted} NCT</p>
        <p>NCX Balance: {ncxBalance.formatted} NCX</p>
      </div>

      {/* Airdrop Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Airdrop Status</h3>
        <p>Current Week: {airdrop.currentWeek.toString()}</p>
        <p>Current Year: {airdrop.currentYear.toString()}</p>
        <p>Weekly Reward: {(Number(airdrop.weeklyReward) / 1e18).toLocaleString()} NCX</p>
        <p>Week Executed: {airdrop.weekExecuted ? '✅ Yes' : '❌ No'}</p>
        <p>Total Airdrops: {airdrop.totalExecuted.toString()}</p>
      </div>

      {/* Test Buttons */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Test Challenge Rewards</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleTestReward('daily')}
              disabled={rewardPending || !isRewardMinter}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              Daily ({CHALLENGE_REWARDS.DAILY} NCT)
            </button>
            <button
              onClick={() => handleTestReward('weekly')}
              disabled={rewardPending || !isRewardMinter}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Weekly ({CHALLENGE_REWARDS.WEEKLY} NCT)
            </button>
            <button
              onClick={() => handleTestReward('monthly')}
              disabled={rewardPending || !isRewardMinter}
              className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
            >
              Monthly ({CHALLENGE_REWARDS.MONTHLY} NCT)
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Test Airdrop</h3>
          <button
            onClick={handleTestAirdrop}
            disabled={airdropPending || airdrop.weekExecuted}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
          >
            {airdrop.weekExecuted ? 'This Week Already Executed' : 'Execute Airdrop'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded text-sm">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Connect the authorized frontend wallet (0x8FCF...)</li>
          <li>Test challenge rewards to mint NCT tokens</li>
          <li>Execute airdrop to distribute NCX based on NCT holdings</li>
          <li>Check balances update in real-time</li>
        </ol>
      </div>
    </div>
  );
}

// Add display name for Fast Refresh compatibility
DualTokenTest.displayName = 'DualTokenTest';
