'use client';

import React, { useState, useEffect } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
  type: 'AI' | 'PRIVATE' | 'PUBLIC';
}

interface VideoReviewScreenProps {
  challenge: Challenge;
  videoBlob: Blob;
  videoDuration: number; // Pass duration from recording screen
  onApproveVideo: () => void;
  onRetakeVideo: () => void;
  onBack: () => void;
}

const VideoReviewScreen: React.FC<VideoReviewScreenProps> = ({
  challenge,
  videoBlob,
  videoDuration,
  onApproveVideo,
  onRetakeVideo,
  onBack,
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');

  useEffect(() => {
    console.log('Challenge object:', challenge);
    console.log('Video blob size:', videoBlob.size);
    console.log('Video blob type:', videoBlob.type);
    console.log('Passed video duration:', videoDuration);

    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [videoBlob, challenge, videoDuration]);

  const canProceed = videoDuration >= 3;

  // Format duration display
  const formatDuration = (duration: number) => {
    if (duration <= 0) {
      return 'Unknown';
    }
    return `${duration.toFixed(1)}s`;
  };

  return (
    <div className="text-white h-screen overflow-hidden pt-20 -mt-20">
      <div className="h-full flex flex-col px-6">
        <div className="text-center mb-6 mt-4">
          <h2 className="text-2xl font-light mb-2">Review Your Recording</h2>
          <div className="text-sm text-gray-400">
            {challenge.title} • {formatDuration(videoDuration)}
          </div>
        </div>

        <div className="flex-1 mb-6">
          <div className="relative rounded-xl overflow-hidden bg-black h-full">
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Video loading error:', e);
              }}
              preload="metadata"
            />
          </div>
        </div>

        <div
          className={`rounded-lg p-4 mb-6 border ${
            canProceed ? 'bg-green-900/20 border-green-800/30' : 'bg-red-900/20 border-red-800/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <svg
              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${canProceed ? 'text-green-400' : 'text-red-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {canProceed ? (
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            <div>
              <p className={`text-sm mb-1 ${canProceed ? 'text-green-300' : 'text-red-300'}`}>
                {canProceed
                  ? `Perfect! Your ${formatDuration(videoDuration)} recording meets the requirements.`
                  : `Recording too short: ${formatDuration(videoDuration)} (minimum 3s required).`}
              </p>
              <p className="text-xs text-gray-400">
                {canProceed
                  ? "Review your recording above. If you're happy with it, proceed to identity verification."
                  : 'Please record again for at least 3 seconds to ensure proper verification.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <PrimaryButton
            onClick={onApproveVideo}
            text={'Retake video'}
            className={`flex-1 ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!canProceed}
            isActive={true}
          />
          <PrimaryButton
            onClick={onApproveVideo}
            text={canProceed ? 'Continue to Selfie' : 'Record Again (Too Short)'}
            className={`flex-1 ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!canProceed}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoReviewScreen;
