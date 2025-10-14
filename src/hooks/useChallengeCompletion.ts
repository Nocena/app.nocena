import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useAuth } from '../contexts/AuthContext';
import { completeChallengeWorkflow } from '../lib/completing/challengeCompletionService';
import { mintChallengeReward, type ChallengeFrequency } from '../lib/completing/blockchainTokenService';
import { useIsRewardMinter } from './contracts/useNocenite';
import type { CompletionData, CompletionResult } from '../lib/completing/challengeCompletionService';

interface BlockchainCompletionResult extends CompletionResult {
  blockchainReward?: {
    success: boolean;
    txHash?: string;
    rewardAmount: number;
    error?: string;
  };
}

export function useChallengeCompletion() {
  const [isCompleting, setIsCompleting] = useState(false);
  const { user } = useAuth();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: isRewardMinter } = useIsRewardMinter(address as `0x${string}`);

  const completeChallenge = async (
    completionData: CompletionData,
    enableBlockchainRewards: boolean = true,
  ): Promise<BlockchainCompletionResult> => {
    if (!user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    setIsCompleting(true);

    try {
      // Step 1: Complete challenge using existing service (database + traditional rewards)
      const completionResult = await completeChallengeWorkflow(user.id, completionData);

      if (!completionResult.success) {
        return completionResult;
      }

      // Step 2: Challenge completion handles blockchain rewards automatically
      console.log('✅ Challenge completion includes automatic blockchain rewards');

      return {
        ...completionResult,
      };
    } catch (error) {
      console.error('❌ Challenge completion failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    completeChallenge,
    isCompleting,
    canMintTokens: !!address && !!walletClient && !!isRewardMinter,
    userAddress: address,
    isRewardMinter,
  };
}
