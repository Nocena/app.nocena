import { parseEther } from 'viem';
import { CONTRACTS, FLOW_EVM_TESTNET_ID, CHALLENGE_REWARDS } from '../constants';
import { NOCENITE_ABI } from '../contracts/noceniteAbi';

export type ChallengeFrequency = 'daily' | 'weekly' | 'monthly';

export interface BlockchainRewardResult {
  success: boolean;
  txHash?: string;
  error?: string;
  rewardAmount: number;
}

/**
 * Mints NCT tokens for challenge completion
 * This should be called after successful challenge verification
 */
export async function mintChallengeReward(
  userAddress: `0x${string}`,
  challengeFrequency: ChallengeFrequency,
  walletClient: any, // wagmi wallet client
): Promise<BlockchainRewardResult> {
  try {
    const rewardAmount = CHALLENGE_REWARDS[challengeFrequency.toUpperCase() as keyof typeof CHALLENGE_REWARDS];

    console.log(`🪙 Minting ${rewardAmount} NCT tokens for ${challengeFrequency} challenge completion`);

    const txHash = await walletClient.writeContract({
      address: CONTRACTS.Nocenite as `0x${string}`,
      abi: NOCENITE_ABI,
      functionName: 'mint',
      args: [userAddress, parseEther(rewardAmount.toString())],
      chainId: FLOW_EVM_TESTNET_ID,
    });

    console.log(`✅ NCT minting transaction sent: ${txHash}`);

    return {
      success: true,
      txHash,
      rewardAmount,
    };
  } catch (error) {
    console.error('❌ Failed to mint NCT tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rewardAmount: CHALLENGE_REWARDS[challengeFrequency.toUpperCase() as keyof typeof CHALLENGE_REWARDS],
    };
  }
}

/**
 * Gets the reward amount for a challenge frequency
 */
export function getChallengeRewardAmount(frequency: ChallengeFrequency): number {
  return CHALLENGE_REWARDS[frequency.toUpperCase() as keyof typeof CHALLENGE_REWARDS];
}
