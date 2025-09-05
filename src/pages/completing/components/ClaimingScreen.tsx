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
      borderColor: 'border-gray-500',
      textColor: 'text-gray-400',
      bgColor: 'bg-gray-800/20',
      glowColor: 'shadow-gray-500/20',
      gradient: 'from-gray-500/20 to-gray-700/10',
    },
    uncommon: {
      borderColor: 'border-nocenaBlue',
      textColor: 'text-nocenaBlue',
      bgColor: 'bg-nocenaBlue/20',
      glowColor: 'shadow-nocenaBlue/30',
      gradient: 'from-nocenaBlue/20 to-nocenaBlue/10',
    },
    rare: {
      borderColor: 'border-nocenaPurple',
      textColor: 'text-nocenaPurple',
      bgColor: 'bg-nocenaPurple/20',
      glowColor: 'shadow-nocenaPurple/30',
      gradient: 'from-nocenaPurple/20 to-nocenaPurple/10',
    },
    epic: {
      borderColor: 'border-nocenaPink',
      textColor: 'text-nocenaPink',
      bgColor: 'bg-nocenaPink/20',
      glowColor: 'shadow-nocenaPink/30',
      gradient: 'from-nocenaPink/20 to-nocenaPink/10',
      animation: 'animate-pulse',
    },
    legendary: {
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-400/20',
      glowColor: 'shadow-yellow-400/50',
      gradient: 'from-yellow-400/30 to-yellow-600/10',
      animation: 'animate-pulse',
    },
  };

  return rarityMap[rarity] || rarityMap.common;
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [showNFTPopup, setShowNFTPopup] = useState(false);
  const [completionId, setCompletionId] = useState<string | null>(null);

  const [nftState, setNftState] = useState<NFTState>({
    status: 'idle',
    collectionId: null,
    templateType: null,
    templateName: null,
    imageUrl: null,
    progress: 0,
    error: null,
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vUrl = URL.createObjectURL(videoBlob);
    const pUrl = URL.createObjectURL(photoBlob);

    setVideoUrl(vUrl);
    setPhotoUrl(pUrl);

    generateThumbnail(vUrl);

    return () => {
      URL.revokeObjectURL(vUrl);
      URL.revokeObjectURL(pUrl);
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [videoBlob, photoBlob]);

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

  const generateThumbnail = (videoUrl: string) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const extractFrame = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const thumbUrl = URL.createObjectURL(blob);
                setThumbnailUrl(thumbUrl);
              }
            },
            'image/jpeg',
            0.9,
          );
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    };

    video.onloadedmetadata = () => {
      video.currentTime = 0.05;
    };

    video.onseeked = () => {
      extractFrame();
    };

    video.oncanplay = () => {
      if (!thumbnailUrl) {
        extractFrame();
      }
    };

    video.onerror = (e) => {
      console.error('Error loading video for thumbnail:', e);
    };
  };

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

      const result = await completeChallengeWorkflow(user.id, completionData, updateUser, existingNFTData);

      if (result.success) {
        console.log('[Claim Success DEBUG] Challenge completion successful:', result);

        if (result.completionId) {
          setCompletionId(result.completionId);
        }

        if (
          (nftState.status === 'background-ready' || nftState.status === 'completed') &&
          nftState.imageUrl &&
          result.completionId
        ) {
          console.log('[Claim DEBUG] Auto-saving optimized NFT to database...');
          await saveCompletedNFTToDatabase(nftState.imageUrl);
        }

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
          title: 'Claim Reward',
          subtitle: nftState.backgroundTaskUsed ? 'Optimized NFT ready!' : 'Time to collect your reward',
        };
      case 'claiming':
        return {
          title: 'Processing Claim',
          subtitle: 'Uploading to blockchain...',
        };
      case 'success':
        return {
          title: 'Reward Claimed!',
          subtitle: `+${challenge.reward} Nocenix${nftState.tokenBonus ? ` (+${nftState.tokenBonus}% bonus)` : ''}`,
        };
      case 'failed':
        return {
          title: 'Claim Failed',
          subtitle: 'Something went wrong',
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      {/* Navigation Buttons */}
      <div
        className="flex justify-between items-center px-4 fixed top-0 left-0 right-0 z-50 pointer-events-none mt-4"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: '0.5rem',
        }}
      >
        {/* Back Button */}
        <button onClick={onBack} className="focus:outline-none pointer-events-auto" aria-label="Back">
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

        {/* Cancel Button */}
        <button onClick={onCancel} className="focus:outline-none pointer-events-auto" aria-label="Cancel">
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

      <div
        className="text-white h-full flex flex-col px-6 py-4 overflow-y-auto"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 80px)' }}
      >
        {errorMessage && (
          <div className="mb-4 bg-red-900/20 border border-red-800/30 rounded-xl p-3">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Video Preview (Same style as verification screen) */}
        <div className="mb-6">
          <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
            <div className="relative h-64 w-full">
              <video
                ref={videoRef}
                src={videoUrl || undefined}
                poster={thumbnailUrl || undefined}
                className="w-full h-full object-cover"
                preload="metadata"
                playsInline
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                onClick={(e) => {
                  const video = e.target as HTMLVideoElement;
                  if (video.paused) {
                    video.play();
                  } else {
                    video.pause();
                  }
                }}
                style={
                  {
                    WebkitPlaysinline: true,
                  } as React.CSSProperties
                }
              />

              <div className="absolute top-4 right-4 w-20 h-24 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                <img src={photoUrl || undefined} alt="Verification selfie" className="w-full h-full object-cover" />
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src={challenge.challengerProfile}
                        alt="Challenger"
                        width={20}
                        height={20}
                        className="w-5 h-5 object-cover rounded-full"
                      />
                      <span className="text-sm font-medium">{challenge.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold">{challenge.reward}</span>
                      <Image src="/nocenix.ico" alt="Nocenix" width={16} height={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-6 flex-1">
          {claimingStage === 'ready' && (
            <div className="space-y-6">
              {/* Reward Summary */}
              <ThematicContainer
                color="nocenaPurple"
                glassmorphic={true}
                asButton={false}
                rounded="2xl"
                className="p-6 text-center"
              >
                <div className="w-16 h-16 bg-nocenaPurple/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-nocenaPurple/30">
                  <svg className="w-8 h-8 text-nocenaPurple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h3 className="text-xl font-bold text-white mb-4">Mission Complete!</h3>

                {/* Token Reward */}
                <div className="bg-black/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-white">{challenge.reward}</span>
                    <Image src="/nocenix.ico" alt="Nocenix" width={24} height={24} />
                    <span className="text-sm text-gray-300">NOCENIX</span>
                  </div>
                </div>

                {/* NFT Reward */}
                {nftState.status !== 'failed' && (
                  <div className="border-t border-gray-600/30 pt-4">
                    <p className="text-sm text-nocenaPink mb-3">Bonus NFT Reward</p>
                    {nftState.status === 'generating' && (
                      <div className="space-y-2">
                        <div className="w-12 h-12 border-2 border-nocenaPink/50 border-t-nocenaPink rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-gray-400">Generating {nftState.templateName}...</p>
                      </div>
                    )}

                    {(nftState.status === 'background-ready' ||
                      nftState.status === 'completed' ||
                      nftState.status === 'saved') &&
                      nftState.imageUrl && (
                        <div className="space-y-3">
                          {(() => {
                            const rarityStyles = getRarityStyles(nftState.rarity || 'common');
                            return (
                              <>
                                <div
                                  className={`w-20 h-20 mx-auto rounded-xl overflow-hidden border-2 ${rarityStyles.borderColor} ${rarityStyles.animation || ''} cursor-pointer hover:scale-105 transition-transform shadow-lg ${rarityStyles.glowColor}`}
                                  onClick={() => setShowNFTPopup(true)}
                                >
                                  <img
                                    src={nftState.imageUrl}
                                    alt={nftState.templateName || 'NFT'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className={`text-sm font-bold ${rarityStyles.textColor}`}>
                                    {nftState.templateName}
                                  </div>
                                  {nftState.tokenBonus && (
                                    <div className={`text-xs ${rarityStyles.textColor}`}>
                                      +{nftState.tokenBonus}% Token Bonus
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                  </div>
                )}
              </ThematicContainer>

              {/* Description Input */}
              <ThematicContainer color="nocenaBlue" glassmorphic={true} asButton={false} rounded="2xl" className="p-6">
                <h4 className="text-lg font-bold text-white mb-4 text-center">Share Your Experience</h4>
                <textarea
                  value={challengeDescription}
                  onChange={(e) => setChallengeDescription(e.target.value)}
                  placeholder="Tell us about completing this challenge..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-nocenaPink focus:bg-black/50 transition-all resize-none"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">This will be shared with your completion post</p>
              </ThematicContainer>
            </div>
          )}

          {claimingStage === 'claiming' && (
            <div className="text-center">
              <ThematicContainer color="nocenaPink" glassmorphic={true} asButton={false} rounded="2xl" className="p-8">
                <div className="w-16 h-16 border-4 border-nocenaPink/20 border-t-nocenaPink rounded-full animate-spin mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-4">Processing Claim</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>Uploading to blockchain...</p>
                  <p>Processing rewards...</p>
                  {nftState.backgroundTaskUsed && <p>Using optimized NFT...</p>}
                </div>
              </ThematicContainer>
            </div>
          )}

          {claimingStage === 'success' && (
            <div className="text-center">
              <ThematicContainer
                color="nocenaPurple"
                glassmorphic={true}
                asButton={false}
                rounded="2xl"
                className="p-8"
              >
                <div className="w-20 h-20 bg-nocenaPurple/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-nocenaPurple/30">
                  <Image src="/nocenix.ico" alt="Success" width={40} height={40} />
                </div>

                <h3 className="text-2xl font-bold text-nocenaPurple mb-4">Rewards Claimed!</h3>

                <div className="bg-black/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-bold">+{challenge.reward}</span>
                    <Image src="/nocenix.ico" alt="Nocenix" width={24} height={24} />
                    <span className="text-lg text-gray-300">NOCENIX</span>
                  </div>
                </div>

                {/* NFT Reward Display */}
                {nftState.templateName && nftState.imageUrl && (
                  <div className="space-y-4">
                    {(() => {
                      const rarityStyles = getRarityStyles(nftState.rarity || 'common');
                      return (
                        <>
                          <div
                            className={`w-24 h-24 mx-auto rounded-xl overflow-hidden border-2 ${rarityStyles.borderColor} ${rarityStyles.animation || ''} cursor-pointer hover:scale-105 transition-transform shadow-lg ${rarityStyles.glowColor}`}
                            onClick={() => setShowNFTPopup(true)}
                          >
                            <img
                              src={nftState.imageUrl}
                              alt={nftState.templateName}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className={`text-sm font-bold ${rarityStyles.textColor}`}>{nftState.templateName}</div>

                            {nftState.tokenBonus && (
                              <div className={`text-xs ${rarityStyles.textColor}`}>
                                +{nftState.tokenBonus}% Token Bonus Applied
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                <p className="text-sm text-gray-300 mt-6">Redirecting to home...</p>
              </ThematicContainer>
            </div>
          )}

          {claimingStage === 'failed' && (
            <div className="text-center">
              <ThematicContainer color="nocenaPink" glassmorphic={true} asButton={false} rounded="2xl" className="p-8">
                <div className="w-16 h-16 bg-nocenaPink/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-nocenaPink/30">
                  <svg className="w-8 h-8 text-nocenaPink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Claim Failed</h3>
                <p className="text-sm text-gray-300 mb-4">{errorMessage}</p>
                <p className="text-xs text-gray-400">Please try again</p>
              </ThematicContainer>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
              className="flex-1"
            />
          )}

          {claimingStage === 'claiming' && (
            <PrimaryButton text="Processing..." className="flex-1" disabled={true} isActive={false} />
          )}

          {claimingStage === 'failed' && (
            <PrimaryButton onClick={handleClaimTokens} text="Retry Claim" className="flex-1" isActive={true} />
          )}
        </div>
      </div>

      {/* NFT Popup */}
      {nftState.imageUrl && nftState.templateName && showNFTPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <ThematicContainer
            asButton={false}
            glassmorphic={true}
            color="nocenaBlue"
            rounded="2xl"
            className="max-w-sm w-full mx-4 p-6"
          >
            <div className="text-center">
              {/* Close Button */}
              <button
                onClick={() => setShowNFTPopup(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-xl font-bold text-white mb-4">NFT Reward</h2>

              {/* NFT Image */}
              {(() => {
                const rarityStyles = getRarityStyles(nftState.rarity || 'common');
                return (
                  <>
                    <div
                      className={`aspect-square rounded-2xl overflow-hidden border-4 ${rarityStyles.borderColor} ${rarityStyles.animation || ''} mb-4 shadow-xl ${rarityStyles.glowColor}`}
                    >
                      <img src={nftState.imageUrl} alt={nftState.templateName} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-3">
                      <h3 className={`text-lg font-bold ${rarityStyles.textColor}`}>{nftState.templateName}</h3>

                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${rarityStyles.bgColor} ${rarityStyles.textColor} border ${rarityStyles.borderColor}`}
                      >
                        {(nftState.rarity || 'common').toUpperCase()} RARITY
                      </div>

                      {nftState.tokenBonus && (
                        <div
                          className={`bg-gradient-to-r ${rarityStyles.gradient} rounded-lg p-3 border ${rarityStyles.borderColor}/50`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className={`text-sm font-bold ${rarityStyles.textColor}`}>
                              +{nftState.tokenBonus}% Token Bonus
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Applied to future rewards</p>
                        </div>
                      )}

                      <p className="text-sm text-gray-400">
                        This {nftState.rarity} NFT provides a permanent bonus to your challenge rewards.
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </ThematicContainer>
        </div>
      )}
    </div>
  );
};

export default ClaimingScreen;
