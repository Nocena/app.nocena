// utils/realMojiValidation.ts - Validation and testing utilities
import { useAuth } from '../../contexts/AuthContext';

export interface RealMojiValidationResult {
  isValid: boolean;
  error?: string;
  canProceed: boolean;
}

export interface RealMojiTestData {
  userId: string;
  completionId: string;
  reactionType: string;
  imageBlob: Blob;
}

/**
 * Validate RealMoji creation prerequisites
 */
export const validateRealMojiCreation = (
  userId?: string,
  completionId?: string,
  reactionType?: string,
  imageBlob?: Blob,
): RealMojiValidationResult => {
  // Check user authentication
  if (!userId) {
    return {
      isValid: false,
      error: 'User not authenticated',
      canProceed: false,
    };
  }

  // Check completion ID
  if (!completionId) {
    return {
      isValid: false,
      error: 'No completion ID provided',
      canProceed: false,
    };
  }

  // Validate reaction type
  const validReactionTypes = ['thumbsUp', 'love', 'shocked', 'curious', 'fire', 'sad'];
  if (!reactionType || !validReactionTypes.includes(reactionType)) {
    return {
      isValid: false,
      error: `Invalid reaction type. Must be one of: ${validReactionTypes.join(', ')}`,
      canProceed: false,
    };
  }

  // Validate image blob
  if (!imageBlob) {
    return {
      isValid: false,
      error: 'No image provided',
      canProceed: false,
    };
  }

  // Check blob size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (imageBlob.size > maxSize) {
    return {
      isValid: false,
      error: 'Image too large. Maximum size is 10MB',
      canProceed: false,
    };
  }

  // Check blob type
  if (!imageBlob.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Invalid file type. Only images are allowed',
      canProceed: false,
    };
  }

  return {
    isValid: true,
    canProceed: true,
  };
};

/**
 * Test RealMoji creation with dummy data
 */
export const testRealMojiCreation = async (): Promise<boolean> => {
  try {
    console.log('🧪 [RealMoji Test] Starting RealMoji system test...');

    // Create a test image blob (1x1 pixel PNG)
    const testImageData =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testBlob = await fetch(testImageData).then((r) => r.blob());

    const testData: RealMojiTestData = {
      userId: 'test-user-id',
      completionId: 'test-completion-id',
      reactionType: 'thumbsUp',
      imageBlob: testBlob,
    };

    // Validate the test data
    const validation = validateRealMojiCreation(
      testData.userId,
      testData.completionId,
      testData.reactionType,
      testData.imageBlob,
    );

    if (!validation.isValid) {
      console.error('🧪 [RealMoji Test] Validation failed:', validation.error);
      return false;
    }

    console.log('🧪 [RealMoji Test] Validation passed');

    // Test FormData creation
    const formData = new FormData();
    formData.append('image', testData.imageBlob, 'test-realmoji.png');
    formData.append('userId', testData.userId);
    formData.append('completionId', testData.completionId);
    formData.append('reactionType', testData.reactionType);

    console.log('🧪 [RealMoji Test] FormData created successfully');
    console.log('🧪 [RealMoji Test] FormData contents:', {
      hasImage: formData.has('image'),
      hasUserId: formData.has('userId'),
      hasCompletionId: formData.has('completionId'),
      hasReactionType: formData.has('reactionType'),
    });

    return true;
  } catch (error) {
    console.error('🧪 [RealMoji Test] Test failed:', error);
    return false;
  }
};

/**
 * Debug RealMoji API response
 */
export const debugRealMojiResponse = (response: any, responseOk: boolean) => {
  console.log('🐛 [RealMoji Debug] API Response:', {
    ok: responseOk,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
  });

  if (response.data) {
    console.log('🐛 [RealMoji Debug] Response Data:', response.data);
  }
};

/**
 * Get detailed error message for RealMoji failures
 */
export const getRealMojiErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Unknown error occurred';
};

/**
 * Create a test RealMoji capture function for development
 */
export const createTestRealMoji = async (completionId: string, reactionType: string = 'thumbsUp'): Promise<void> => {
  try {
    console.log('🧪 [RealMoji Test] Creating test RealMoji...');

    // Create a colorful test image (32x32 pixels)
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not create canvas context');
    }

    // Draw a colorful pattern
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(16, 0, 16, 16);
    ctx.fillStyle = '#45B7D1';
    ctx.fillRect(0, 16, 16, 16);
    ctx.fillStyle = '#FFA07A';
    ctx.fillRect(16, 16, 16, 16);

    // Add text
    ctx.fillStyle = 'white';
    ctx.font = '8px Arial';
    ctx.fillText('TEST', 4, 20);

    // Convert to blob
    const testBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create test image blob'));
        }
      }, 'image/png');
    });

    console.log('🧪 [RealMoji Test] Test image created:', {
      size: testBlob.size,
      type: testBlob.type,
    });

    // Use the existing RealMoji creation flow
    const formData = new FormData();
    formData.append('image', testBlob, `test-realmoji-${reactionType}-${Date.now()}.png`);
    formData.append('userId', 'test-user');
    formData.append('completionId', completionId);
    formData.append('reactionType', reactionType);

    const response = await fetch('/api/reactions/create', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Test RealMoji creation failed');
    }

    console.log('🧪 [RealMoji Test] Test RealMoji created successfully:', data);
  } catch (error) {
    console.error('🧪 [RealMoji Test] Test creation failed:', error);
    throw error;
  }
};

/**
 * Hook for RealMoji functionality with validation
 */
export const useRealMoji = () => {
  const { user } = useAuth();

  const createRealMoji = async (
    imageBlob: Blob,
    reactionType: string,
    completionId: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      // Validate prerequisites
      const validation = validateRealMojiCreation(user?.id, completionId, reactionType, imageBlob);

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      console.log('🎭 [useRealMoji] Creating RealMoji:', {
        userId: user?.id,
        completionId,
        reactionType,
        imageSize: imageBlob.size,
      });

      // Create FormData
      const formData = new FormData();
      formData.append('image', imageBlob, `realmoji-${reactionType}-${Date.now()}.jpg`);
      formData.append('userId', user!.id);
      formData.append('completionId', completionId);
      formData.append('reactionType', reactionType);

      // Make API call
      const response = await fetch('/api/reactions/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = getRealMojiErrorMessage(data);
        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log('🎭 [useRealMoji] RealMoji created successfully:', data);

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('🎭 [useRealMoji] Error creating RealMoji:', error);
      return {
        success: false,
        error: getRealMojiErrorMessage(error),
      };
    }
  };

  return {
    createRealMoji,
    isAuthenticated: !!user?.id,
    user,
  };
};

// Export all utilities
export default {
  validateRealMojiCreation,
  testRealMojiCreation,
  debugRealMojiResponse,
  getRealMojiErrorMessage,
  createTestRealMoji,
  useRealMoji,
};
