import { useCallback } from 'react';
import { mintChallengeReward, type ChallengeFrequency } from '../lib/completing/blockchainTokenService';

export function useChallengeRewards() {
  const claimReward = useCallback(
    async (frequency: ChallengeFrequency, ipfsHash: string, userAddress: `0x${string}`) => {
      return mintChallengeReward(userAddress, frequency, ipfsHash);
    },
    [],
  );

  return { claimReward };
}
