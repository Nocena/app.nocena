import { mainnet, PublicClient, testnet } from '@lens-protocol/client';
import { createPublicClient } from 'viem';
import { lensTestnet } from 'wagmi/chains';
import { http } from 'wagmi';

const storage = typeof window !== 'undefined' ? window.localStorage : undefined;
export const viemLensPublicClient = createPublicClient({
  chain: lensTestnet,
  transport: http(lensTestnet.rpcUrls.default.http[0]),
});

export const lensPublicClient = PublicClient.create({
  environment: testnet,
  storage: storage,
});

export const lensPublicMainnetClient = PublicClient.create({
  environment: mainnet,
  storage: storage,
});

export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
export const APP_ADDRESS = process.env.NEXT_PUBLIC_APP_ADDRESS || '';

// Dual Token System - Flow EVM Testnet
export const FLOW_EVM_TESTNET_ID = 545;

export const CONTRACTS = {
  Nocenite: '0x7eEae9284A91af4c2258C80c62853ff5B30dd47E',
  Nocenix: '0x6D6ac4219E7795ec2e714802642eC57Ce09f22C1',
  Airdrop: '0x27Fb6c9cCc4C7324c31B0782c0B647725cAe4FC9',
} as const;

// Challenge reward amounts (in tokens, not wei)
export const CHALLENGE_REWARDS = {
  DAILY: 100,
  WEEKLY: 500,
  MONTHLY: 2500,
} as const;
