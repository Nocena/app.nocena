// src/lib/utils/clothingRewardUtils.ts

/**
 * Utility functions for handling clothing NFT reward generation
 * Used for random clothing item selection and prompt generation
 */

export type ClothingTemplate = 'cap' | 'hoodie' | 'pants' | 'shoes';

export interface ClothingTemplateInfo {
  type: ClothingTemplate;
  name: string;
  templatePath: string;
  description: string;
  prompt: string;
  rarity: 'common' | 'rare' | 'epic';
}

export const CLOTHING_TEMPLATES: Record<ClothingTemplate, ClothingTemplateInfo> = {
  cap: {
    type: 'cap',
    name: 'Nocena Cap',
    templatePath: '/nft/cap.png',
    description: 'Futuristic headwear for the Nocena universe',
    prompt:
      'A stylized futuristic cap with neon accents, cyberpunk design elements, holographic materials, and Nocena branding. Clean 3D rendered style with vibrant colors and tech-inspired details.',
    rarity: 'common',
  },
  hoodie: {
    type: 'hoodie',
    name: 'Nocena Hoodie',
    templatePath: '/nft/hoodie.png',
    description: 'Tech-enhanced hoodie with digital patterns',
    prompt:
      'A high-tech hoodie with LED strip accents, digital camouflage patterns, smart fabric textures, and futuristic Nocena logo. Modern streetwear meets cyberpunk aesthetic with glowing elements.',
    rarity: 'common',
  },
  pants: {
    type: 'pants',
    name: 'Nocena Pants',
    templatePath: '/nft/pants.png',
    description: 'Advanced tactical pants with tech integration',
    prompt:
      'Futuristic tactical pants with cargo pockets, tech interfaces, utility belts, and neon trim details. Military-inspired design with cyberpunk elements and Nocena styling.',
    rarity: 'rare',
  },
  shoes: {
    type: 'shoes',
    name: 'Nocena Sneakers',
    templatePath: '/nft/shoes.png',
    description: 'Next-gen sneakers with adaptive technology',
    prompt:
      'High-tech sneakers with LED soles, adaptive smart materials, holographic details, and futuristic Nocena branding. Sleek athletic design with cyberpunk aesthetics and glowing accents.',
    rarity: 'epic',
  },
} as const;

/**
 * Randomly selects a clothing template
 */
export function selectRandomClothingTemplate(): ClothingTemplateInfo {
  const templates = Object.values(CLOTHING_TEMPLATES);
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * Generates an enhanced prompt for clothing NFT creation
 */
export function generateClothingNFTPrompt(templateInfo: ClothingTemplateInfo, userID: string): string {
  const basePrompt = `Create a single NFT clothing item: ${templateInfo.prompt}`;

  // Add Nocena universe styling
  const styleInstructions =
    ' Style it with the Nocena universe aesthetic: deep blue and purple gradients, cyan accent lighting, minimalist geometric design, and clean angular features. Use glassmorphism effects with subtle transparency and professional 3D rendering quality.';

  // Add technical specifications
  const technicalSpecs =
    ' High-quality 3D render with smooth surfaces, proper lighting, and vibrant colors suitable for NFT display. Clean background with subtle tech-grid patterns.';

  // Add uniqueness instructions
  const uniqueness = ` Make this ${templateInfo.name} unique for user ${userID} while maintaining the template design consistency.`;

  // Emphasize single item constraint
  const constraints =
    ' IMPORTANT: Generate only one clothing item, not multiple views or figures. Single NFT clothing piece only.';

  return basePrompt + styleInstructions + technicalSpecs + uniqueness + constraints;
}

/**
 * Gets clothing template by type
 */
export function getClothingTemplate(type: ClothingTemplate): ClothingTemplateInfo {
  return CLOTHING_TEMPLATES[type];
}

/**
 * Validates if a clothing template exists
 */
export async function validateClothingTemplate(templatePath: string): Promise<boolean> {
  try {
    const response = await fetch(templatePath, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Clothing template validation failed:', error);
    return false;
  }
}

/**
 * Prepares clothing NFT generation parameters
 */
export function prepareClothingNFTParams(userID: string, completionId: string, templateInfo: ClothingTemplateInfo) {
  const enhancedPrompt = generateClothingNFTPrompt(templateInfo, userID);

  return {
    userID,
    completionId,
    templateType: templateInfo.type,
    templatePath: templateInfo.templatePath,
    prompt: enhancedPrompt,
    model: 'velogen',
    width: 512,
    height: 512, // Square format for clothing items
    enhance: '2x',
    useTemplate: true,
    clothingInfo: {
      name: templateInfo.name,
      description: templateInfo.description,
      rarity: templateInfo.rarity,
      type: templateInfo.type,
    },
  };
}

/**
 * Progress tracking for clothing NFT generation
 */
export interface ClothingNFTProgress {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number; // 0-100
  collectionId: string;
  templateType: ClothingTemplate;
  resultUrl?: string;
  error?: string;
}

export function createClothingNFTProgressTracker(
  collectionId: string,
  templateType: ClothingTemplate,
): ClothingNFTProgress {
  return {
    status: 'pending',
    progress: 0,
    collectionId,
    templateType,
  };
}

/**
 * Error handling for clothing NFT generation
 */
export interface ClothingNFTError {
  code: string;
  message: string;
  templateType?: ClothingTemplate;
  details?: any;
  suggestions?: string[];
}

export function createClothingNFTError(
  code: string,
  message: string,
  templateType?: ClothingTemplate,
  details?: any,
): ClothingNFTError {
  const suggestions: string[] = [];

  switch (code) {
    case 'TEMPLATE_NOT_FOUND':
      suggestions.push(`Ensure public/nft/${templateType}.png exists in your project`);
      suggestions.push('Check file permissions and accessibility');
      break;
    case 'GENERATION_TIMEOUT':
      suggestions.push('Try generating the reward again');
      suggestions.push('Check your internet connection');
      break;
    case 'API_QUOTA_EXCEEDED':
      suggestions.push('Wait before trying again');
      suggestions.push('Check your ChainGPT API usage limits');
      break;
    case 'RANDOM_SELECTION_FAILED':
      suggestions.push('Ensure all clothing templates are available');
      suggestions.push('Check template configuration');
      break;
  }

  return {
    code,
    message,
    templateType,
    details,
    suggestions,
  };
}

/**
 * Rarity-based rewards (for future expansion)
 */
export function getRewardMultiplier(rarity: 'common' | 'rare' | 'epic'): number {
  switch (rarity) {
    case 'common':
      return 1.0;
    case 'rare':
      return 1.25;
    case 'epic':
      return 1.5;
    default:
      return 1.0;
  }
}

/**
 * Format clothing NFT for display
 */
export interface ClothingNFTDisplay {
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  type: ClothingTemplate;
  collectionId: string;
}

export function formatClothingNFTForDisplay(
  templateInfo: ClothingTemplateInfo,
  imageUrl: string,
  collectionId: string,
): ClothingNFTDisplay {
  return {
    name: templateInfo.name,
    description: templateInfo.description,
    imageUrl,
    rarity: templateInfo.rarity.charAt(0).toUpperCase() + templateInfo.rarity.slice(1),
    type: templateInfo.type,
    collectionId,
  };
}
