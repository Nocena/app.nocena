import { useReadContract, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS, FLOW_EVM_TESTNET_ID } from '../../lib/constants';
import noceniteArtifact from '../../lib/contracts/nocenite.json';

export function useNoceniteBalance(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.Nocenite as `0x${string}`,
    abi: (noceniteArtifact as any).abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: FLOW_EVM_TESTNET_ID,
    query: {
      enabled: !!address,
    },
  });
}

export function useNoceniteInfo() {
  const name = useReadContract({
    address: CONTRACTS.Nocenite as `0x${string}`,
    abi: (noceniteArtifact as any).abi,
    functionName: 'name',
    chainId: FLOW_EVM_TESTNET_ID,
  });

  const symbol = useReadContract({
    address: CONTRACTS.Nocenite as `0x${string}`,
    abi: (noceniteArtifact as any).abi,
    functionName: 'symbol',
    chainId: FLOW_EVM_TESTNET_ID,
  });

  const totalSupply = useReadContract({
    address: CONTRACTS.Nocenite as `0x${string}`,
    abi: (noceniteArtifact as any).abi,
    functionName: 'totalSupply',
    chainId: FLOW_EVM_TESTNET_ID,
  });

  return { name, symbol, totalSupply };
}

export function useIsRewardMinter(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.Nocenite as `0x${string}`,
    abi: (noceniteArtifact as any).abi,
    functionName: 'isRewardMinter',
    args: address ? [address] : undefined,
    chainId: FLOW_EVM_TESTNET_ID,
    query: {
      enabled: !!address,
    },
  });
}

export function useMintNocenite() {
  const { writeContract, isPending, error } = useWriteContract();

  const mintNCT = (to: `0x${string}`, amount: number) => {
    writeContract({
      address: CONTRACTS.Nocenite as `0x${string}`,
      abi: (noceniteArtifact as any).abi,
      functionName: 'mint',
      args: [to, parseEther(amount.toString())],
      chainId: FLOW_EVM_TESTNET_ID,
    });
  };

  return { mintNCT, isPending, error };
}

export function useManageRewardMinters() {
  const { writeContract, isPending, error } = useWriteContract();

  const addRewardMinter = (minter: `0x${string}`) => {
    writeContract({
      address: CONTRACTS.Nocenite as `0x${string}`,
      abi: (noceniteArtifact as any).abi,
      functionName: 'addRewardMinter',
      args: [minter],
      chainId: FLOW_EVM_TESTNET_ID,
    });
  };

  const removeRewardMinter = (minter: `0x${string}`) => {
    writeContract({
      address: CONTRACTS.Nocenite as `0x${string}`,
      abi: (noceniteArtifact as any).abi,
      functionName: 'removeRewardMinter',
      args: [minter],
      chainId: FLOW_EVM_TESTNET_ID,
    });
  };

  return { addRewardMinter, removeRewardMinter, isPending, error };
}
