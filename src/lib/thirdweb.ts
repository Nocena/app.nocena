// lib/thirdweb.ts
import { createThirdwebClient } from 'thirdweb';
import { polygon } from 'thirdweb/chains';

// Create the client with your Client ID and Secret Key
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
  secretKey: process.env.THIRDWEB_SECRET_KEY, // Add this for server-side operations
});

// Define the chain you want to use
export const chain = polygon;
