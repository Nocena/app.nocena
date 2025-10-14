import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useNoceniteBalance } from './useNocenite';

export function useNoceniteToken() {
  const { address } = useAccount();
  const nctBalance = useNoceniteBalance(address as `0x${string}`);

  return {
    raw: (nctBalance.data as bigint) || 0n,
    formatted: formatEther((nctBalance.data as bigint) || 0n),
    isLoading: nctBalance.isLoading,
  };
}
