import { useReadContract } from 'wagmi';
import { CONTRACTS, FLOW_EVM_TESTNET_ID } from '../../lib/constants';
import { NOCENIX_ABI } from '../../lib/contracts/nocenixAbi';

export function useNocenixBalance(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.Nocenix as `0x${string}`,
    abi: NOCENIX_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: FLOW_EVM_TESTNET_ID,
    query: {
      enabled: !!address,
    },
  });
}

export function useNocenixInfo() {
  const name = useReadContract({
    address: CONTRACTS.Nocenix as `0x${string}`,
    abi: NOCENIX_ABI,
    functionName: 'name',
    chainId: FLOW_EVM_TESTNET_ID,
  });

  const symbol = useReadContract({
    address: CONTRACTS.Nocenix as `0x${string}`,
    abi: NOCENIX_ABI,
    functionName: 'symbol',
    chainId: FLOW_EVM_TESTNET_ID,
  });

  const totalSupply = useReadContract({
    address: CONTRACTS.Nocenix as `0x${string}`,
    abi: NOCENIX_ABI,
    functionName: 'totalSupply',
    chainId: FLOW_EVM_TESTNET_ID,
  });

  const maxSupply = useReadContract({
    address: CONTRACTS.Nocenix as `0x${string}`,
    abi: NOCENIX_ABI,
    functionName: 'MAX_SUPPLY',
    chainId: FLOW_EVM_TESTNET_ID,
  });

  return { name, symbol, totalSupply, maxSupply };
}
