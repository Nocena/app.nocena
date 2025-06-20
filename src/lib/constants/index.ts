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
