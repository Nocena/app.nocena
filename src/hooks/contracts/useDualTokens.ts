import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useNoceniteBalance } from './useNocenite';
import { useNocenixBalance } from './useNocenix';
import { useAirdropInfo } from './useAirdrop';

export function useDualTokens() {
  const { address } = useAccount();

  const nctBalance = useNoceniteBalance(address as `0x${string}`);
  const ncxBalance = useNocenixBalance(address as `0x${string}`);
  const airdropInfo = useAirdropInfo();

  return {
    nctBalance: {
      raw: nctBalance.data || 0n,
      formatted: nctBalance.data ? formatEther(nctBalance.data) : '0',
      isLoading: nctBalance.isLoading,
    },
    ncxBalance: {
      raw: ncxBalance.data || 0n,
      formatted: ncxBalance.data ? formatEther(ncxBalance.data) : '0',
      isLoading: ncxBalance.isLoading,
    },
    airdrop: {
      currentWeek: airdropInfo.data?.[0] || 0n,
      currentYear: airdropInfo.data?.[1] || 0n,
      weeklyReward: airdropInfo.data?.[2] || 0n,
      weekExecuted: airdropInfo.data?.[3] || false,
      totalExecuted: airdropInfo.data?.[4] || 0n,
      isLoading: airdropInfo.isLoading,
    },
  };
}
