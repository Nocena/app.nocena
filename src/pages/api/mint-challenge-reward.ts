import { NextApiRequest, NextApiResponse } from 'next';
import { createWalletClient, http, keccak256, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { flowTestnet } from 'viem/chains';
import { CONTRACTS } from '../../lib/constants';
import challengeRewardsArtifact from '../../lib/contracts/challengeRewards.json';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, challengeFrequency, ipfsHash } = req.body;

    if (!userAddress || !challengeFrequency || !ipfsHash) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get relayer private key from environment
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      return res.status(500).json({ error: 'Relayer private key not configured' });
    }

    // Ensure private key has 0x prefix
    const formattedPrivateKey = relayerPrivateKey.startsWith('0x') ? relayerPrivateKey : `0x${relayerPrivateKey}`;

    // Create relayer account and wallet client
    const relayerAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account: relayerAccount,
      chain: flowTestnet,
      transport: http(),
    });

    // Determine function name based on frequency
    const functionName = `complete${challengeFrequency.charAt(0).toUpperCase() + challengeFrequency.slice(1)}Challenge`;

    // Create the message hash that matches the contract's expectation
    // Contract uses: keccak256(abi.encode(user, challengeType, ipfsHash))
    const messageHash = keccak256(
      encodeAbiParameters(
        [
          { name: 'user', type: 'address' },
          { name: 'challengeType', type: 'string' },
          { name: 'ipfsHash', type: 'string' },
        ],
        [userAddress as `0x${string}`, challengeFrequency, ipfsHash],
      ),
    );

    // Sign the message hash (viem automatically adds the Ethereum signed message prefix)
    const signature = await walletClient.signMessage({
      message: { raw: messageHash },
    });

    // Call the contract function
    const txHash = await walletClient.writeContract({
      address: CONTRACTS.ChallengeRewards as `0x${string}`,
      abi: challengeRewardsArtifact.abi,
      functionName,
      args: [userAddress, ipfsHash, signature],
    });

    return res.status(200).json({
      success: true,
      txHash,
      functionName,
      message: `${challengeFrequency} challenge reward minted successfully`,
    });
  } catch (error) {
    console.error('Relayer error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
