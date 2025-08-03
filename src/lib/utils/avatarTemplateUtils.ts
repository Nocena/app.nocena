// src/lib/utils/avatarTemplateUtils.ts

/**
 * Utility functions for handling avatar template integration
 * Used to ensure consistent avatar generation using the public/nft/avatar.png template
 */

export interface AvatarGenerationConfig {
  useTemplate: boolean;
  templatePath: string;
  enhanceWithProfile: boolean;
  styleKeywords: string[];
  qualitySettings: {
    width: number;
    height: number;
    enhance: '1x' | '2x' | 'original';
    model: string;
  };
}

export const DEFAULT_AVATAR_CONFIG: AvatarGenerationConfig = {
  useTemplate: true,
  templatePath: '/nft/avatar.png',
  enhanceWithProfile: true,
  styleKeywords: [
    'stylized 3D',
    'clean rendering',
    'smooth surfaces',
    'modern cartoon style',
    'neon lighting',
    'simplified features',
    'soft shadows',
    'rim lighting',
    'full-body view',
    'vibrant colors',
    'contemporary 3D design',
    'rounded geometry',
  ],
  qualitySettings: {
    width: 512,
    height: 768,
    enhance: '2x',
    model: 'velogen',
  },
};

/**
 * Generates an enhanced prompt for avatar creation based on template and user inputs
 */
export function generateTemplateBasedPrompt(
  basePrompt: string,
  config: Partial<AvatarGenerationConfig> = {},
  hasProfilePicture: boolean = false,
): string {
  const fullConfig = { ...DEFAULT_AVATAR_CONFIG, ...config };

  // Start with clear single character instruction
  let enhancedPrompt = 'A single stylized 3D avatar character';

  // Add template style instructions
  if (fullConfig.useTemplate) {
    enhancedPrompt +=
      ' following the exact art style, proportions, and aesthetic of the Nocena avatar template. Maintain the same clean 3D rendered visual style, color palette, and smooth geometric approach.';
  }

  // Add profile picture integration instructions
  if (hasProfilePicture && fullConfig.enhanceWithProfile) {
    enhancedPrompt +=
      " Incorporate hair style, body proportions, and general physical characteristics from the user's profile picture while maintaining the template's stylized 3D rendering style and simplified aesthetic.";
  }

  // Add style keywords with single character emphasis
  const styleDescription = fullConfig.styleKeywords.join(', ');
  enhancedPrompt += ` Create ONE CHARACTER using these style elements: ${styleDescription}. The avatar should be suitable for the Nocena universe with a clean, stylized, and modern 3D appearance.`;

  // Add technical specifications with single character constraint
  enhancedPrompt +=
    ' Ensure high quality 3D rendering with smooth surfaces, proper lighting, and professional stylized quality similar to modern animated films. IMPORTANT: Generate only one character, not multiple views or figures.';

  return enhancedPrompt;
}

/**
 * Validates if the avatar template exists and is accessible
 */
