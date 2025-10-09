import { useState, useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACTS, FLOW_EVM_TESTNET_ID } from '../../lib/constants';
import { NOCENITE_ABI } from '../../lib/contracts/noceniteAbi';

export function useNctHolders() {
  const [holders, setHolders] = useState<`0x${string}`[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.Nocenite as `0x${string}`,
    abi: NOCENITE_ABI,
    functionName: 'totalSupply',
    chainId: FLOW_EVM_TESTNET_ID,
  });

  // Manual holder list management for now
  const addHolder = useCallback((address: `0x${string}`) => {
    setHolders((prev) => {
      if (!prev.includes(address)) {
        return [...prev, address];
      }
      return prev;
    });
  }, []);

  const removeHolder = useCallback((address: `0x${string}`) => {
    setHolders((prev) => prev.filter((holder) => holder !== address));
  }, []);

  const clearHolders = useCallback(() => {
    setHolders([]);
  }, []);

  // Batch holders for airdrop (max 100 per batch)
  const getHolderBatches = useCallback(
    (batchSize: number = 50) => {
      const batches: `0x${string}`[][] = [];
      for (let i = 0; i < holders.length; i += batchSize) {
        batches.push(holders.slice(i, i + batchSize));
      }
      return batches;
    },
    [holders],
  );

  return {
    holders,
    totalSupply,
    isLoading,
    addHolder,
    removeHolder,
    clearHolders,
    getHolderBatches,
    holderCount: holders.length,
  };
}
