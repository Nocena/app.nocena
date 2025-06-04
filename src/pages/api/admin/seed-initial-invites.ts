// pages/api/admin/seed-initial-invites.ts
// Enhanced version with better debugging and error handling

import { NextApiRequest, NextApiResponse } from 'next';
import { generateInviteCode } from '../../../lib/api/dgraph';

// You should set this as an environment variable
const ADMIN_SECRET_KEY = process.env.ADMIN_SEED_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== Admin Seed API Called ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { adminKey, count = 100 } = req.body;

  // Validate admin key
  console.log('Admin key provided:', adminKey ? 'Yes' : 'No');
  console.log('Expected admin key:', ADMIN_SECRET_KEY);

  if (!adminKey || adminKey !== ADMIN_SECRET_KEY) {
    console.log('Admin key validation failed');
    return res.status(403).json({
      error: 'Invalid admin key',
      success: false,
    });
  }

  // Validate count
  if (!count || count < 1 || count > 1000) {
    console.log('Count validation failed:', count);
    return res.status(400).json({
      error: 'Count must be between 1 and 1000',
      success: false,
    });
  }

  console.log(`Starting generation of ${count} invite codes...`);

  try {
    const generatedCodes: string[] = [];
    const errors: string[] = [];

    // Test with a smaller batch first
    const testBatchSize = 5;
    console.log(`Testing with ${testBatchSize} codes first...`);

    for (let i = 0; i < Math.min(testBatchSize, count); i++) {
      try {
        console.log(`Generating code ${i + 1}/${Math.min(testBatchSize, count)}...`);

        // Use 'system' as the userId for admin-generated codes
        const inviteCode = await generateInviteCode('system', 'admin_seed');

        if (inviteCode) {
          generatedCodes.push(inviteCode);
          console.log(`✓ Generated code: ${inviteCode}`);
        } else {
          const errorMsg = `Failed to generate code ${i + 1} - returned null`;
          errors.push(errorMsg);
          console.error(`✗ ${errorMsg}`);
        }
      } catch (error) {
        const errorMsg = `Failed to generate code ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
        console.error('Error details:', error);
      }

      // Small delay between generations
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // If test batch worked, continue with the rest
    if (generatedCodes.length > 0 && count > testBatchSize) {
      console.log(`Test batch successful! Continuing with remaining ${count - testBatchSize} codes...`);

      const remainingCount = count - testBatchSize;
      const batchSize = 10; // Smaller batches for reliability
      const batches = Math.ceil(remainingCount / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, remainingCount);
        const batchCount = batchEnd - batchStart;

        console.log(`Processing batch ${batch + 1}/${batches}: ${batchCount} codes`);

        for (let i = 0; i < batchCount; i++) {
          try {
            const inviteCode = await generateInviteCode('system', 'admin_seed');

            if (inviteCode) {
              generatedCodes.push(inviteCode);
            } else {
              errors.push(`Failed to generate code in batch ${batch + 1}, item ${i + 1}`);
            }
          } catch (error) {
            const errorMsg = `Batch ${batch + 1}, item ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }

          // Small delay between each code
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Delay between batches
        if (batch < batches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }

    console.log(`Generation complete. Generated: ${generatedCodes.length}, Errors: ${errors.length}`);

    // Log first few errors for debugging
    if (errors.length > 0) {
      console.log('First few errors:', errors.slice(0, 5));
    }

    res.json({
      success: true,
      codes: generatedCodes,
      codesCreated: generatedCodes.length,
      codesRequested: count,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Only return first 10 errors
      errorCount: errors.length,
      message: `Successfully generated ${generatedCodes.length} out of ${count} requested invite codes`,
      debugInfo: {
        adminKeyValid: true,
        countValid: true,
        dgraphEndpoint: process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT ? 'Set' : 'Not set',
      },
    });
  } catch (error) {
    console.error('Critical error in seed-initial-invites:', error);

    res.status(500).json({
      error: 'Failed to generate invite codes',
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error',
      debugInfo: {
        adminKeyValid: true,
        countValid: true,
        dgraphEndpoint: process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT ? 'Set' : 'Not set',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      },
    });
  }
}
