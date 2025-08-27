'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);

    // Generate thumbnail immediately
    console.log('Starting thumbnail generation');
    generateThumbnail(url);

    return () => {
      URL.revokeObjectURL(url);
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [videoBlob]);

  const generateThumbnail = (videoUrl: string) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const extractFrame = () => {
      if (thumbnailGenerated) return; // Prevent multiple generations

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
      console.log('Video metadata loaded for thumbnail');
      video.currentTime = 0.05;
    };

    video.onloadeddata = () => {
      console.log('Video data loaded for thumbnail');
      if (video.videoWidth > 0) {
        extractFrame();
      }
    };

    video.onseeked = () => {
      console.log('Video seeked for thumbnail');
      extractFrame();
    };

    video.oncanplay = () => {
      console.log('Video can play for thumbnail');
      extractFrame();
    };

    video.onerror = (e) => {
      console.error('Error loading video for thumbnail:', e);
    };
  };

  const canProceed = videoDuration >= 3;

  const formatDuration = (duration: number) => {
    if (duration <= 0) {
      return 'Unknown';
    }
    return `${duration.toFixed(1)}s`;
  };

  // Get background task status for display - FIXED to prevent constant polling
  const getBackgroundTaskStatus = () => {
    const tasks = [];

    if (backgroundTaskIds.videoAnalysisId) {
      const task = backgroundTasks.getTask(backgroundTaskIds.videoAnalysisId);
      if (task) {
        tasks.push({
          name: 'Video Analysis',
          status: task.status,
          progress: task.progress,
          icon: '📹',
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
          icon: '🎨',
        });
      }
    }

    return tasks;
  };

  // FIXED: Get status once and memoize it, don't call in render loop
  const [backgroundTaskStatus, setBackgroundTaskStatus] = useState<any[]>([]);

  // Update status when task IDs change, but don't spam
  useEffect(() => {
    const newStatus = getBackgroundTaskStatus();
    setBackgroundTaskStatus(newStatus);
  }, [backgroundTaskIds.videoAnalysisId, backgroundTaskIds.nftGenerationId]);

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
        {/* Back Button - Left */}
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

        {/* Cancel Button - Right */}
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

      {/* Main Content Container */}
      <div className="h-full flex flex-col">
        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 80px)' }}
        >
          {/* Header - Compact */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-light mb-1">Review Your Recording</h2>
            <div className="text-sm text-gray-400">
              {challenge.title} • {formatDuration(videoDuration)}
            </div>
          </div>

          {/* Video Player - FIXED to prevent event loops */}
          <div className="mb-6 flex justify-center">
            <div className="relative rounded-2xl overflow-hidden bg-black w-64 h-80 shadow-2xl">
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
                  // FIXED: Only seek if we haven't generated thumbnail yet
                  if (!thumbnailGenerated && videoRef.current) {
                    const video = videoRef.current;
                    video.currentTime = 0.05;
                  }
                }}
                onSeeked={() => {
                  console.log('Main video seeked');
                  // FIXED: Only generate thumbnail once from main video
                  if (!thumbnailGenerated && videoRef.current) {
                    generateThumbnailFromMainVideo();
                  }
                }}
                onCanPlay={() => {
                  console.log('Main video can play');
                  // FIXED: Removed currentTime setting that caused infinite loop
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
            </div>
          </div>

          {/* Background Processing Status */}
          {backgroundTaskStatus.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-nocenaPink rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-nocenaPink">Background Processing</span>
              </div>
              <div className="space-y-2">
                {backgroundTaskStatus.map((task, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{task.icon}</span>
                      <span className="text-sm text-gray-300">{task.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'running' && (
                        <>
                          <div className="w-16 bg-gray-700 rounded-full h-1">
                            <div
                              className="bg-nocenaPink h-1 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400 w-8">{task.progress}%</span>
                        </>
                      )}
                      {task.status === 'completed' && <span className="text-green-400 text-sm">✓</span>}
                      {task.status === 'queued' && <span className="text-gray-400 text-sm">⏳</span>}
                      {task.status === 'failed' && <span className="text-red-400 text-sm">✗</span>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 opacity-75">
                Processing continues while you review • No need to wait
              </p>
            </div>
          )}

          {/* Status Message */}
          <div
            className={`rounded-2xl p-5 mb-6 ${
              canProceed
                ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-800/20'
                : 'bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-800/20'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  canProceed ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}
              >
                <svg
                  className={`w-5 h-5 ${canProceed ? 'text-green-400' : 'text-red-400'}`}
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
              </div>
              <div className="flex-1">
                <p className={`text-base font-medium mb-1 ${canProceed ? 'text-green-300' : 'text-red-300'}`}>
                  {canProceed
                    ? `Perfect! ${formatDuration(videoDuration)} recording`
                    : `Too short: ${formatDuration(videoDuration)}`}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {canProceed ? 'Ready for identity verification' : 'Minimum 3 seconds required for verification'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons at Bottom */}
        <div
          className="flex-shrink-0 px-6 py-4 bg-black/50 backdrop-blur-sm border-t border-gray-800"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
          }}
        >
          <div className="flex gap-4">
            <PrimaryButton onClick={onRetakeVideo} text="Retake Video" className="flex-1" isActive={true} />
            <PrimaryButton
              onClick={onApproveVideo}
              text={canProceed ? 'Continue' : 'Too Short'}
              className={`flex-1 ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canProceed}
              isActive={!canProceed}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Helper function to generate thumbnail from main video (called only once)
  function generateThumbnailFromMainVideo() {
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
  }
};

export default VideoReviewScreen;
