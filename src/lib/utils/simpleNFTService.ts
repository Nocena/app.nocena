// src/lib/nft/simpleNFTService.ts
import axios from 'axios';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

interface NFTGenerationParams {
  challengeCompletionId: string;
  userId: string;
  challengeType: 'ai' | 'private' | 'public';
}

interface NFTData {
  name: string;
  description: string;
  imageUrl: string;
  imageCID: string;
  itemType: string;
  rarity: string;
  tokenBonus: number;
  generationPrompt: string;
}

interface DropRates {
  ai: number;
  private: number;
  public: number;
}

interface RarityRates {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

interface TokenBonuses {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

export class SimpleNFTService {
  // Simple drop rates
  private dropRates: DropRates = {
    ai: 0.15, // 15% for AI challenges
    private: 0.25, // 25% for private challenges
    public: 0.35, // 35% for public challenges
  };

  // Rarity distribution
  private rarityRates: RarityRates = {
    common: 0.7, // 70% - 10% token bonus
    rare: 0.2, // 20% - 15% token bonus
    epic: 0.08, // 8% - 25% token bonus
    legendary: 0.02, // 2% - 50% token bonus
  };

  // Token bonuses by rarity
  private tokenBonuses: TokenBonuses = {
    common: 10,
    rare: 15,
    epic: 25,
    legendary: 50,
  };

  /**
   * Main method: try to generate NFT after challenge completion
   */
  async tryGenerateNFT(params: NFTGenerationParams): Promise<string | null> {
    try {
      // 1. Roll for drop
      if (!this.shouldDrop(params.challengeType)) {
        return null;
      }

      // 2. Determine rarity and item type
      const rarity = this.rollRarity();
      const itemType = this.rollItemType();

      // 3. Generate the NFT using your existing avatar system
      const nftData = await this.generateNFTImage(itemType, rarity);

      // 4. Save to database
      const nftId = await this.saveNFTToDatabase(nftData, params);

      return nftId;
    } catch (error) {
      console.error('NFT generation failed:', error);
      return null;
    }
  }

  private shouldDrop(challengeType: keyof DropRates): boolean {
    const dropRate = this.dropRates[challengeType] || 0.15;
    return Math.random() < dropRate;
  }

  private rollRarity(): keyof RarityRates {
    const roll = Math.random();
    let cumulative = 0;

    for (const [rarity, rate] of Object.entries(this.rarityRates)) {
      cumulative += rate;
      if (roll <= cumulative) {
        return rarity as keyof RarityRates;
      }
    }
    return 'common';
  }

