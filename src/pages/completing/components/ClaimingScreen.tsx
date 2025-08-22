'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import {
  completeChallengeWorkflow,
  CompletionData,
  saveNFTRewardAfterCompletion,
} from '../../../lib/completing/challengeCompletionService';
import { useAuth } from '../../../contexts/AuthContext';

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

interface ClaimingScreenProps {
  challenge: Challenge;
  videoBlob: Blob;
  photoBlob: Blob;
  verificationResult: any;
  onClaimComplete: (result: any) => void;
  onBack: () => void;
  onCancel: () => void;
}

// NFT Generation States
interface NFTState {
  status: 'idle' | 'generating' | 'completed' | 'failed' | 'saved';
  collectionId: string | null;
  templateType: string | null;
  templateName: string | null;
  imageUrl: string | null;
  progress: number;
  error: string | null;
  nftId?: string;
}

const ClaimingScreen: React.FC<ClaimingScreenProps> = ({
  challenge,
  videoBlob,
  photoBlob,
  verificationResult,
  onClaimComplete,
  onBack,
  onCancel,
}) => {
  const { user, updateUser } = useAuth();
  const [claimingStage, setClaimingStage] = useState<'ready' | 'claiming' | 'success' | 'failed'>('ready');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // NFT State Management
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

  // FIXED: Direct API call for immediate NFT generation like avatar generation
  useEffect(() => {
    const startNFTGeneration = async () => {
      if (!user?.id) return;

      console.log('🎁 Starting immediate NFT generation on ClaimingScreen mount...');
      setNftState((prev) => ({ ...prev, status: 'generating', progress: 10 }));

      try {
        const tempCompletionId = `temp_${Date.now()}_${user.id}`;
        
        // FIXED: Call the API directly like avatar generation
        const response = await fetch('/api/chainGPT/generate-clothing-reward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID: user.id,
            completionId: tempCompletionId,
            templateType: undefined, // Let it select random
            model: 'velogen',
            width: 512,
            height: 512,
            steps: 2,
            enhance: '2x',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const nftResult = await response.json();
        console.log('✅ NFT API Response:', nftResult);

        if (nftResult.success && nftResult.generation?.imageUrl) {
          console.log('🎉 NFT generation completed immediately:', {
            templateType: nftResult.clothingInfo?.type,
            templateName: nftResult.clothingInfo?.name,
            imageUrl: nftResult.generation.imageUrl,
          });

          // Set the completed state immediately with the base64 image
          setNftState({
            status: 'completed',
            collectionId: nftResult.clothingInfo?.templateCID || 'generated',
            templateType: nftResult.clothingInfo?.type,
            templateName: nftResult.clothingInfo?.name,
            imageUrl: nftResult.generation.imageUrl, // This is the base64 data URL
            progress: 100,
            error: null,
          });

          // Store the temp completion ID for later saving
          setCompletionId(tempCompletionId);
        } else {
          console.warn('⚠️ NFT generation failed:', nftResult.error || nftResult.message);
          setNftState((prev) => ({
            ...prev,
            status: 'failed',
            error: nftResult.error || nftResult.message || 'Failed to generate NFT',
          }));
        }
      } catch (error) {
        console.error('❌ NFT generation error:', error);
        setNftState((prev) => ({
          ...prev,
          status: 'failed',
          error: 'Failed to generate NFT',
        }));
      }
    };

    startNFTGeneration();
  }, [user?.id]);

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

  // REMOVED: Polling logic since we get immediate results

  // Function to save completed NFT to database
  const saveCompletedNFTToDatabase = async (imageUrl: string) => {
    if (!completionId || !user?.id || !nftState.collectionId || !nftState.templateType || !nftState.templateName) {
      console.warn('⚠️ Missing data for NFT database save:', {
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
        console.log('✅ NFT saved to database:', saveResult.nftId);
        setNftState((prev) => ({
          ...prev,
          status: 'saved',
          nftId: saveResult.nftId,
        }));
      } else {
        console.error('❌ Failed to save NFT to database:', saveResult.error);
      }
    } catch (error) {
      console.error('❌ Error saving NFT to database:', error);
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

      // Prepare NFT data for completion service
      const existingNFTData = nftState.collectionId
        ? {
            collectionId: nftState.collectionId,
            templateType: nftState.templateType!,
            templateName: nftState.templateName!,
            imageUrl: nftState.imageUrl || undefined,
            generationPrompt: `Generated ${nftState.templateType} for challenge completion`,
            status: nftState.status as 'generating' | 'completed' | 'failed',
          }
        : undefined;

      // Call the completion workflow with NFT data
      const result = await completeChallengeWorkflow(user.id, completionData, updateUser, existingNFTData);

      if (result.success) {
        console.log('✅ Challenge completion successful:', result);

        // Store completion ID for future NFT saves
        if (result.completionId) {
          setCompletionId(result.completionId);
        }

        // If NFT is completed and we have a completion ID, save it to database
        if (nftState.status === 'completed' && nftState.imageUrl && result.completionId) {
          console.log('🎁 Auto-saving completed NFT to database...');
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
      console.error('Error claiming tokens:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to claim tokens. Please try again.');
      setClaimingStage('failed');
    }
  };

  const getStageInfo = () => {
    switch (claimingStage) {
      case 'ready':
        return {
          title: 'Claim Your Reward',
          subtitle: 'Verification successful - time to collect!',
        };
      case 'claiming':
        return {
          title: 'Processing Claim',
          subtitle: 'Uploading to blockchain...',
        };
      case 'success':
        return {
          title: 'Rewards Claimed!',
          subtitle: `+${challenge.reward} Nocenix earned${nftState.templateName ? ` + ${nftState.templateName}` : ''}`,
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
                <div className="w-20 h-20 bg-nocenaPurple rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-nocenaPurple mb-2">Verification Complete!</h3>
                <p className="text-sm text-gray-300 mb-4">Challenge "{challenge.title}" successfully verified</p>

                {/* Reward Display */}
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold">{challenge.reward}</span>
                    <Image src="/nocenix.ico" alt="Nocenix" width={32} height={32} />
                    <span className="text-lg text-gray-300">NOCENIX</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Ready to be claimed</p>

                  {/* FIXED: NFT Reward Preview - Show Real Status */}
                  <div className="mt-3 pt-3 border-t border-gray-600/30">
                    <p className="text-sm text-nocenaPink mb-1">Bonus Reward</p>

                    {nftState.status === 'idle' && (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-nocenaPink border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-300">Starting NFT generation...</span>
                      </div>
                    )}

                    {nftState.status === 'generating' && (
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-4 h-4 border-2 border-nocenaPink border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-300">
                            Generating {nftState.templateName || 'Clothing NFT'}...
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-nocenaPink h-2 rounded-full transition-all duration-300"
                            style={{ width: `${nftState.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400">{nftState.progress}% complete</p>
                      </div>
                    )}

                    {(nftState.status === 'completed' || nftState.status === 'saved') && nftState.imageUrl && (
                      <div>
                        <div className="w-24 h-24 mx-auto mb-3 rounded-xl overflow-hidden border-2 border-nocenaPink">
                          <img
                            src={nftState.imageUrl}
                            alt={nftState.templateName || 'Generated NFT'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Failed to load NFT image:', nftState.imageUrl);
                              setNftState(prev => ({
                                ...prev,
                                error: 'Failed to display generated image'
                              }));
                            }}
                            onLoad={() => {
                              console.log('✅ NFT image loaded successfully');
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <svg
                            className="w-5 h-5 text-nocenaPink"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-300">
                            {nftState.templateName} {nftState.status === 'saved' ? 'Saved!' : 'Generated!'}
                          </span>
                        </div>
                        {nftState.status === 'saved' && nftState.nftId && (
                          <p className="text-xs text-green-400 mt-1">Saved to your collection</p>
                        )}
                        {nftState.status === 'completed' && (
                          <p className="text-xs text-green-400 mt-1">Ready to claim with tokens</p>
                        )}
                      </div>
                    )}

                    {nftState.status === 'failed' && (
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
                        {nftState.error && (
                          <p className="text-xs text-gray-400 mt-1">{nftState.error}</p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-1">
                      {nftState.status === 'generating' || nftState.status === 'idle'
                        ? 'NFT will be saved with tokens'
                        : nftState.status === 'completed'
                          ? 'Ready to claim and save!'
                          : nftState.status === 'saved'
                            ? 'NFT saved to your collection'
                            : 'Will retry during claim'}
                    </p>
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
                  <img src={photoUrl} alt="Selfie" className="w-full h-24 object-cover" />
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

        {claimingStage === 'claiming' && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-800/20 rounded-2xl p-8">
              <div className="w-20 h-20 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-medium mb-3">Processing Your Claim</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📁 Uploading media to IPFS...</p>
                <p>⛓️ Executing blockchain transaction...</p>
                <p>🎯 Updating your profile...</p>
                {(nftState.status === 'completed' || nftState.status === 'saved') && (
                  <p>✅ Saving NFT to collection...</p>
                )}
                {nftState.status === 'generating' && <p>🎁 NFT still generating...</p>}
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
              <h3 className="text-2xl font-bold text-nocenaPurple mb-3">Tokens Claimed!</h3>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-xl font-bold">+{challenge.reward}</span>
                <Image src="/nocenix.ico" alt="Nocenix" width={24} height={24} />
                <span className="text-lg text-gray-300">NOCENIX</span>
              </div>

              {/* NFT Reward Section */}
              {nftState.templateName && (
                <div className="mt-6 pt-6 border-t border-gray-600/30">
                  <h4 className="text-lg font-medium text-nocenaPink mb-4">Clothing NFT Reward</h4>

                  {nftState.status === 'generating' && (
                    <div className="bg-black/30 rounded-xl p-4">
                      <div className="w-16 h-16 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm text-gray-300 mb-2">Generating {nftState.templateName}...</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className="bg-nocenaPink h-2 rounded-full transition-all duration-300"
                          style={{ width: `${nftState.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400">{nftState.progress}% complete</p>
                      <p className="text-xs text-gray-400 mt-2">Will be saved automatically when ready</p>
                    </div>
                  )}

                  {(nftState.status === 'completed' || nftState.status === 'saved') && nftState.imageUrl && (
                    <div className="bg-black/30 rounded-xl p-4">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-xl overflow-hidden border-2 border-nocenaPink">
                        <img
                          src={nftState.imageUrl}
                          alt={nftState.templateName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load success screen NFT image');
                          }}
                        />
                      </div>
                      <p className="text-lg font-medium text-nocenaPink mb-2">{nftState.templateName}</p>
                      <p className="text-sm text-gray-300 mb-2">
                        {nftState.status === 'saved' ? 'NFT Saved to Collection!' : 'NFT Generated Successfully!'}
                      </p>
                      {nftState.status === 'saved' && nftState.nftId && (
                        <p className="text-xs text-green-400">Database ID: {nftState.nftId.substring(0, 8)}...</p>
                      )}
                      {nftState.status === 'completed' && (
                        <p className="text-xs text-yellow-400">Saving to your collection...</p>
                      )}
                    </div>
                  )}

                  {nftState.status === 'failed' && (
                    <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
                      <p className="text-red-400 text-sm">NFT generation failed</p>
                      <p className="text-xs text-gray-400 mt-1">Your tokens were still claimed successfully</p>
                      {nftState.error && (
                        <p className="text-xs text-gray-400 mt-1">{nftState.error}</p>
                      )}
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
            text="Claim Tokens + NFT"
            className="w-full"
            disabled={!challengeDescription.trim()}
            isActive={!!challengeDescription.trim()}
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