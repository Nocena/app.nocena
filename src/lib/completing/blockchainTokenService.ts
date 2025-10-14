import { CHALLENGE_REWARDS } from '../constants';

export type ChallengeFrequency = 'daily' | 'weekly' | 'monthly';

interface BlockchainRewardResult {
  success: boolean;
  txHash?: string;
  error?: string;
  rewardAmount: number;
}

/**
 * Mints NCT tokens for challenge completion using relayer API
 */
async function mintChallengeReward(
  userAddress: `0x${string}`,
  frequency: ChallengeFrequency,
  ipfsHash: string,
): Promise<BlockchainRewardResult> {
  try {
    const response = await fetch('/api/mint-challenge-reward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress,
        challengeFrequency: frequency,
        ipfsHash,
      }),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        txHash: result.txHash,
        rewardAmount: getEstimatedReward(frequency),
      };
    } else {
      return {
        success: false,
        error: result.error || 'Unknown error',
        rewardAmount: 0,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rewardAmount: 0,
    };
  }
}

/**
 * Gets the estimated reward amount for a challenge frequency
 */
function getEstimatedReward(frequency: ChallengeFrequency): number {
  return CHALLENGE_REWARDS[frequency.toUpperCase() as keyof typeof CHALLENGE_REWARDS];
}

export { mintChallengeReward, getEstimatedReward };