export async function validateAvatarTemplate(templatePath: string = '/nft/avatar.png'): Promise<boolean> {
  try {
    const response = await fetch(templatePath, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Avatar template validation failed:', error);
    return false;
  }
}

/**
 * Prepares avatar generation parameters for API call
 */
export function prepareAvatarGenerationParams(
  userID: string,
  prompt: string,
  profilePicture?: string,
  customConfig?: Partial<AvatarGenerationConfig>,
) {
  const config = { ...DEFAULT_AVATAR_CONFIG, ...customConfig };

  const enhancedPrompt = generateTemplateBasedPrompt(prompt, config, !!profilePicture);

  // Only include parameters supported by ChainGPT
  const params: any = {
    userID,
    prompt: enhancedPrompt,
    profilePicture,
    model: config.qualitySettings.model,
    width: config.qualitySettings.width,
    height: config.qualitySettings.height,
    useTemplate: config.useTemplate,
    templatePath: config.templatePath,
  };

  // Only add enhance if it's not 'original'
  if (config.qualitySettings.enhance !== 'original') {
    params.enhance = config.qualitySettings.enhance;
  }

  return params;
}

/**
 * Clothing item categories and their style descriptions
 */
export const CLOTHING_CATEGORIES = {
  cap: {
    name: 'Cap/Hat',
    description: 'Headwear including caps, beanies, helmets, and hats',
    prompt: 'stylish headwear that complements the futuristic avatar design',
  },
  hoodie: {
    name: 'Hoodie/Top',
    description: 'Upper body clothing including hoodies, shirts, jackets',
    prompt: 'futuristic upper body clothing with cyberpunk styling',
  },
  pants: {
    name: 'Pants/Bottoms',
    description: 'Lower body clothing including pants, shorts, skirts',
    prompt: 'modern lower body garments with tech-inspired details',
  },
  shoes: {
    name: 'Shoes/Footwear',
    description: 'Footwear including sneakers, boots, and futuristic shoes',
    prompt: 'high-tech footwear with futuristic design elements',
  },
} as const;

/**
 * Generates clothing integration prompt for avatar updates
 */
export function generateClothingIntegrationPrompt(
  clothingTypes: (keyof typeof CLOTHING_CATEGORIES)[],
  baseAvatarDescription: string = 'futuristic low-poly avatar',
): string {
  if (clothingTypes.length === 0) {
    return baseAvatarDescription;
  }

  const clothingDescriptions = clothingTypes.map((type) => CLOTHING_CATEGORIES[type].prompt).join(', ');

  return `${baseAvatarDescription} wearing ${clothingDescriptions}. Integrate the clothing items seamlessly while maintaining the avatar's original style, proportions, and color scheme. Ensure the clothing enhances the futuristic aesthetic.`;
}

/**
 * Progress tracking utilities for avatar generation
 */
export interface AvatarGenerationProgress {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  currentStep?: string;
  collectionId: string;
  resultUrl?: string;
}

export function createProgressTracker(collectionId: string): AvatarGenerationProgress {
  return {
    status: 'pending',
    progress: 0,
    collectionId,
    currentStep: 'Initializing avatar generation...',
  };
}

/**
 * Error handling for avatar generation
 */
export interface AvatarGenerationError {
  code: string;
  message: string;
  details?: any;
  suggestions?: string[];
}

export function createAvatarError(code: string, message: string, details?: any): AvatarGenerationError {
  const suggestions: string[] = [];

  switch (code) {
    case 'TEMPLATE_NOT_FOUND':
      suggestions.push('Ensure public/nft/avatar.png exists in your project');
      suggestions.push('Check file permissions and accessibility');
      break;
    case 'PROFILE_PICTURE_INVALID':
      suggestions.push('Use a clear, high-quality profile picture');
      suggestions.push('Ensure the image format is supported (JPEG, PNG)');
      break;
    case 'GENERATION_TIMEOUT':
      suggestions.push('Try again with a simpler prompt');
      suggestions.push('Check your internet connection');
      break;
    case 'API_QUOTA_EXCEEDED':
      suggestions.push('Wait before trying again');
      suggestions.push('Check your ChainGPT API usage limits');
      break;
  }

  return {
    code,
    message,
    details,
    suggestions,
  };
}

/**
 * Avatar quality assessment utilities
 */
export interface AvatarQualityMetrics {
  resolution: { width: number; height: number };
  fileSize: number;
  hasTemplate: boolean;
  hasProfileIntegration: boolean;
  styleConsistency: number; // 0-1 score
  renderQuality: number; // 0-1 score
}

export function assessAvatarQuality(avatarUrl: string, generationParams: any): Promise<AvatarQualityMetrics> {
  // This would be implemented with actual image analysis
  // For now, return mock data based on generation parameters
  return Promise.resolve({
    resolution: {
      width: generationParams.width || 512,
      height: generationParams.height || 768,
    },
    fileSize: 0, // Would be calculated from actual image
    hasTemplate: generationParams.useTemplate || false,
    hasProfileIntegration: !!generationParams.profilePicture,
    styleConsistency: 0.85, // Mock score
    renderQuality: 0.9, // Mock score
  });
}
