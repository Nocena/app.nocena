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

  // Load prompt when generatedAvatar changes
  useEffect(() => {
    if (user?.id && generatedAvatar && enableAvatarFeature) {
      loadCurrentAvatarPrompt();
    }
  }, [user?.id, generatedAvatar, enableAvatarFeature]);

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

  const loadCurrentAvatarPrompt = async () => {
    if (!user?.id || !generatedAvatar) return;

    try {
      const { getUserAvatarByImageUrl } = await import('../../../lib/api/dgraph');

      // Get the avatar record that matches the currently displayed avatar URL
      const avatarData = await getUserAvatarByImageUrl(user.id, generatedAvatar);

      if (avatarData?.generationPrompt) {
        console.log('🎨 Loading prompt from current avatar:', avatarData.generationPrompt);
        setCustomPrompt(avatarData.generationPrompt);
      } else {
        console.log('🎨 No prompt found for current avatar, keeping existing prompt');
      }
    } catch (error) {
      console.error('Error loading current avatar prompt:', error);
    }
  };

  const loadEquippedItems = async () => {
    // Load currently equipped items from user data
    if (!user) return;

    setSelectedNFTs({
      cap: (user as any).equippedCap || null,
      hoodie: (user as any).equippedHoodie || null,
      pants: (user as any).equippedPants || null,
      shoes: (user as any).equippedShoes || null,
    });

    // Only load fallback prompt if no avatar is currently displayed
    if (user?.id && !generatedAvatar) {
      try {
        const { getUserAvatar } = await import('../../../lib/api/dgraph');
        const avatarData = await getUserAvatar(user.id);

        if (avatarData?.avatarRecord?.generationPrompt) {
          console.log('🎨 Loading fallback prompt from user avatar:', avatarData.avatarRecord.generationPrompt);
          setCustomPrompt(avatarData.avatarRecord.generationPrompt);
        }
      } catch (error) {
        console.error('Error loading user avatar prompt:', error);
      }
    }
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

      // Import the saveUserAvatar function
      const { saveUserAvatar } = await import('../../../lib/api/dgraph');

      // Extract CIDs from URLs if they exist
      let baseImageCID: string | undefined;
      let generatedImageCID: string | undefined;

      // Extract IPFS CID from generated avatar URL
      if (generatedAvatar.includes('ipfs')) {
        const cidMatch = generatedAvatar.match(/\/ipfs\/([^/?]+)/);
        if (cidMatch) {
          generatedImageCID = cidMatch[1];
        }
      }

      // Extract base image CID if profile picture is IPFS URL
      const baseImageUrl = typeof profilePicture === 'string' ? profilePicture : profilePicture.src;
      if (baseImageUrl.includes('ipfs')) {
        const baseCidMatch = baseImageUrl.match(/\/ipfs\/([^/?]+)/);
        if (baseCidMatch) {
          baseImageCID = baseCidMatch[1];
        }
      }

      // Prepare avatar data
      const avatarData = {
        userId: user.id,
        baseImageUrl: baseImageUrl,
        generatedImageUrl: generatedAvatar,
        baseImageCID,
        generatedImageCID,
        equippedCapId: selectedNFTs.cap?.id,
        equippedHoodieId: selectedNFTs.hoodie?.id,
        equippedPantsId: selectedNFTs.pants?.id,
        equippedShoesId: selectedNFTs.shoes?.id,
        generationPrompt: customPrompt,
      };

      console.log('🎨 Avatar data to save:', {
        userId: avatarData.userId,
        hasGeneratedImage: !!avatarData.generatedImageUrl,
        hasPrompt: !!avatarData.generationPrompt,
        equippedItems: {
          cap: !!avatarData.equippedCapId,
          hoodie: !!avatarData.equippedHoodieId,
          pants: !!avatarData.equippedPantsId,
          shoes: !!avatarData.equippedShoesId,
        },
      });

      // Save to database
      const result = await saveUserAvatar(avatarData);

      if (result.success) {
        console.log('✅ Avatar saved successfully to database!', result.avatarId);

        // Update the user context to reflect the new avatar
        if (updateUser) {
          updateUser({
            currentAvatar: generatedAvatar,
            equippedCap: selectedNFTs.cap,
            equippedHoodie: selectedNFTs.hoodie,
            equippedPants: selectedNFTs.pants,
            equippedShoes: selectedNFTs.shoes,
          } as any);
        }

        alert('Avatar saved successfully!');
      } else {
        console.error('❌ Failed to save avatar:', result.error);
        alert(`Failed to save avatar: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving avatar:', error);
      alert('Failed to save avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get clothing type icon with exact SVGs provided
  const getClothingIcon = (type: 'cap' | 'hoodie' | 'pants' | 'shoes') => {
    const icons: Record<'cap' | 'hoodie' | 'pants' | 'shoes', React.JSX.Element> = {
      cap: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
          <g>
            <g>
              <path d="M509.918,403.41l-15.035-48.865v-58.649c0-116.731-90.651-212.683-205.252-221.166c0.017-0.383,0.037-0.765,0.037-1.15 c0-13.85-11.268-25.117-25.117-25.117H247.45c-13.85,0-25.117,11.268-25.117,25.117c0,0.385,0.02,0.767,0.037,1.15 C107.769,83.215,17.118,179.166,17.118,295.897v58.649L2.082,403.41c-4.736,15.39-1.28,31.866,9.242,44.072 c10.442,12.114,26.091,17.916,41.862,15.524c59.195-8.985,129.327-13.733,202.814-13.733s143.62,4.749,202.814,13.733 c2.343,0.356,4.681,0.53,7.002,0.53c13.3,0,25.968-5.74,34.86-16.055C511.199,435.276,514.654,418.801,509.918,403.41z M478.851,295.896v49.404c-18.251-4.671-38.751-8.705-60.923-12.039v-37.365c0-58.664-15.301-113.924-43.087-155.602 c-10.431-15.647-22.17-28.703-34.863-38.981C420.698,129.134,478.851,205.848,478.851,295.896z M441.833,353.55l18.28,58.863 c-60.287-8.755-130.694-13.375-204.113-13.375s-143.822,4.62-204.113,13.375l18.28-58.863 c52.422-9.923,117.635-15.435,185.833-15.435S389.412,343.626,441.833,353.55z M247.45,64.495h17.101 c5.01,0,9.085,4.075,9.085,9.085c0,0.182-0.025,0.36-0.035,0.541c-0.167,0-0.332-0.006-0.499-0.006h-5.7H244.6h-5.7 c-0.167,0-0.332,0.006-0.499,0.006c-0.012-0.181-0.036-0.359-0.036-0.541C238.365,68.571,242.44,64.495,247.45,64.495z M244.599,90.147h22.801c74.161,0,134.494,92.299,134.494,205.749v35.113c-44.286-5.794-94.29-8.927-145.895-8.927 s-101.609,3.133-145.895,8.927v-35.113C110.106,182.446,170.44,90.147,244.599,90.147z M33.15,295.897 c0-90.05,58.153-166.764,138.873-194.583c-12.693,10.279-24.432,23.336-34.863,38.981 c-27.785,41.677-43.087,96.937-43.087,155.602v37.365c-22.172,3.336-42.672,7.369-60.923,12.039V295.897z M488.533,437.014 c-6.819,7.91-17.032,11.7-27.313,10.141c-59.977-9.103-130.941-13.915-205.22-13.915s-145.244,4.812-205.22,13.915 c-10.282,1.562-20.493-2.231-27.313-10.141c-6.899-8.002-9.165-18.803-6.061-28.889l14.098-45.82 c6.587-1.784,13.516-3.475,20.733-5.077l-17.465,56.238c-1.591,5.17,0.475,9.063,1.848,10.921 c2.72,3.685,6.956,5.485,11.433,4.802c60.862-9.238,132.77-14.119,207.947-14.119s147.084,4.882,207.942,14.119 c0.657,0.1,1.313,0.151,1.945,0.151c3.707,0,7.167-1.805,9.49-4.952c1.373-1.859,3.439-5.748,1.844-10.939l-17.459-56.221 c7.217,1.603,14.147,3.294,20.733,5.077l14.098,45.82C497.699,418.212,495.433,429.011,488.533,437.014z"></path>
            </g>
          </g>
          <g>
            <g>
              <path d="M281.652,245.127h-51.304c-13.85,0-25.117,11.268-25.117,25.117s11.268,25.117,25.117,25.117h51.304 c13.85,0,25.117-11.268,25.117-25.117S295.502,245.127,281.652,245.127z M281.652,279.329h-51.304 c-5.01,0-9.085-4.075-9.085-9.085c0-5.01,4.075-9.085,9.085-9.085h51.304c5.01,0,9.085,4.075,9.085,9.085 S286.662,279.329,281.652,279.329z"></path>
            </g>
          </g>
        </svg>
      ),
      hoodie: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15,15a1,1,0,0,1-1,1H10a1,1,0,0,1,0-2h4A1,1,0,0,1,15,15Zm8-6.146V18a1,1,0,0,1-1,1H19v3a1,1,0,0,1-1,1H6a1,1,0,0,1-1-1V19H2a1,1,0,0,1-1-1V8.854A3.98,3.98,0,0,1,3.211,5.276l.705-.352,1.492-.746A8.846,8.846,0,0,1,12,1a8.813,8.813,0,0,1,6.592,3.178l1.492.746.705.352A3.98,3.98,0,0,1,23,8.854ZM19.994,7.121C18.548,9.606,19.137,11.524,19,14h2V8.854A1.985,1.985,0,0,0,19.994,7.121ZM7,18H17V10.728a9.471,9.471,0,0,1,1.188-4.516l-.265-.132L15,7.054V11a1,1,0,0,1-2,0V7.72A3.674,3.674,0,0,1,12,8a3.729,3.729,0,0,1-1-.28V9A1,1,0,0,1,9,9V7.054L6.077,6.08l-.265.132A9.464,9.464,0,0,1,7,10.728ZM7.863,4.567,12,5.946l4.137-1.379a6.244,6.244,0,0,0-8.274,0ZM3,8.854V14H5c-.138-2.494.454-4.383-.994-6.879A1.987,1.987,0,0,0,3,8.854ZM5,17V16H3v1Zm12,4V20H7v1Zm4-4V16H19v1Z"></path>
        </svg>
      ),
      pants: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
          <g transform="translate(1 1)">
            <g>
              <path d="M382.362,48.435c-0.545-5.324-3.548-9.945-7.894-12.678v-19.69C374.467,6.643,366.824-1,357.401-1h-204.8 c-9.423,0-17.067,7.643-17.067,17.067v19.693c-5.086,3.2-8.362,8.985-7.979,15.456l24.576,409.607 c0.371,6.117,3.934,11.311,9.003,14.024v19.086c0,9.423,7.643,17.067,17.067,17.067h34.133c9.423,0,17.067-7.643,17.067-17.067 v-19.224c5.082-2.83,8.583-8.174,8.778-14.385l7.834-264.814c0.128-4.893,4.117-8.777,8.989-8.777c4.87,0,8.853,3.881,8.98,8.747 l7.843,264.828c0.184,6.218,3.688,11.567,8.775,14.4v19.225c0,9.423,7.643,17.067,17.067,17.067h34.133 c9.423,0,17.067-7.643,17.067-17.067v-19.085c5.067-2.712,8.627-7.906,8.997-14.02l19.431-323.855 c0.001-0.01,0.003-0.019,0.004-0.03l5.146-85.717C382.501,50.277,382.457,49.349,382.362,48.435z M361.153,121.069 c-12.974-11.133-20.821-27.5-20.821-45.266v-25.6h25.071c0.001,0-0.312,5.231-0.768,12.844L361.153,121.069z M144.592,50.203 c0,0.003,25.078-0.001,25.078-0.001v25.6c0,17.768-7.848,34.135-20.824,45.268L144.592,50.203z M152.601,16.067h204.8v17.067 h-204.8V16.067z M212.334,493.933h-34.133v-17.067h34.133V493.933z M331.801,493.933h-34.133v-17.067h34.133V493.933z M340.829,459.8h-0.495h-51.2h-0.246c-0.002,0-7.846-264.794-7.846-264.794c-0.367-14.085-11.918-25.339-26.04-25.339 c-14.123,0-25.681,11.254-26.049,25.369l-7.833,264.768c0,0-0.07,0-0.193-0.001c-0.02,0-0.04-0.003-0.06-0.003h-10.263 c-15.179-0.002-41.43,0-41.43,0c-0.002,0-11.878-197.883-19.12-318.567c22.501-13.8,36.682-38.351,36.682-65.431V50.202 c12.402,0,26.695,0,41.684,0c-0.04,0.033-0.082,0.064-0.123,0.097c-5.433,4.398-10.142,8.7-13.938,12.864 c-6.78,7.437-10.644,14.282-10.558,21.275c0.058,4.712,3.925,8.486,8.637,8.428c4.712-0.058,8.486-3.925,8.428-8.637 c-0.018-1.488,2.004-5.069,6.106-9.569c3.145-3.451,7.248-7.198,12.064-11.096c4.289-3.472,8.899-6.87,13.526-10.055 c2.623,3.729,5.493,7.435,8.573,10.948c10.742,12.251,21.746,19.855,33.492,20.067c1.455,0.026,2.903-0.069,4.337-0.289 c4.658-0.716,7.853-5.073,7.137-9.731c-0.716-4.658-5.073-7.853-9.731-7.137c-0.465,0.071-0.941,0.103-1.435,0.094 c-5.579-0.101-13.136-5.323-20.968-14.255c-0.859-0.98-1.698-1.985-2.524-3.004c18.645,0,36.648,0,51.822-0.001v25.602 c0,27.078,14.18,51.627,36.678,65.428L340.829,459.8z"></path>
            </g>
          </g>
        </svg>
      ),
      shoes: (
        <svg
          className="w-5 h-5"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 32 32"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3,8v17h26v-4.5c0-2-1.5-3.7-3.5-4l-5.6-0.7C16,15.4,13,12,13,8v0H3z"></path>
          <line x1="3" y1="22" x2="29" y2="22"></line>
          <circle cx="8" cy="15" r="2"></circle>
          <path d="M20,22L20,22c0-1.9,0.8-3.7,2.3-5l0.6-0.5"></path>
        </svg>
      ),
    };
    return icons[type];
  };

  // COMING SOON VIEW
  if (!enableAvatarFeature) {
    return (
      <ThematicContainer asButton={false} glassmorphic={true} color="nocenaPink" rounded="xl" className="p-6 mx-4">
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

  // UNIFIED AVATAR INTERFACE - Single container for visual consistency
  return (
    <div className="px-4">
      <ThematicContainer
        asButton={false}
        glassmorphic={true}
        color="nocenaPink"
        rounded="xl"
        className="overflow-hidden"
      >
        <div className="p-6">
          {/* Avatar Display Section */}
          <div className="text-center mb-6">
            {generatedAvatar ? (
              <div className="relative inline-block">
                <img
                  src={generatedAvatar}
                  alt="Your Nocena Avatar"
                  className="w-48 h-60 mx-auto rounded-xl shadow-lg border border-white/20 object-cover"
                />

                {/* Update indicator */}
                {isUpdatingAvatar && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <div className="bg-purple-600/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-white text-xs">Updating...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-48 h-60 mx-auto mb-4 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl border-2 border-dashed border-purple-400/30 flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-purple-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <h3 className="text-white text-sm font-medium mb-1">Create Your Avatar</h3>
                  <p className="text-gray-400 text-xs">Generate a unique 3D avatar</p>
                </div>
              </div>
            )}
          </div>

          {/* Clothing Slots - Only show if avatar exists */}
          {generatedAvatar && (
            <div className="mb-6">
              <h4 className="text-white font-medium mb-4 text-center">Customize Clothing</h4>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {(['cap', 'hoodie', 'pants', 'shoes'] as const).map((type) => {
                  const selected = selectedNFTs[type];
                  const isActive = activeClothingType === type;

                  return (
                    <div key={type} className="text-center">
                      <div
                        className={`
                          aspect-square p-3 rounded-xl cursor-pointer transition-all duration-200 relative
                          border-2 backdrop-blur-sm
                          ${
                            isActive
                              ? 'bg-pink-500/30 border-pink-400/60 shadow-lg shadow-pink-500/20'
                              : selected
                                ? 'bg-blue-500/20 border-blue-400/40 hover:bg-blue-500/30'
                                : 'bg-purple-600/20 border-purple-400/30 hover:bg-purple-600/30'
                          }
                        `}
                        onClick={() => setActiveClothingType(isActive ? null : type)}
                      >
                        {selected ? (
                          <img
                            src={selected.imageUrl}
                            alt={selected.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {getClothingIcon(type)}
                          </div>
                        )}

                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                        )}
                      </div>
                      <span className="text-xs text-gray-300 mt-1 block capitalize">{type}</span>
                    </div>
                  );
                })}
              </div>

              {/* Clothing Options - Show when category selected */}
              {activeClothingType && (
                <div className="bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-white font-medium capitalize">{activeClothingType}s</h5>
                    <button
                      className="w-6 h-6 bg-pink-500/30 backdrop-blur-sm border border-pink-400/40 rounded-lg flex items-center justify-center text-pink-300 hover:bg-pink-500/40 transition-colors"
                      onClick={() => setActiveClothingType(null)}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {/* None option */}
                    <div
                      className={`
                        aspect-square p-2 rounded-lg cursor-pointer transition-all backdrop-blur-sm border
                        ${
                          !selectedNFTs[activeClothingType]
                            ? 'bg-purple-500/30 border-purple-400/60'
                            : 'bg-gray-600/20 border-gray-500/30 hover:bg-gray-600/30'
                        }
                      `}
                      onClick={() => handleNFTSelect(activeClothingType, null)}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>

                    {/* Available items */}
                    {userNFTs.filter((nft) => nft.itemType === activeClothingType).length > 0 ? (
                      userNFTs
                        .filter((nft) => nft.itemType === activeClothingType)
                        .map((nft) => (
                          <div
                            key={nft.id}
                            className={`
                              aspect-square p-1 rounded-lg cursor-pointer transition-all backdrop-blur-sm border overflow-hidden
                              ${
                                selectedNFTs[activeClothingType]?.id === nft.id
                                  ? 'bg-pink-500/30 border-pink-400/60 shadow-lg shadow-pink-500/20'
                                  : 'bg-blue-600/20 border-blue-400/30 hover:bg-blue-600/30'
                              }
                            `}
                            onClick={() => handleNFTSelect(activeClothingType, nft)}
                          >
                            <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover rounded" />
                          </div>
                        ))
                    ) : (
                      /* No items available message */
                      <div className="col-span-3 text-center py-4">
                        <svg
                          className="w-6 h-6 text-gray-500 mx-auto mb-2"
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
                        <p className="text-gray-400 text-xs font-medium">No {activeClothingType}s owned</p>
                        <p className="text-gray-500 text-xs mt-1">Complete challenges to earn items</p>
                      </div>
                    )}
                  </div>

                  {/* Selected item info */}
                  {selectedNFTs[activeClothingType] && (
                    <div className="mt-3 p-3 bg-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-lg">
                      <p className="text-white text-sm font-medium">{selectedNFTs[activeClothingType]!.name}</p>
                      <p className="text-gray-400 text-xs">
                        {selectedNFTs[activeClothingType]!.rarity} • +{selectedNFTs[activeClothingType]!.tokenBonus}{' '}
                        tokens
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Avatar Style Prompt Section */}
          <div className="mb-6">
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
              className="w-full p-4 bg-gray-800/30 backdrop-blur-sm border border-gray-600/30 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-purple-400 focus:bg-gray-800/40 transition-all mb-3"
              rows={3}
              placeholder="Describe your avatar style..."
              maxLength={500}
            />

            <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
              <span>Describe your ideal avatar appearance</span>
              <span>{customPrompt.length}/500</span>
            </div>

            {/* Generation Error */}
            {generationError && (
              <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-400/40 rounded-lg">
                <p className="text-red-300 text-sm">{generationError}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Generate Button */}
            <PrimaryButton
              text={generatedAvatar ? 'Regenerate Avatar' : 'Generate Avatar'}
              onClick={handleGenerateAvatar}
              disabled={isGeneratingAvatar || !customPrompt.trim()}
              className="w-full py-3"
              isActive={true}
            />

            {/* Loading state for generation */}
            {isGeneratingAvatar && (
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-purple-300 text-sm">
                    {generatedAvatar ? 'Regenerating...' : 'Generating avatar...'}
                  </span>
                </div>
              </div>
            )}

            {/* Save Button - Only show when avatar exists */}
            {generatedAvatar && (
              <>
                <PrimaryButton
                  text="Save Avatar"
                  onClick={handleSaveAvatar}
                  disabled={isSaving}
                  className="w-full py-3"
                />

                {/* Loading state for saving */}
                {isSaving && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-green-300 text-sm">Saving avatar...</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </ThematicContainer>
    </div>
  );
};

export default AvatarSection;
