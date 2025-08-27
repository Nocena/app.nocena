// src/lib/rewards/clothingNFTService.ts

import {
  selectRandomClothingTemplate,
  prepareClothingNFTParams,
  createClothingNFTProgressTracker,
  createClothingNFTError,
  getClothingTemplate,
  type ClothingNFTProgress,
  type ClothingNFTError,
  type ClothingTemplateInfo,
  type ClothingTemplate,
} from '../utils/clothingRewardUtils';

// Define result interfaces locally to avoid conflicts
interface ClothingNFTGenerationResult {
  success: boolean;
  collectionId?: string;
  templateInfo?: ClothingTemplateInfo;
  message: string;
  error?: ClothingNFTError;
}

interface ClothingNFTStatusResult {
  success: boolean;
  progress?: ClothingNFTProgress;
  isComplete: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Main service for generating clothing NFT rewards
 */
class ClothingNFTService {
  private static instance: ClothingNFTService;

  public static getInstance(): ClothingNFTService {
    if (!ClothingNFTService.instance) {
      ClothingNFTService.instance = new ClothingNFTService();
    }
    return ClothingNFTService.instance;
  }

  /**
   * Generate a random clothing NFT reward for challenge completion
   */
  async generateClothingReward(userId: string, completionId: string): Promise<ClothingNFTGenerationResult> {
    try {
      console.log('🎁 Starting clothing NFT reward generation:', { userId, completionId });

      // Step 1: Randomly select a clothing template
      const templateInfo = selectRandomClothingTemplate();
      console.log('🎲 Random template selected:', templateInfo.type, templateInfo.name);

      // Step 2: Prepare generation parameters
      const generationParams = prepareClothingNFTParams(userId, completionId, templateInfo);
      console.log('📋 Generation params prepared:', {
        templateType: generationParams.templateType,
        model: generationParams.model,
        dimensions: `${generationParams.width}x${generationParams.height}`,
      });

      // Step 3: Call the ChainGPT API
      const response = await fetch('/api/chainGPT/generate-clothing-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationParams),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Clothing NFT generation started:', {
          collectionId: result.collectionId,
          templateType: templateInfo.type,
          templateName: templateInfo.name,
          immediateResult: result.immediateResult,
          imageUrl: result.imageUrl,
        });

        const serviceResult: ClothingNFTGenerationResult = {
          success: true,
          collectionId: result.collectionId,
          templateInfo,
          message: `${templateInfo.name} NFT generation started!`,
        };

        // Pass through immediate result data if available
        if (result.immediateResult && result.imageUrl) {
          (serviceResult as any).immediateResult = true;
          (serviceResult as any).imageUrl = result.imageUrl;
        }

        return serviceResult;
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('❌ Clothing NFT generation failed:', error);

      const nftError = createClothingNFTError(
        'GENERATION_FAILED',
        `Failed to generate clothing NFT: ${error.message || 'Unknown error'}`,
        undefined,
        error,
      );

      return {
        success: false,
        message: 'Failed to generate clothing NFT reward',
        error: nftError,
      };
    }
  }

  /**
   * Check the status of clothing NFT generation
   */
  async checkClothingNFTStatus(collectionId: string): Promise<ClothingNFTStatusResult> {
    try {
      console.log('🔍 Checking clothing NFT status:', collectionId);

      const response = await fetch(`/api/chainGPT/check-clothing-reward-progress?collectionId=${collectionId}`);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.progress) {
        const progress = result.progress;
        console.log('📊 Clothing NFT progress:', progress);

        // Check if generation is completed
        if (progress.data && progress.data.generated && progress.data.images) {
          const imageUrl = progress.data.images[0];
          console.log('✅ Clothing NFT generation completed:', imageUrl);

          return {
            success: true,
            progress: createClothingNFTProgressTracker(collectionId, 'cap'), // Type will be updated by component
            isComplete: true,
            imageUrl,
          };
        } else {
          // Still generating
          return {
            success: true,
            progress: createClothingNFTProgressTracker(collectionId, 'cap'), // Type will be updated by component
            isComplete: false,
          };
        }
      } else {
        throw new Error('Invalid progress response');
      }
    } catch (error: any) {
      console.error('❌ Error checking clothing NFT status:', error);

      return {
        success: false,
        isComplete: false,
        error: error.message || 'Failed to check NFT status',
      };
    }
  }

  /**
   * Poll for clothing NFT completion with automatic retries
   */
  async pollForCompletion(
    collectionId: string,
    onProgress?: (progress: ClothingNFTProgress) => void,
    maxAttempts: number = 24, // 2 minutes with 5-second intervals
  ): Promise<string | null> {
    let attempts = 0;

    const poll = async (): Promise<string | null> => {
      if (attempts >= maxAttempts) {
        console.warn('⏰ Clothing NFT polling timeout reached');
        return null;
      }

      attempts++;
      console.log(`🔄 Polling attempt ${attempts}/${maxAttempts} for collection:`, collectionId);

      try {
        const statusResult = await this.checkClothingNFTStatus(collectionId);

        if (statusResult.success) {
          if (statusResult.isComplete && statusResult.imageUrl) {
            // Generation completed successfully
            console.log('🎉 Clothing NFT polling completed:', statusResult.imageUrl);
            return statusResult.imageUrl;
          } else {
            // Still generating, update progress if callback provided
            if (onProgress && statusResult.progress) {
              statusResult.progress.progress = Math.min((attempts / maxAttempts) * 100, 95);
              onProgress(statusResult.progress);
            }

            // Continue polling
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
            return poll();
          }
        } else {
          // Error in status check
          console.error('❌ Status check failed:', statusResult.error);
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
          return poll();
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
        return poll();
      }
    };

    return poll();
  }

  /**
   * Get clothing template information by type (utility method)
   */
  getTemplateInfo(templateType: string): ClothingTemplateInfo | null {
    try {
      return getClothingTemplate(templateType as ClothingTemplate);
    } catch (error) {
      console.error('Error getting template info:', error);
      return null;
    }
  }
}

// Export singleton instance
const clothingNFTService = ClothingNFTService.getInstance();
export { clothingNFTService };

/**
 * EXPORTED FUNCTIONS - These are the functions your ClaimingScreen needs
 */

/**
 * Generate a clothing NFT reward
 */
export const generateClothingReward = async (
  userId: string,
  completionId: string,
): Promise<ClothingNFTGenerationResult> => {
  return clothingNFTService.generateClothingReward(userId, completionId);
};

/**
 * Check clothing NFT status
 */
export const checkClothingNFTStatus = async (collectionId: string): Promise<ClothingNFTStatusResult> => {
  return clothingNFTService.checkClothingNFTStatus(collectionId);
};

/**
 * Poll for clothing NFT completion
 */
export const pollForClothingNFTCompletion = async (
  collectionId: string,
  onProgress?: (progress: ClothingNFTProgress) => void,
): Promise<string | null> => {
  return clothingNFTService.pollForCompletion(collectionId, onProgress);
};

// Export types for use in other files
export type { ClothingNFTGenerationResult, ClothingNFTStatusResult };
