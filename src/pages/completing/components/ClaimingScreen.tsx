'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import {
  completeChallengeWorkflow,
  CompletionData,
  saveNFTRewardAfterCompletion,
} from '../../../lib/completing/challengeCompletionService';
import { useAuth } from '../../../contexts/AuthContext';
import { useBackgroundTasks } from '../../../contexts/BackgroundTaskContext';

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
  type: 'AI' | 'PRIVATE' | 'PUBLIC';
  frequency?: 'daily' | 'weekly' | 'monthly';
  challengeId?: string;
  creatorId?: string;
}

interface BackgroundTasks {
  videoAnalysisId?: string;
  nftGenerationId?: string;
  verificationPrepId?: string;
  faceMatchingId?: string;
}

interface ClaimingScreenProps {
  challenge: Challenge;
  videoBlob: Blob;
  photoBlob: Blob;
  verificationResult: any;
  onClaimComplete: (result: any) => void;
  onBack: () => void;
  onCancel: () => void;
  backgroundTaskIds: BackgroundTasks;
}

// Updated NFT Generation States with rarity system
interface NFTState {
  status: 'idle' | 'generating' | 'completed' | 'failed' | 'saved' | 'background-ready';
  collectionId: string | null;
  templateType: string | null;
  templateName: string | null;
  imageUrl: string | null;
  progress: number;
  error: string | null;
  nftId?: string;
  backgroundTaskUsed?: boolean;
  // New rarity system fields
  rarity?: string;
  tokenBonus?: number;
  itemType?: string;
}

type RarityStyle = {
  borderColor: string;
  textColor: string;
  bgColor: string;
  glowColor: string;
  gradient: string;
  animation?: string;
};

const getRarityStyles = (rarity: string): RarityStyle => {
  const rarityMap: Record<string, RarityStyle> = {
    common: {
      borderColor: 'border-rarityCommon',
      textColor: 'text-rarityCommon',
      bgColor: 'bg-rarityCommonDark/20',
      glowColor: 'shadow-rarityCommon/30',
      gradient: 'from-rarityCommon/20 to-rarityCommonDark/10',
    },
    uncommon: {
      borderColor: 'border-rarityUncommon',
      textColor: 'text-rarityUncommon',
      bgColor: 'bg-rarityUncommonDark/20',
      glowColor: 'shadow-rarityUncommon/30',
      gradient: 'from-rarityUncommon/20 to-rarityUncommonDark/10',
    },
    rare: {
      borderColor: 'border-rarityRare',
      textColor: 'text-rarityRare',
      bgColor: 'bg-rarityRareDark/20',
      glowColor: 'shadow-rarityRare/30',
      gradient: 'from-rarityRare/20 to-rarityRareDark/10',
    },
    epic: {
      borderColor: 'border-rarityEpic',
      textColor: 'text-rarityEpic',
      bgColor: 'bg-rarityEpicDark/20',
      glowColor: 'shadow-rarityEpic/30',
      gradient: 'from-rarityEpic/20 to-rarityEpicDark/10',
      animation: 'animate-epic-pulse',
    },
    legendary: {
      borderColor: 'border-rarityLegendary',
      textColor: 'text-rarityLegendary',
      bgColor: 'bg-rarityLegendaryDark/20',
      glowColor: 'shadow-rarityLegendary/50',
      gradient: 'from-rarityLegendary/30 to-rarityLegendaryDark/10',
      animation: 'animate-legendary-glow',
    },
  };

  return rarityMap[rarity] || rarityMap.common;
};

