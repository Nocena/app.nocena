import { useReadContract, useWriteContract } from 'wagmi';
import { CONTRACTS, FLOW_EVM_TESTNET_ID } from '../../lib/constants';
import { AIRDROP_ABI } from '../../lib/contracts/airdropAbi';

export function useAirdropInfo() {
  return useReadContract({
    address: CONTRACTS.Airdrop as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: 'getAirdropInfo',
    chainId: FLOW_EVM_TESTNET_ID,
  });
}

export function useCurrentWeek() {
  return useReadContract({
    address: CONTRACTS.Airdrop as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: 'getCurrentWeek',
    chainId: FLOW_EVM_TESTNET_ID,
  });
}

export function useWeeklyRewardAmount() {
  return useReadContract({
    address: CONTRACTS.Airdrop as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: 'getWeeklyRewardAmount',
    chainId: FLOW_EVM_TESTNET_ID,
  });
}

export function useExecutorReward() {
  return useReadContract({
    address: CONTRACTS.Airdrop as `0x${string}`,
    abi: AIRDROP_ABI,
    functionName: 'getExecutorReward',
    chainId: FLOW_EVM_TESTNET_ID,
  });
}

export function useExecuteAirdrop() {
  const { writeContract, isPending, error } = useWriteContract();

  const executeAirdrop = (recipients: `0x${string}`[]) => {
    writeContract({
      address: CONTRACTS.Airdrop as `0x${string}`,
      abi: AIRDROP_ABI,
      functionName: 'executeWeeklyAirdrop',
      args: [recipients],
      chainId: FLOW_EVM_TESTNET_ID,
    });
  };

  return { executeAirdrop, isPending, error };
}
