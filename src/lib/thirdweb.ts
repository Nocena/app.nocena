// lib/thirdweb.ts
import { createThirdwebClient } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';

// Create the client with your Client ID and Secret Key
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
  secretKey: process.env.THIRDWEB_SECRET_KEY, // Add this for server-side operations
});

// Define Flow EVM testnet chain
export const chain = defineChain({
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: {
    name: 'Flow',
    symbol: 'FLOW',
    decimals: 18,
  },
  rpc: 'https://testnet.evm.nodes.onflow.org',
  blockExplorers: [
    {
      name: 'Flow EVM Testnet Explorer',
      url: 'https://evm-testnet.flowscan.io',
    },
  ],
  testnet: true,
});