  private rollItemType(): string {
    const types = ['cap', 'hoodie', 'pants', 'shoes'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Generate NFT image using your existing ChainGPT avatar system
   */
  private async generateNFTImage(itemType: string, rarity: keyof RarityRates): Promise<NFTData> {
    // Use your existing clothing template system
    const template = this.getClothingTemplate(itemType, rarity);

    // Call your existing ChainGPT avatar API but for clothing generation
    const response = await fetch('/api/chainGPT/generate-clothing-nft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: template.prompt,
        itemType,
        rarity,
        model: 'velogen',
        width: 512,
        height: 512,
        useTemplate: true,
        templatePath: `/nft/${itemType}.png`, // Use your existing templates
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('NFT image generation failed');
    }

    return {
      name: this.generateName(itemType, rarity),
      description: this.generateDescription(itemType, rarity),
      imageUrl: data.imageUrl,
      imageCID: data.imageCID, // You'd upload to IPFS like with avatars
      itemType,
      rarity,
      tokenBonus: this.tokenBonuses[rarity],
      generationPrompt: template.prompt,
    };
  }

  /**
   * Use your existing template system but for clothing
   */
  private getClothingTemplate(itemType: string, rarity: keyof RarityRates): { prompt: string } {
    const baseTemplates: Record<string, string> = {
      cap: 'stylized 3D cap, futuristic design, clean surfaces, Nocena universe style',
      hoodie: 'stylized 3D hoodie, cyberpunk aesthetic, clean surfaces, Nocena universe style',
      pants: 'stylized 3D pants, futuristic design, clean surfaces, Nocena universe style',
      shoes: 'stylized 3D shoes, high-tech design, clean surfaces, Nocena universe style',
    };

    const rarityEffects: Record<keyof RarityRates, string> = {
      common: 'simple clean design, basic materials',
      rare: 'subtle glow effects, enhanced details',
      epic: 'mystical aura, intricate patterns, particle effects',
      legendary: 'divine radiance, otherworldly design, heavy particle effects',
    };

    const prompt = `${baseTemplates[itemType]}, ${rarityEffects[rarity]}, 
                   high quality 3D render, gaming asset style, isolated on transparent background,
                   professional lighting, similar to existing Nocena clothing templates`;

    return { prompt };
  }

  private generateName(itemType: string, rarity: keyof RarityRates): string {
    const prefixes: Record<keyof RarityRates, string[]> = {
      common: ['Basic', 'Simple', 'Standard'],
      rare: ['Enhanced', 'Superior', 'Advanced'],
      epic: ['Mystic', 'Epic', 'Powerful'],
      legendary: ['Legendary', 'Divine', 'Mythic'],
    };

    const itemNames: Record<string, string> = {
      cap: 'Cap',
      hoodie: 'Hoodie',
      pants: 'Pants',
      shoes: 'Shoes',
    };

    const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
    return `${prefix} ${itemNames[itemType]} of Power`;
  }

  private generateDescription(itemType: string, rarity: keyof RarityRates): string {
    const bonus = this.tokenBonuses[rarity];
    return `A ${rarity} ${itemType} that grants +${bonus}% token bonus in the Nocena universe.`;
  }

  /**
   * Save NFT to database - simple version
   */
  private async saveNFTToDatabase(nftData: NFTData, params: NFTGenerationParams): Promise<string> {
    const nftId = `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const mutation = `
      mutation CreateNFT(
        $id: String!,
        $name: String!,
        $description: String!,
        $itemType: String!,
        $rarity: String!,
        $tokenBonus: Int!,
        $imageUrl: String!,
        $imageCID: String!,
        $generatedAt: DateTime!,
        $generationPrompt: String!,
        $userId: String!
      ) {
        addNFTItem(input: [{
          id: $id,
          name: $name,
          description: $description,
          itemType: $itemType,
          rarity: $rarity,
          tokenBonus: $tokenBonus,
          imageUrl: $imageUrl,
          imageCID: $imageCID,
          generatedAt: $generatedAt,
          generationPrompt: $generationPrompt,
          owner: { id: $userId },
          isEquipped: false
        }]) {
          nFTItem {
            id
          }
        }
      }
    `;

    const variables = {
      id: nftId,
      name: nftData.name,
      description: nftData.description,
      itemType: nftData.itemType,
      rarity: nftData.rarity,
      tokenBonus: nftData.tokenBonus,
      imageUrl: nftData.imageUrl,
      imageCID: nftData.imageCID,
      generatedAt: new Date().toISOString(),
      generationPrompt: nftData.generationPrompt,
      userId: params.userId,
    };

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
    }

    // Update the challenge completion with the NFT reward
    await this.linkNFTToCompletion(params.challengeCompletionId, nftId);

    return nftId;
  }

  private async linkNFTToCompletion(completionId: string, nftId: string): Promise<void> {
    const mutation = `
      mutation LinkNFTToCompletion($completionId: String!, $nftId: String!) {
        updateChallengeCompletion(input: {
          filter: { id: { eq: $completionId } }
          set: { nftReward: { id: $nftId } }
        }) {
          challengeCompletion {
            id
          }
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { completionId, nftId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
    }
  }

  /**
   * Equip/unequip NFT
   */
  async equipNFT(userId: string, nftId: string): Promise<boolean> {
    try {
      // First unequip any currently equipped NFT
      await this.unequipCurrentNFT(userId);

      // Then equip the new one
      const mutation = `
        mutation EquipNFT($userId: String!, $nftId: String!) {
          updateUser(input: {
            filter: { id: { eq: $userId } }
            set: { equippedNFT: { id: $nftId } }
          }) {
            user {
              id
            }
          }
          updateNFTItem(input: {
            filter: { id: { eq: $nftId } }
            set: { isEquipped: true }
          }) {
            nFTItem {
              id
            }
          }
        }
      `;

      const response = await axios.post(
        DGRAPH_ENDPOINT,
        {
          query: mutation,
          variables: { userId, nftId },
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      // Update user's total token bonus
      await this.updateUserTokenBonus(userId);

      return true;
    } catch (error) {
      console.error('Failed to equip NFT:', error);
      return false;
    }
  }

  private async unequipCurrentNFT(userId: string): Promise<void> {
    const mutation = `
      mutation UnequipNFT($userId: String!) {
        updateUser(input: {
          filter: { id: { eq: $userId } }
          remove: { equippedNFT: { id: "any" } }
        }) {
          user {
            id
          }
        }
      }
    `;

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.data.errors) {
      throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
    }
  }

  private async updateUserTokenBonus(userId: string): Promise<void> {
    // Get user's equipped NFT
    const query = `
      query GetEquippedNFT($userId: String!) {
        getUser(id: $userId) {
          equippedNFT {
            tokenBonus
          }
        }
      }
    `;

    const queryResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { userId },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (queryResponse.data.errors) {
      throw new Error(`GraphQL Error: ${queryResponse.data.errors[0].message}`);
    }

    const bonus = queryResponse.data.data?.getUser?.equippedNFT?.tokenBonus || 0;

    // Update user's total token bonus
    const mutation = `
      mutation UpdateTokenBonus($userId: String!, $bonus: Int!) {
        updateUser(input: {
          filter: { id: { eq: $userId } }
          set: { totalTokenBonus: $bonus }
        }) {
          user {
            id
          }
        }
      }
    `;

    const mutationResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { userId, bonus },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (mutationResponse.data.errors) {
      throw new Error(`GraphQL Error: ${mutationResponse.data.errors[0].message}`);
    }
  }
}
