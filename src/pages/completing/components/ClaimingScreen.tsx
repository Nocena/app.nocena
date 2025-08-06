'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import { completeChallengeWorkflow, CompletionData } from '../../../lib/completing/challengeCompletionService';
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

  useEffect(() => {
    const vUrl = URL.createObjectURL(videoBlob);
    const pUrl = URL.createObjectURL(photoBlob);

    setVideoUrl(vUrl);
    setPhotoUrl(pUrl);

    // Keyboard detection for mobile
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

      const result = await completeChallengeWorkflow(user.id, completionData, updateUser);

      if (result.success) {
        setClaimingStage('success');

        onClaimComplete({
          ...completionData,
          completionId: result.completionId,
          tokensEarned: challenge.reward,
        });

        setTimeout(() => {
          window.location.href = '/home';
        }, 3000);
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
          title: 'Tokens Claimed!',
          subtitle: `+${challenge.reward} Nocenix earned`,
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
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
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

            {/* Description Input - FIXED */}
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
              </div>
              <p className="text-xs text-gray-400 mt-4">This may take a few moments</p>
            </div>
          </div>
        )}

        {claimingStage === 'success' && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-green-900/20 to-purple-900/20 border border-green-800/20 rounded-2xl p-8">
              <div className="w-20 h-20 bg-nocenaPurple rounded-full flex items-center justify-center mx-auto mb-6">
                <Image src="/nocenix.ico" alt="Success" width={40} height={40} />
              </div>
              <h3 className="text-2xl font-bold text-nocenaPurple mb-3">Tokens Claimed!</h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-xl font-bold">+{challenge.reward}</span>
                <Image src="/nocenix.ico" alt="Nocenix" width={24} height={24} />
                <span className="text-lg text-gray-300">NOCENIX</span>
              </div>
              <p className="text-sm text-gray-300 mb-2">Added to your wallet</p>
              <p className="text-xs text-gray-400">Redirecting to home...</p>
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
            text="Claim Tokens"
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