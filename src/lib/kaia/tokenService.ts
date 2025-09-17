import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import deployments from './deployments.json';

const kaiaMainnet = defineChain({
  id: 8217,
  name: 'Kaia',
  network: 'kaia',
  nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] }, // Use local fork
    public: { http: ['http://localhost:8545'] },
  },
});

const NCX_CONTRACT_ADDRESS = deployments.contracts.NCXToken.address as `0x${string}`;
const MINTER_PRIVATE_KEY = process.env.NCX_MINTER_PRIVATE_KEY as `0x${string}`;

// Basic ERC20 ABI with mint function
const NCX_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const mintReward = async (userAddress: `0x${string}`, amount: string) => {
  if (!NCX_CONTRACT_ADDRESS || !MINTER_PRIVATE_KEY) {
    throw new Error('Missing contract configuration');
  }

  const account = privateKeyToAccount(MINTER_PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: kaiaMainnet,
    transport: http(),
  });

  const amountWei = parseEther(amount);
  const hash = await walletClient.writeContract({
    address: NCX_CONTRACT_ADDRESS,
    abi: NCX_ABI,
    functionName: 'mint',
    args: [userAddress, amountWei],
  });

  return {
    hash,
    amount,
    recipient: userAddress,
  };
};

export const getNCXBalance = async (userAddress: `0x${string}`) => {
  if (!NCX_CONTRACT_ADDRESS) {
    throw new Error('Missing contract configuration');
  }

  const publicClient = createPublicClient({
    chain: kaiaMainnet,
    transport: http(),
  });

  const balance = await publicClient.readContract({
    address: NCX_CONTRACT_ADDRESS,
    abi: NCX_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  });

  return formatEther(balance);
};

export const getRewardAmount = (challengeType: string): string => {
  switch (challengeType) {
    case 'daily':
      return '1';
    case 'weekly':
      return '5';
    case 'monthly':
      return '25';
    default:
      return '1';
  }
};

export const getDeploymentInfo = () => deployments;
