import { NextApiRequest, NextApiResponse } from 'next';
import { parseEther, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { flowTestnet } from 'viem/chains';
import { CONTRACTS, CHALLENGE_REWARDS } from '../../lib/constants';
import { NOCENITE_ABI } from '../../lib/contracts/noceniteAbi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, challengeFrequency, completionId } = req.body;

    // Validate inputs
    if (!userAddress || !challengeFrequency || !completionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['daily', 'weekly', 'monthly'].includes(challengeFrequency)) {
      return res.status(400).json({ error: 'Invalid challenge frequency' });
    }

    // Get private key from environment
    const privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ SERVICE_ACCOUNT_PRIVATE_KEY not found in environment');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const rewardAmount = CHALLENGE_REWARDS[challengeFrequency.toUpperCase() as keyof typeof CHALLENGE_REWARDS];

    // Create service account wallet
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: flowTestnet,
      transport: http(),
    });

    // Mint tokens
    const txHash = await walletClient.writeContract({
      address: CONTRACTS.Nocenite as `0x${string}`,
      abi: NOCENITE_ABI,
      functionName: 'mint',
      args: [userAddress as `0x${string}`, parseEther(rewardAmount.toString())],
    });

    console.log(`✅ Minted ${rewardAmount} NCT to ${userAddress}, tx: ${txHash}`);

    return res.status(200).json({
      success: true,
      txHash,
      rewardAmount,
    });
  } catch (error) {
    console.error('❌ Mint failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Minting failed',
    });
  }
}
