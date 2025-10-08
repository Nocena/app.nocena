import { useAccount } from 'wagmi';
import { useMintNocenite } from './useNocenite';
import { CHALLENGE_REWARDS } from '../../lib/constants';

export type ChallengeType = 'daily' | 'weekly' | 'monthly';

export function useChallengeRewards() {
  const { address } = useAccount();
  const { mintNCT, isPending, error } = useMintNocenite();

  const rewardChallenge = (challengeType: ChallengeType, userAddress?: `0x${string}`) => {
    const targetAddress = userAddress || address;
    if (!targetAddress) return;

    const rewardAmount = CHALLENGE_REWARDS[challengeType.toUpperCase() as keyof typeof CHALLENGE_REWARDS];
    mintNCT(targetAddress as `0x${string}`, rewardAmount);
  };

  const rewardDaily = (userAddress?: `0x${string}`) => rewardChallenge('daily', userAddress);
  const rewardWeekly = (userAddress?: `0x${string}`) => rewardChallenge('weekly', userAddress);
  const rewardMonthly = (userAddress?: `0x${string}`) => rewardChallenge('monthly', userAddress);

  return {
    rewardChallenge,
    rewardDaily,
    rewardWeekly,
    rewardMonthly,
    isPending,
    error,
    rewards: CHALLENGE_REWARDS,
  };
}