// NFT Reward Preview Component
const NFTRewardPreview: React.FC<{ nftState: NFTState; handleNFTClick: () => void }> = ({
  nftState,
  handleNFTClick,
}) => {
  if (nftState.status === 'idle') {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-nocenaPink border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-300">Checking NFT status...</span>
      </div>
    );
  }

  if (nftState.status === 'generating') {
    return (
      <div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-4 h-4 border-2 border-nocenaPink border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-300">Generating {nftState.templateName || 'Clothing NFT'}...</span>
        </div>
        <p className="text-xs text-gray-400">Wait a few seconds for NFT to finish generating</p>
      </div>
    );
  }

  if (
    (nftState.status === 'background-ready' || nftState.status === 'completed' || nftState.status === 'saved') &&
    nftState.imageUrl
  ) {
    const rarityStyles = getRarityStyles(nftState.rarity || 'common');

    return (
      <div>
        <div
          className={`w-24 h-24 mx-auto mb-3 rounded-xl overflow-hidden border-2 ${rarityStyles.borderColor} ${rarityStyles.animation || ''} cursor-pointer hover:border-nocenaPurple transition-colors shadow-lg ${rarityStyles.glowColor}`}
          onClick={handleNFTClick}
        >
          <img
            src={nftState.imageUrl}
            alt={nftState.templateName || 'Generated NFT'}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>

        {/* Rarity and bonus display */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div
              className={`px-2 py-1 rounded-md text-xs font-bold ${rarityStyles.bgColor} ${rarityStyles.textColor} border ${rarityStyles.borderColor}`}
            >
              {(nftState.rarity || 'common').toUpperCase()}
            </div>
            <span className="text-sm text-gray-300">{nftState.templateName}</span>
          </div>

          {/* Token bonus display */}
          {nftState.tokenBonus && (
            <div
              className={`flex items-center justify-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r ${rarityStyles.gradient} border ${rarityStyles.borderColor}/50`}
            >
              <svg className="w-4 h-4 text-nocenaPink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className={`text-sm font-bold ${rarityStyles.textColor}`}>+{nftState.tokenBonus}% Tokens</span>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-1">Tap to view larger</p>
        </div>
      </div>
    );
  }

  if (nftState.status === 'failed') {
    return (
      <div className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.662-.833-2.464 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span className="text-sm text-orange-300">NFT generation failed - tokens only</span>
        {nftState.error && <p className="text-xs text-gray-400 mt-1">{nftState.error}</p>}
      </div>
    );
  }

  return null;
};

// Updated NFT Popup with rarity styling
interface NFTPopupProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  templateName: string;
  status: string;
  rarity?: string;
  tokenBonus?: number;
  backgroundTaskUsed?: boolean;
}

const NFTPopup: React.FC<NFTPopupProps> = ({
  isOpen,
  onClose,
  imageUrl,
  templateName,
  status,
  rarity,
  tokenBonus,
  backgroundTaskUsed,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoveY = useRef<number | null>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (content.scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
      } else {
        touchStartY.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;

      touchMoveY.current = e.touches[0].clientY;
      const deltaY = touchMoveY.current - touchStartY.current;

      if (deltaY > 0) {
        e.preventDefault();
        content.style.transform = `translateY(${deltaY}px)`;
        content.style.transition = 'none';
      }
    };

    const handleTouchEnd = () => {
      if (touchStartY.current === null || touchMoveY.current === null) return;

      const deltaY = touchMoveY.current - touchStartY.current;
      content.style.transition = 'transform 0.3s ease-out';

      if (deltaY > 100) {
        content.style.transform = 'translateY(100%)';
        setTimeout(() => onClose(), 300);
      } else {
        content.style.transform = 'translateY(0)';
      }

      touchStartY.current = null;
      touchMoveY.current = null;
    };

    content.addEventListener('touchstart', handleTouchStart);
    content.addEventListener('touchmove', handleTouchMove, { passive: false });
    content.addEventListener('touchend', handleTouchEnd);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
      content.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const rarityStyles = getRarityStyles(rarity || 'common');

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <ThematicContainer
        asButton={false}
        glassmorphic={true}
        color="nocenaBlue"
        rounded="xl"
        className="!p-0 max-w-sm w-full mx-4 max-h-[80vh] overflow-hidden"
      >
        <div ref={contentRef} className="relative">
          {/* Header */}
          <div className="relative p-4 pb-2">
            <h2 className="text-xl font-bold text-center">NFT Reward</h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* NFT Image with Rarity Border */}
          <div className="px-6 pb-4">
            <div
              className={`aspect-square rounded-2xl overflow-hidden border-4 ${rarityStyles.borderColor} ${rarityStyles.animation || ''} mb-4 shadow-xl ${rarityStyles.glowColor}`}
            >
              <img src={imageUrl} alt={templateName} className="w-full h-full object-cover" />
            </div>

            {/* NFT Details */}
            <div className="text-center space-y-3">
              <div className="space-y-2">
                <h3 className={`text-lg font-bold ${rarityStyles.textColor}`}>{templateName}</h3>

                {/* Rarity Badge */}
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${rarityStyles.bgColor} ${rarityStyles.textColor} border ${rarityStyles.borderColor}`}
                >
                  {(rarity || 'common').toUpperCase()} RARITY
                </div>
              </div>

              {/* Token Bonus Display */}
              {tokenBonus && (
                <div
                  className={`bg-gradient-to-r ${rarityStyles.gradient} rounded-lg p-3 border ${rarityStyles.borderColor}/50`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-nocenaPink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    <span className={`text-lg font-bold ${rarityStyles.textColor}`}>+{tokenBonus}% Token Bonus</span>
                  </div>
                  <p className="text-xs text-gray-400">Applied to all future challenge rewards</p>
                </div>
              )}

              {/* Status indicator */}
              <div className="flex items-center justify-center gap-2">
                {status === 'saved' && (
                  <>
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-400">Saved to Collection</span>
                  </>
                )}

                {status === 'completed' && (
                  <>
                    <svg className="w-5 h-5 text-nocenaPink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-300">Generated Successfully</span>
                  </>
                )}

                {status === 'background-ready' && (
                  <>
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm text-yellow-400">Ready to Save</span>
                  </>
                )}
              </div>

              {/* Background processing indicator */}
              {backgroundTaskUsed && (
                <div className="bg-green-900/20 rounded-lg p-2 mt-3">
                  <p className="text-xs text-green-300">Generated via background processing</p>
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-gray-400 mt-3">
                This unique {rarity} clothing NFT provides a permanent {tokenBonus}% bonus to all your future challenge
                rewards.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-400 py-4">
            Pull down to close
            <div className="mt-2 opacity-50">↓</div>
          </div>
        </div>
      </ThematicContainer>
    </div>
  );
};

const ClaimingScreen: React.FC<ClaimingScreenProps> = ({
  challenge,
  videoBlob,
  photoBlob,
  verificationResult,
  onClaimComplete,
  onBack,
  onCancel,
  backgroundTaskIds,
}) => {
  const { user, updateUser } = useAuth();
  const backgroundTasks = useBackgroundTasks();
  const [claimingStage, setClaimingStage] = useState<'ready' | 'claiming' | 'success' | 'failed'>('ready');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showNFTPopup, setShowNFTPopup] = useState(false);

  // NFT State Management with rarity system
  const [nftState, setNftState] = useState<NFTState>({
    status: 'idle',
    collectionId: null,
    templateType: null,
    templateName: null,
    imageUrl: null,
    progress: 0,
    error: null,
  });

  // Track completion ID for NFT saving
  const [completionId, setCompletionId] = useState<string | null>(null);

  // Initial component state
  useEffect(() => {
    console.log('[ClaimingScreen DEBUG] Component initialized');
    console.log('[ClaimingScreen DEBUG] Background task IDs received:', backgroundTaskIds);
    console.log('[ClaimingScreen DEBUG] User ID:', user?.id);
    console.log('[ClaimingScreen DEBUG] NFT Generation ID:', backgroundTaskIds.nftGenerationId);

    if (backgroundTaskIds.nftGenerationId) {
      const task = backgroundTasks.getTask(backgroundTaskIds.nftGenerationId);
      console.log('[ClaimingScreen DEBUG] Initial NFT task state:', task);
    } else {
      console.log('[ClaimingScreen DEBUG] No NFT generation ID provided');
    }
  }, []);

  // Check for pre-generated NFT from background tasks
  useEffect(() => {
    const checkBackgroundNFT = () => {
      if (!backgroundTaskIds.nftGenerationId) {
        console.log('[NFT Check] No NFT generation ID - setting failed state');
        setNftState((prev) => ({
          ...prev,
          status: 'failed',
          error: 'No NFT generation started',
        }));
        return;
      }

      const nftTask = backgroundTasks.getTask(backgroundTaskIds.nftGenerationId);

      if (!nftTask) {
        return;
      }

      if (nftTask.status === 'completed' && nftTask.result) {
        console.log('[NFT Success DEBUG] Background NFT generation completed!', nftTask.result);

        const newState = {
          status: 'background-ready' as const,
          collectionId: nftTask.result.collectionId,
          templateType: nftTask.result.templateType,
          templateName: nftTask.result.templateName,
          imageUrl: nftTask.result.imageUrl,
          progress: 100,
          error: null,
          backgroundTaskUsed: true,
          // New rarity system fields from background task
          rarity: nftTask.result.rarity,
          tokenBonus: nftTask.result.tokenBonus,
          itemType: nftTask.result.itemType,
        };

        setNftState(newState);

        if (nftTask.result.completionId) {
          setCompletionId(nftTask.result.completionId);
        }
      } else if (nftTask.status === 'failed') {
        console.log('[NFT Error DEBUG] Background NFT generation failed:', nftTask.error);
        setNftState((prev) => ({
          ...prev,
          status: 'failed',
          error: 'Background NFT generation failed - will retry',
        }));
      } else if (nftTask.status === 'running') {
        console.log('[NFT Progress DEBUG] Background NFT still generating...', nftTask.progress + '%');
        setNftState((prev) => ({
          ...prev,
          status: 'generating',
          progress: nftTask.progress,
        }));
      }
    };

    console.log('[NFT Polling DEBUG] Starting NFT check polling...');
    checkBackgroundNFT();
    const interval = setInterval(checkBackgroundNFT, 2000);

    return () => {
      console.log('[NFT Polling DEBUG] Stopping NFT check polling');
      clearInterval(interval);
    };
  }, [backgroundTaskIds.nftGenerationId, backgroundTasks]);

  useEffect(() => {
    const vUrl = URL.createObjectURL(videoBlob);
    const pUrl = URL.createObjectURL(photoBlob);

    setVideoUrl(vUrl);
    setPhotoUrl(pUrl);

    const handleResize = () => {
      const initialHeight = window.innerHeight;
      const currentHeight = window.innerHeight;
      setKeyboardVisible(initialHeight - currentHeight > 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      URL.revokeObjectURL(vUrl);
      URL.revokeObjectURL(pUrl);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoBlob, photoBlob]);

  // Function to save completed NFT to database
  const saveCompletedNFTToDatabase = async (imageUrl: string) => {
    if (!completionId || !user?.id || !nftState.collectionId || !nftState.templateType || !nftState.templateName) {
      console.warn('Missing data for NFT database save:', {
        completionId,
        userId: user?.id,
        collectionId: nftState.collectionId,
        templateType: nftState.templateType,
        templateName: nftState.templateName,
      });
      return;
    }

    try {
      const saveResult = await saveNFTRewardAfterCompletion(completionId, user.id, {
        collectionId: nftState.collectionId,
        templateType: nftState.templateType,
        templateName: nftState.templateName,
        imageUrl: imageUrl,
        generationPrompt: `Generated ${nftState.templateType} for challenge completion`,
      });

      if (saveResult.success) {
        console.log('NFT saved to database:', saveResult.nftId);
        setNftState((prev) => ({
          ...prev,
          status: 'saved',
          nftId: saveResult.nftId,
        }));
      } else {
        console.error('Failed to save NFT to database:', saveResult.error);
      }
    } catch (error) {
      console.error('Error saving NFT to database:', error);
    }
  };

  const handleClaimTokens = async () => {
    if (!challengeDescription.trim()) {
      setErrorMessage('Please add a description of your challenge completion.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('User not authenticated. Please log in and try again.');
      return;
    }

    if (nftState.status === 'generating') {
      setErrorMessage(`Please wait for your NFT to finish generating (${nftState.progress}% complete)`);
      return;
    }

    console.log('[Claim DEBUG] Starting token claim process...');
    console.log('[Claim DEBUG] Current NFT state:', nftState.status);
    console.log('[Claim DEBUG] Background task used:', nftState.backgroundTaskUsed);

    setClaimingStage('claiming');
    setErrorMessage('');

    try {
      const completionData: CompletionData = {
        video: videoBlob,
        photo: photoBlob,
        verificationResult,
        description: challengeDescription,
        challenge: {
          title: challenge.title,
          description: challenge.description,
          reward: challenge.reward,
          type: challenge.type,
          frequency: challenge.frequency,
          challengeId: challenge.challengeId,
          creatorId: challenge.creatorId,
        },
      };

      // Use pre-generated NFT data if available
      const existingNFTData =
        (nftState.status === 'background-ready' || nftState.status === 'completed' || nftState.status === 'saved') &&
        nftState.collectionId
          ? {
              collectionId: nftState.collectionId,
              templateType: nftState.templateType!,
              templateName: nftState.templateName!,
              imageUrl: nftState.imageUrl || undefined,
              generationPrompt: `Generated ${nftState.templateType} for challenge completion`,
              status: nftState.status as 'generating' | 'completed' | 'failed',
              backgroundOptimized: nftState.backgroundTaskUsed || false,
              rarity: nftState.rarity,
              tokenBonus: nftState.tokenBonus,
            }
          : undefined;

      console.log('[Claim DEBUG] Using optimized NFT data for completion:', existingNFTData);

      // Call the completion workflow with NFT data
      const result = await completeChallengeWorkflow(user.id, completionData, updateUser, existingNFTData);

      if (result.success) {
        console.log('[Claim Success DEBUG] Challenge completion successful:', result);

        // Store completion ID for future NFT saves
        if (result.completionId) {
          setCompletionId(result.completionId);
        }

        // If NFT is ready and we have a completion ID, save it to database
        if (
          (nftState.status === 'background-ready' || nftState.status === 'completed') &&
          nftState.imageUrl &&
          result.completionId
        ) {
          console.log('[Claim DEBUG] Auto-saving optimized NFT to database...');
          await saveCompletedNFTToDatabase(nftState.imageUrl);
        }

        // Update NFT state based on result
        if (result.nftReward) {
          setNftState((prev) => ({
            ...prev,
            status: result.nftReward!.status === 'saved' ? 'saved' : prev.status,
            nftId: result.nftReward!.nftId || prev.nftId,
          }));
        }

        setClaimingStage('success');

        onClaimComplete({
          ...completionData,
          completionId: result.completionId,
          tokensEarned: challenge.reward,
          nftReward: result.nftReward
            ? {
                collectionId: result.nftReward.collectionId,
                templateType: result.nftReward.templateType,
                templateName: result.nftReward.templateName,
                status: result.nftReward.status,
                imageUrl: nftState.imageUrl,
                nftId: result.nftReward.nftId,
                backgroundOptimized: nftState.backgroundTaskUsed,
                rarity: nftState.rarity,
                tokenBonus: nftState.tokenBonus,
              }
            : undefined,
        });

        setTimeout(() => {
          window.location.href = '/home';
        }, 5000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('[Claim Error DEBUG] Error claiming tokens:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to claim tokens. Please try again.');
      setClaimingStage('failed');
    }
  };

  const getStageInfo = () => {
    switch (claimingStage) {
      case 'ready':
        return {
          title: 'Claim Your Reward',
          subtitle: nftState.backgroundTaskUsed
            ? 'Verification successful - optimized NFT ready!'
            : 'Verification successful - time to collect!',
        };
      case 'claiming':
        return {
          title: 'Processing Claim',
          subtitle: nftState.backgroundTaskUsed ? 'Using background-generated NFT...' : 'Uploading to blockchain...',
        };
      case 'success':
        return {
          title: 'Rewards Claimed!',
          subtitle: `+${challenge.reward} Nocenix earned${nftState.templateName ? ` + ${nftState.templateName}` : ''}${nftState.tokenBonus ? ` (+${nftState.tokenBonus}% bonus)` : ''}`,
        };
      case 'failed':
        return {
          title: 'Claim Failed',
          subtitle: 'Something went wrong',
        };
    }
  };

  const stageInfo = getStageInfo();

  // Function to handle NFT image click
  const handleNFTClick = () => {
    if (nftState.imageUrl && nftState.templateName) {
      setShowNFTPopup(true);
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Navigation Buttons */}
      <div
        className="flex justify-between items-center px-4 z-50 flex-shrink-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
          paddingBottom: '0.5rem',
        }}
      >
        {/* Back Button - Left */}
        <button onClick={onBack} className="focus:outline-none" aria-label="Back">
          <ThematicContainer
            color="nocenaBlue"
            glassmorphic={true}
            asButton={false}
            rounded="full"
            className="w-12 h-12 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </ThematicContainer>
        </button>

        {/* Cancel Button - Right */}
        <button onClick={onCancel} className="focus:outline-none" aria-label="Cancel">
          <ThematicContainer
            color="nocenaBlue"
            glassmorphic={true}
            asButton={false}
            rounded="full"
            className="w-12 h-12 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ThematicContainer>
        </button>
      </div>

      {/* NFT Popup */}
      {nftState.imageUrl && nftState.templateName && (
        <NFTPopup
          isOpen={showNFTPopup}
          onClose={() => setShowNFTPopup(false)}
          imageUrl={nftState.imageUrl}
          templateName={nftState.templateName}
          status={nftState.status}
          rarity={nftState.rarity}
          tokenBonus={nftState.tokenBonus}
          backgroundTaskUsed={nftState.backgroundTaskUsed}
        />
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-light mb-1">{stageInfo.title}</h2>
          <div className="text-sm text-gray-400">{stageInfo.subtitle}</div>
        </div>

        {errorMessage && (
          <div className="mb-4 bg-red-900/20 border border-red-800/30 rounded-xl p-3">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        {claimingStage === 'ready' && (
          <div>
            {/* Challenge Summary */}
            <div className="bg-gradient-to-r from-green-900/20 to-purple-900/20 border border-green-800/20 rounded-2xl p-6 mb-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-medium text-nocenaPurple mb-2">Challenge completed!</h3>

                {/* Reward Display */}
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold">{challenge.reward}</span>
                    <Image src="/nocenix.ico" alt="Nocenix" width={32} height={32} />
                    <span className="text-lg text-gray-300">NOCENIX</span>
                  </div>

                  {/* NFT Reward Preview */}
                  <div className="mt-3 pt-3 border-t border-gray-600/30">
                    <p className="text-sm text-nocenaPink mb-1">Bonus Reward</p>
                    <NFTRewardPreview nftState={nftState} handleNFTClick={handleNFTClick} />
                  </div>
                </div>
              </div>
            </div>

            {/* Media Preview */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Your Submission:</h4>
              <div className="flex gap-3">
                {/* Video Thumbnail */}
                <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden">
                  <video src={videoUrl} className="w-full h-24 object-cover" preload="metadata" muted playsInline />
                  <div className="p-2 text-center">
                    <span className="text-xs text-gray-400">Video</span>
                  </div>
                </div>

                {/* Photo */}
                <div className="w-20 bg-gray-800 rounded-xl overflow-hidden">
                  <img src={photoUrl} alt="Selfie" className="w-full h-full object-cover" />
                  <div className="p-2 text-center">
                    <span className="text-xs text-gray-400">Selfie</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Describe your completion:</label>
              <textarea
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                placeholder="Tell us about your experience completing this challenge..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-nocenaPink focus:bg-white/20 transition-all resize-none"
                style={{
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
              />
              <p className="text-xs text-gray-400 mt-2">This will be shared with your completion post</p>
            </div>
          </div>
        )}

        {/* Claiming Stage */}
        {claimingStage === 'claiming' && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-800/20 rounded-2xl p-8">
              <div className="w-20 h-20 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-medium mb-3">
                {nftState.backgroundTaskUsed ? 'Processing Your Claim' : 'Processing Your Claim'}
              </h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>Uploading media to IPFS...</p>
                <p>Executing blockchain transaction...</p>
                <p>Updating your profile...</p>
                {nftState.backgroundTaskUsed ? (
                  <p>Using background-generated NFT...</p>
                ) : (
                  <>
                    {(nftState.status === 'background-ready' ||
                      nftState.status === 'completed' ||
                      nftState.status === 'saved') && <p>Saving NFT to collection...</p>}
                    {nftState.status === 'generating' && <p>NFT still generating...</p>}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-4">This may take a few moments</p>
            </div>
          </div>
        )}

        {claimingStage === 'success' && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-green-900/20 to-purple-900/20 border border-green-800/20 rounded-2xl p-8">
              {/* Token Success */}
              <div className="w-20 h-20 bg-nocenaPurple rounded-full flex items-center justify-center mx-auto mb-6">
                <Image src="/nocenix.ico" alt="Success" width={40} height={40} />
              </div>
              <h3 className="text-2xl font-bold text-nocenaPurple mb-3">Tokens claimed</h3>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-xl font-bold">+{challenge.reward}</span>
                <Image src="/nocenix.ico" alt="Nocenix" width={24} height={24} />
                <span className="text-lg text-gray-300">NOCENIX</span>
              </div>

              {nftState.backgroundTaskUsed && (
                <div className="bg-green-900/20 rounded-lg p-3 mb-6">
                  <p className="text-sm text-green-300">
                    Background processing saved significant time during claiming!
                  </p>
                </div>
              )}

              {/* NFT Reward Section */}
              {nftState.templateName && (
                <div className="mt-6 pt-6 border-t border-gray-600/30">
                  <h4 className="text-lg font-medium text-nocenaPink mb-4">Clothing NFT Reward</h4>

                  {nftState.status === 'generating' && (
                    <div className="bg-black/30 rounded-xl p-4">
                      <div className="w-16 h-16 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm text-gray-300 mb-2">Generating {nftState.templateName}...</p>
                      <p className="text-xs text-gray-400">Wait a few seconds for NFT to finish generating</p>
                    </div>
                  )}

                  {(nftState.status === 'background-ready' ||
                    nftState.status === 'completed' ||
                    nftState.status === 'saved') &&
                    nftState.imageUrl && (
                      <div className="bg-black/30 rounded-xl p-4">
                        {(() => {
                          const rarityStyles = getRarityStyles(nftState.rarity || 'common');
                          return (
                            <>
                              <div
                                className={`w-48 h-32 mx-auto mb-4 rounded-xl overflow-hidden border-2 ${rarityStyles.borderColor} ${rarityStyles.animation || ''} cursor-pointer hover:border-nocenaPurple transition-colors shadow-lg ${rarityStyles.glowColor}`}
                                onClick={handleNFTClick}
                              >
                                <img
                                  src={nftState.imageUrl}
                                  alt={nftState.templateName}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                                />
                              </div>

                              <div className="space-y-3">
                                <p className="text-lg font-medium text-nocenaPink">{nftState.templateName}</p>

                                {/* Rarity badge */}
                                <div
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${rarityStyles.bgColor} ${rarityStyles.textColor} border ${rarityStyles.borderColor}`}
                                >
                                  {(nftState.rarity || 'common').toUpperCase()} RARITY
                                </div>

                                {/* Token bonus display */}
                                {nftState.tokenBonus && (
                                  <div
                                    className={`bg-gradient-to-r ${rarityStyles.gradient} rounded-lg p-2 border ${rarityStyles.borderColor}/50`}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <svg
                                        className="w-4 h-4 text-nocenaPink"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                        />
                                      </svg>
                                      <span className={`text-sm font-bold ${rarityStyles.textColor}`}>
                                        +{nftState.tokenBonus}% Token Bonus
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <p className="text-sm text-gray-300">
                                  {nftState.status === 'saved'
                                    ? 'NFT Saved to Collection!'
                                    : 'NFT Generated Successfully!'}
                                </p>

                                {nftState.backgroundTaskUsed && (
                                  <p className="text-xs text-green-400">Generated via background processing</p>
                                )}

                                {nftState.status === 'saved' && nftState.nftId && (
                                  <p className="text-xs text-green-400">
                                    Database ID: {nftState.nftId.substring(0, 8)}...
                                  </p>
                                )}

                                <p className="text-xs text-gray-400">Tap to view larger</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}

                  {nftState.status === 'failed' && (
                    <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
                      <p className="text-red-400 text-sm">NFT generation failed</p>
                      <p className="text-xs text-gray-400 mt-1">Your tokens were still claimed successfully</p>
                      {nftState.error && <p className="text-xs text-gray-400 mt-1">{nftState.error}</p>}
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-300 mt-6">Redirecting to home...</p>
            </div>
          </div>
        )}

        {claimingStage === 'failed' && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-800/20 rounded-2xl p-8">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-red-400 mb-3">Claiming Failed</h3>
              <p className="text-sm text-gray-300 mb-4">{errorMessage}</p>
              <p className="text-xs text-gray-400">Please try again</p>
            </div>
          </div>
        )}

        {/* Extra spacing for keyboard when visible */}
        {keyboardVisible && <div className="h-64" />}
      </div>

      {/* Fixed Action Buttons at Bottom */}
      <div
        className="flex-shrink-0 px-6 py-4 bg-black/50 backdrop-blur-sm border-t border-gray-800"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
        }}
      >
        {claimingStage === 'ready' && (
          <PrimaryButton
            onClick={handleClaimTokens}
            text={
              nftState.status === 'generating'
                ? `Wait for NFT (${nftState.progress}%)`
                : nftState.status === 'background-ready'
                  ? `Claim ${challenge.reward} Tokens + NFT`
                  : `Claim ${challenge.reward} Tokens`
            }
            disabled={!challengeDescription.trim() || nftState.status === 'generating'}
            isActive={!!challengeDescription.trim() && nftState.status !== 'generating'}
          />
        )}

        {claimingStage === 'claiming' && (
          <PrimaryButton text="Processing..." className="w-full" disabled={true} isActive={false} />
        )}

        {claimingStage === 'failed' && (
          <PrimaryButton onClick={handleClaimTokens} text="Retry Claim" className="w-full" isActive={true} />
        )}
      </div>
    </div>
  );
};

export default ClaimingScreen;
