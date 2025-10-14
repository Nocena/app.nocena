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
  Nocenite: '0xA92C45C3d516f1cCe011BE92C81326962e5C1047',
  ChallengeRewards: '0xf9b4812a2160b4550045ae3DfDF797eC4d5C3336',
} as const;

// Challenge reward amounts (in tokens, not wei)
export const CHALLENGE_REWARDS = {
  DAILY: 100,
  WEEKLY: 500,
  MONTHLY: 2500,
} as const;
