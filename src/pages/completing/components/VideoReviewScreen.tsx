'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import { useBackgroundTasks } from '../../../contexts/BackgroundTaskContext';

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
  type: 'AI' | 'PRIVATE' | 'PUBLIC';
}

interface BackgroundTasks {
  videoAnalysisId?: string;
  nftGenerationId?: string;
  verificationPrepId?: string;
  faceMatchingId?: string;
}

interface VideoReviewScreenProps {
  challenge: Challenge;
  videoBlob: Blob;
  videoDuration: number;
  onApproveVideo: () => void;
  onRetakeVideo: () => void;
  onBack: () => void;
  onCancel: () => void;
  backgroundTaskIds: BackgroundTasks;
}

const VideoReviewScreen: React.FC<VideoReviewScreenProps> = ({
  challenge,
  videoBlob,
  videoDuration,
  onApproveVideo,
  onRetakeVideo,
  onBack,
  onCancel,
  backgroundTaskIds,
}) => {
  const backgroundTasks = useBackgroundTasks();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [thumbnailGenerated, setThumbnailGenerated] = useState<boolean>(false);
  const [backgroundTaskStatus, setBackgroundTaskStatus] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);

    console.log('Starting thumbnail generation');
    generateThumbnail(url);

    return () => {
      URL.revokeObjectURL(url);
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [videoBlob]);

  // Update background task status
  useEffect(() => {
    const getBackgroundTaskStatus = () => {
      const tasks = [];

      if (backgroundTaskIds.videoAnalysisId) {
        const task = backgroundTasks.getTask(backgroundTaskIds.videoAnalysisId);
        if (task) {
          tasks.push({
            name: 'Video Analysis',
            status: task.status,
            progress: task.progress,
          });
        }
      }

      if (backgroundTaskIds.nftGenerationId) {
        const task = backgroundTasks.getTask(backgroundTaskIds.nftGenerationId);
        if (task) {
          tasks.push({
            name: 'NFT Generation',
            status: task.status,
            progress: task.progress,
          });
        }
      }

      return tasks;
    };

    const newStatus = getBackgroundTaskStatus();
    setBackgroundTaskStatus(newStatus);
  }, [backgroundTaskIds.videoAnalysisId, backgroundTaskIds.nftGenerationId]);

  const generateThumbnail = (videoUrl: string) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const extractFrame = () => {
      if (thumbnailGenerated) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob && !thumbnailGenerated) {
                const thumbUrl = URL.createObjectURL(blob);
                setThumbnailUrl(thumbUrl);
                setThumbnailGenerated(true);
                console.log('Thumbnail generated successfully');
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
      if (!thumbnailGenerated) {
        extractFrame();
      }
    };

    video.onerror = (e) => {
      console.error('Error loading video for thumbnail:', e);
    };
  };

  const generateThumbnailFromMainVideo = () => {
    if (!videoRef.current || thumbnailGenerated) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob && !thumbnailGenerated) {
              const thumbUrl = URL.createObjectURL(blob);
              setThumbnailUrl(thumbUrl);
              setThumbnailGenerated(true);
              console.log('Thumbnail generated from main video');
            }
          },
          'image/jpeg',
          0.9,
        );
      }
    } catch (error) {
      console.error('Error generating thumbnail from main video:', error);
    }
  };

  const canProceed = videoDuration >= 3;
  const formatDuration = (duration: number) => {
    if (duration <= 0) return 'Unknown';
    return `${duration.toFixed(1)}s`;
  };

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

      {/* Main Content */}
      <div
        className="h-full flex flex-col items-center justify-center px-6 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 80px)' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-light mb-1">Review Recording</h2>
          <div className="text-sm text-gray-400">{challenge.title}</div>
        </div>

        {/* Video Player Card */}
        <div className="mb-4">
          <ThematicContainer color="nocenaBlue" glassmorphic={true} asButton={false} rounded="2xl" className="p-6">
            <div className="relative rounded-xl overflow-hidden bg-black w-64 h-80 shadow-2xl mx-auto">
              <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl || undefined}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Video loading error:', e);
                }}
                onLoadedData={() => {
                  console.log('Main video loaded data');
                  if (!thumbnailGenerated && videoRef.current) {
                    const video = videoRef.current;
                    video.currentTime = 0.05;
                  }
                }}
                onSeeked={() => {
                  console.log('Main video seeked');
                  if (!thumbnailGenerated && videoRef.current) {
                    generateThumbnailFromMainVideo();
                  }
                }}
                onCanPlay={() => {
                  console.log('Main video can play');
                }}
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

              {/* Video Info Overlay */}
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
                      <span className="text-sm font-semibold">{formatDuration(videoDuration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ThematicContainer>
        </div>

        {/* Status Card */}
        <div className="mb-4 w-full max-w-sm">
          <ThematicContainer
            color={canProceed ? 'nocenaPurple' : 'nocenaPink'}
            glassmorphic={true}
            asButton={false}
            rounded="2xl"
            className="p-6 text-center"
          >
            {/* Status Icon */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                canProceed
                  ? 'bg-nocenaPurple/20 border border-nocenaPurple/30'
                  : 'bg-nocenaPink/20 border border-nocenaPink/30'
              }`}
            >
              <svg
                className={`w-6 h-6 ${canProceed ? 'text-nocenaPurple' : 'text-nocenaPink'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {canProceed ? (
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </div>

            {/* Status Text */}
            <h3 className={`text-lg font-bold mb-2 ${canProceed ? 'text-nocenaPurple' : 'text-nocenaPink'}`}>
              {canProceed ? 'Ready to Proceed' : 'Recording Too Short (3s minimum)'}
            </h3>

            {/* Duration Display */}
            <div className="bg-black/30 rounded-xl p-3">
              <div className="text-lg font-bold text-white">{formatDuration(videoDuration)}</div>
              <div className="text-xs text-gray-400">Duration</div>
            </div>
          </ThematicContainer>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm flex gap-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <PrimaryButton onClick={onRetakeVideo} text="Retake Video" className="flex-1" isActive={true} />
          <PrimaryButton
            onClick={onApproveVideo}
            text={canProceed ? 'Continue to Selfie' : 'Too Short to Continue'}
            className="flex-1"
            disabled={!canProceed}
            isActive={!canProceed}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoReviewScreen;
