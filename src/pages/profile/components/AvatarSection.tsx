import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { getUserNFTsByType, updateUserEquippedItems } from '../../../lib/api/dgraph';
import { useAuth } from '../../../contexts/AuthContext';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import PrimaryButton from '../../../components/ui/PrimaryButton';

// Define interfaces locally to fix TypeScript errors
interface NFTItem {
  id: string;
  name: string;
  imageUrl: string;
  itemType: string;
  rarity: string;
  tokenBonus: number;
  description?: string;
  imageCID?: string;
  generatedAt?: string;
  isEquipped?: boolean;
  tokenId?: string;
  mintTransactionHash?: string;
}

interface AvatarSectionProps {
  profilePicture: string | StaticImageData;
  generatedAvatar?: string | null;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
  userID?: string;
  enableAvatarFeature?: boolean;
}

// Predefined prompt suggestions for users
const PROMPT_SUGGESTIONS = [
  'cyberpunk hacker',
  'space explorer',
  'tech wizard',
  'neon warrior',
  'digital samurai',
  'cosmic being',
];

const AvatarSection: React.FC<AvatarSectionProps> = ({
  profilePicture,
  generatedAvatar,
  onAvatarUpdated,
  userID = 'current-user',
  enableAvatarFeature = true,
}) => {
  // State for avatar generation
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');

  // Custom prompt state
  const [customPrompt, setCustomPrompt] = useState('Create a stylized 3D avatar for the Nocena universe');
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);

  // State for NFT selection
  const [selectedNFTs, setSelectedNFTs] = useState<{
    cap: NFTItem | null;
    hoodie: NFTItem | null;
    pants: NFTItem | null;
    shoes: NFTItem | null;
  }>({
    cap: null,
    hoodie: null,
    pants: null,
    shoes: null,
  });

  const [userNFTs, setUserNFTs] = useState<NFTItem[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [updateError, setUpdateError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeClothingType, setActiveClothingType] = useState<'cap' | 'hoodie' | 'pants' | 'shoes' | null>(null);

  // Use actual user from auth context
  const { user, updateUser } = useAuth();

  // Load user's NFTs on component mount
  useEffect(() => {
    if (user?.id && enableAvatarFeature) {
      loadUserNFTs();
      loadEquippedItems();
    }
  }, [user?.id, enableAvatarFeature]);

  const loadUserNFTs = async () => {
    if (!user?.id) return;

    setIsLoadingNFTs(true);
    try {
      // Get user's actual NFTs from database
      const userOwnedNFTs = await getUserNFTsByType(user.id);
      setUserNFTs(userOwnedNFTs);
      console.log('🎨 Loaded user NFTs from database:', userOwnedNFTs.length);
    } catch (error) {
      console.error('Error loading user NFTs:', error);
      // Fallback to empty array if API fails
      setUserNFTs([]);
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const loadEquippedItems = () => {
    // Load currently equipped items from user data
    if (!user) return;

    setSelectedNFTs({
      cap: (user as any).equippedCap || null,
      hoodie: (user as any).equippedHoodie || null,
      pants: (user as any).equippedPants || null,
      shoes: (user as any).equippedShoes || null,
    });
  };

  const hasSelectedNFTs = () => {
    return Object.values(selectedNFTs).some((nft) => nft !== null);
  };

  const handleNFTSelect = async (type: 'cap' | 'hoodie' | 'pants' | 'shoes', nft: NFTItem | null) => {
    setSelectedNFTs((prev) => ({
      ...prev,
      [type]: nft,
    }));

    // Update equipped items in database
    if (user?.id) {
      try {
        await updateUserEquippedItems(user.id, {
          capId: type === 'cap' ? nft?.id || null : selectedNFTs.cap?.id || null,
          hoodieId: type === 'hoodie' ? nft?.id || null : selectedNFTs.hoodie?.id || null,
          pantsId: type === 'pants' ? nft?.id || null : selectedNFTs.pants?.id || null,
          shoesId: type === 'shoes' ? nft?.id || null : selectedNFTs.shoes?.id || null,
        });

        // Update user context
        const updatedEquippedItems = {
          equippedCap: type === 'cap' ? nft : selectedNFTs.cap,
          equippedHoodie: type === 'hoodie' ? nft : selectedNFTs.hoodie,
          equippedPants: type === 'pants' ? nft : selectedNFTs.pants,
          equippedShoes: type === 'shoes' ? nft : selectedNFTs.shoes,
        };

        updateUser(updatedEquippedItems as any);
      } catch (error) {
        console.error('Failed to update equipped items:', error);
      }
    }

    // Auto-apply clothing change immediately (dress-up game style)
    if (generatedAvatar) {
      handleUpdateAvatar();
    }

    console.log(`Selected ${type}:`, nft?.name || 'None');
  };

  // Handle prompt suggestion selection
  const handlePromptSuggestion = (suggestion: string) => {
    const basePrompt = 'Create a stylized 3D avatar for the Nocena universe as a ';
    setCustomPrompt(basePrompt + suggestion);
  };

  // Reset prompt to default
  const resetPrompt = () => {
    setCustomPrompt('Create a stylized 3D avatar for the Nocena universe');
  };

  // Generate avatar function with custom prompt
  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    setGenerationError('');

    try {
      console.log('Generating avatar with custom prompt:', customPrompt);

      let profilePictureString: string;
      if (typeof profilePicture === 'string') {
        profilePictureString = profilePicture;
      } else {
        profilePictureString = profilePicture.src || '/images/profile.png';
      }

      // Call the actual ChainGPT API endpoint
      const response = await fetch('/api/chainGPT/generate-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: customPrompt, // Use the user's custom prompt
          profilePicture: profilePictureString,
          userID: userID,
          model: 'velogen',
          width: 512,
          height: 768,
          enhance: 'original',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Generation response:', data);

      if (data.success) {
        // The API returns the generated avatar URL
        const generatedAvatarUrl = data.ipfsUrl;
        console.log('✅ Avatar generated successfully with custom prompt!');

        if (onAvatarUpdated) {
          onAvatarUpdated(generatedAvatarUrl);
        }

        console.log('🎉 Avatar successfully generated using ChainGPT with custom prompt!');
      } else {
        setGenerationError(data.error || 'Failed to generate avatar');
      }
    } catch (error: any) {
      console.error('Avatar generation failed:', error);
      setGenerationError(`Failed to generate avatar: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!generatedAvatar) return;

    setIsUpdatingAvatar(true);
    setUpdateError('');

    try {
      console.log('Updating avatar with selected NFTs...');

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('🎉 Avatar successfully updated with clothing!');
    } catch (error: any) {
      console.error('Avatar update failed:', error);
      setUpdateError(`Failed to update avatar: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!generatedAvatar || !user?.id) {
      console.error('No avatar to save or user not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      console.log('🎨 Saving avatar to database...');

      // Mock save operation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('✅ Avatar saved successfully!');
      alert('Avatar saved successfully!');
    } catch (error) {
      console.error('Error saving avatar:', error);
      alert('Failed to save avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get clothing type icon
  const getClothingIcon = (type: 'cap' | 'hoodie' | 'pants' | 'shoes') => {
    const icons: Record<'cap' | 'hoodie' | 'pants' | 'shoes', React.JSX.Element> = {
      cap: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L8 5v3h8V5l-4-4z" />
          <path d="M7 9c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2H7z" />
        </svg>
      ),
      hoodie: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3C9.8 3 8 4.8 8 7v2H6v10h12V9h-2V7c0-2.2-1.8-4-4-4zm2 6V7c0-1.1-.9-2-2-2s-2 .9-2 2v2h4z" />
        </svg>
      ),
      pants: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 2v8L6 20h4l1-6 1 6h4l-2-10V2H8zm2 2h4v6l-1 8h-2l-1-8V4z" />
        </svg>
      ),
      shoes: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 18h20c0-1-1-2-2-2H16l-2-2H10l-2 2H4c-1 0-2 1-2 2z" />
        </svg>
      ),
    };
    return icons[type];
  };

  // COMING SOON VIEW
  if (!enableAvatarFeature) {
    return (
      <ThematicContainer asButton={false} glassmorphic={true} color="nocenaPurple" rounded="xl" className="p-6 mx-4">
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-purple-600/30 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Avatar Creation</h2>
          <p className="text-gray-400 text-sm">Coming Soon</p>
        </div>
      </ThematicContainer>
    );
  }

  // MAIN DRESS-UP GAME INTERFACE
  return (
    <div className="space-y-4 px-4">
      {/* Avatar Display & Customization */}
      <ThematicContainer
        asButton={false}
        glassmorphic={true}
        color="nocenaPurple"
        rounded="xl"
        className="overflow-hidden"
      >
        {generatedAvatar ? (
          // Dress-up Game Interface
          <div className="p-4">
            {/* Avatar & Clothing Slots */}
            <div className="relative">
              {/* Main Avatar */}
              <div className="text-center mb-4">
                <div className="relative inline-block">
                  <img
                    src={generatedAvatar}
                    alt="Your Nocena Avatar"
                    className="w-48 h-60 mx-auto rounded-xl shadow-lg border border-white/20 object-cover"
                  />

                  {/* Update indicator */}
                  {isUpdatingAvatar && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <ThematicContainer
                        asButton={false}
                        glassmorphic={true}
                        color="nocenaPurple"
                        rounded="full"
                        className="px-3 py-1 flex items-center gap-2"
                      >
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-white text-xs">Updating...</span>
                      </ThematicContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Clothing Slots - Arranged around avatar */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {(['cap', 'hoodie', 'pants', 'shoes'] as const).map((type) => {
                  const selected = selectedNFTs[type];
                  const isActive = activeClothingType === type;

                  return (
                    <ThematicContainer
                      key={type}
                      asButton={true}
                      glassmorphic={true}
                      color={isActive ? 'nocenaPink' : selected ? 'nocenaBlue' : 'nocenaPurple'}
                      rounded="xl"
                      className="aspect-square p-3 relative"
                      isActive={isActive || !!selected}
                      onClick={() => setActiveClothingType(isActive ? null : type)}
                    >
                      {selected ? (
                        <img
                          src={selected.imageUrl}
                          alt={selected.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          {getClothingIcon(type)}
                          <span className="text-xs mt-1 capitalize">{type}</span>
                        </div>
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-gray-900"></div>
                      )}
                    </ThematicContainer>
                  );
                })}
              </div>

              {/* Clothing Options - Show when category selected */}
              {activeClothingType && (
                <ThematicContainer
                  asButton={false}
                  glassmorphic={true}
                  color="nocenaBlue"
                  rounded="xl"
                  className="p-4 mb-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium capitalize">{activeClothingType}s</h4>
                    <ThematicContainer
                      asButton={true}
                      glassmorphic={false}
                      color="nocenaPink"
                      rounded="lg"
                      className="p-1"
                      onClick={() => setActiveClothingType(null)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </ThematicContainer>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {/* None option */}
                    <ThematicContainer
                      asButton={true}
                      glassmorphic={true}
                      color={!selectedNFTs[activeClothingType] ? 'nocenaPurple' : 'nocenaBlue'}
                      rounded="lg"
                      className="aspect-square p-2"
                      isActive={!selectedNFTs[activeClothingType]}
                      onClick={() => handleNFTSelect(activeClothingType, null)}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </ThematicContainer>

                    {/* Available items */}
                    {userNFTs.filter((nft) => nft.itemType === activeClothingType).length > 0 ? (
                      userNFTs
                        .filter((nft) => nft.itemType === activeClothingType)
                        .map((nft) => (
                          <ThematicContainer
                            key={nft.id}
                            asButton={true}
                            glassmorphic={true}
                            color={selectedNFTs[activeClothingType]?.id === nft.id ? 'nocenaPink' : 'nocenaBlue'}
                            rounded="lg"
                            className="aspect-square p-1 overflow-hidden"
                            isActive={selectedNFTs[activeClothingType]?.id === nft.id}
                            onClick={() => handleNFTSelect(activeClothingType, nft)}
                          >
                            <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover rounded" />
                          </ThematicContainer>
                        ))
                    ) : (
                      /* No items available message */
                      <div className="col-span-3 text-center py-6">
                        <svg
                          className="w-8 h-8 text-gray-500 mx-auto mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                          />
                        </svg>
                        <p className="text-gray-400 text-sm font-medium">No {activeClothingType}s owned</p>
                        <p className="text-gray-500 text-xs mt-1">Complete challenges to earn clothing NFTs</p>
                      </div>
                    )}
                  </div>

                  {/* Selected item info */}
                  {selectedNFTs[activeClothingType] && (
                    <ThematicContainer
                      asButton={false}
                      glassmorphic={true}
                      color="nocenaPurple"
                      rounded="lg"
                      className="mt-3 p-2"
                    >
                      <p className="text-white text-sm font-medium">{selectedNFTs[activeClothingType]!.name}</p>
                      <p className="text-gray-400 text-xs">
                        {selectedNFTs[activeClothingType]!.rarity} • +{selectedNFTs[activeClothingType]!.tokenBonus}{' '}
                        tokens
                      </p>
                    </ThematicContainer>
                  )}
                </ThematicContainer>
              )}
            </div>
          </div>
        ) : (
          // No Avatar Yet View
          <div className="p-6 text-center">
            <div className="w-32 h-40 mx-auto mb-6 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-xl border-2 border-dashed border-purple-400/40 flex items-center justify-center">
              <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <h3 className="text-white text-lg font-bold mb-2">Create Your Avatar</h3>
            <p className="text-gray-300 text-sm mb-6">Generate a unique 3D avatar for the Nocena universe</p>
          </div>
        )}
      </ThematicContainer>

      {/* Prompt Customization - Always visible but compact */}
      <ThematicContainer asButton={false} glassmorphic={true} color="nocenaBlue" rounded="xl" className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <h4 className="text-white font-medium">Avatar Style</h4>
        </div>

        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="w-full p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600/30 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-purple-400 transition-colors mb-3"
          rows={3}
          placeholder="Describe your avatar style..."
          maxLength={500}
        />

        <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
          <span>Tap to edit your avatar description</span>
          <span>{customPrompt.length}/500</span>
        </div>

        {/* Generation Error */}
        {generationError && (
          <ThematicContainer
            asButton={false}
            glassmorphic={true}
            color="nocenaPink"
            rounded="lg"
            className="mb-3 p-3 border border-red-500/30"
          >
            <p className="text-red-300 text-sm">{generationError}</p>
          </ThematicContainer>
        )}

        {/* Generate Button */}
        <PrimaryButton
          text={generatedAvatar ? 'Regenerate Avatar' : 'Generate Avatar'}
          onClick={handleGenerateAvatar}
          disabled={isGeneratingAvatar || !customPrompt.trim()}
          className="w-full py-3"
        />

        {/* Loading state overlay for generate button */}
        {isGeneratingAvatar && (
          <div className="flex items-center justify-center mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-purple-300 text-sm">{generatedAvatar ? 'Regenerating...' : 'Generating...'}</span>
            </div>
          </div>
        )}
      </ThematicContainer>

      {/* Save Button - Only show when avatar exists */}
      {generatedAvatar && (
        <div className="relative">
          <PrimaryButton
            text="Save Avatar"
            onClick={handleSaveAvatar}
            disabled={isSaving}
            className="w-full py-4"
            isActive={true}
          />

          {/* Loading state overlay for save button */}
          {isSaving && (
            <div className="flex items-center justify-center mt-2">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-green-300 text-sm">Saving Avatar...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarSection;
