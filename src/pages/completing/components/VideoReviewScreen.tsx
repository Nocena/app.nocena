'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  videoDuration: number;
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
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
  }, [videoBlob]); // Remove thumbnailUrl from dependencies to avoid infinite loop

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
      // Set to a very early frame but not exactly 0
      video.currentTime = 0.05;
    };

    video.onloadeddata = () => {
      console.log('Video data loaded for thumbnail');
      // Fallback: try to extract frame immediately if seeking doesn't work
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
      // Another fallback attempt
      if (!thumbnailUrl) {
        extractFrame();
      }
    };

    video.onerror = (e) => {
      console.error('Error loading video for thumbnail:', e);
    };
  };

  const canProceed = videoDuration >= 3;

  // Format duration display
  const formatDuration = (duration: number) => {
    if (duration <= 0) {
      return 'Unknown';
    }
    return `${duration.toFixed(1)}s`;
  };

  return (
    <div className="text-white h-full flex flex-col px-6 py-4">
      {/* Header - Compact */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-light mb-1">Review Your Recording</h2>
        <div className="text-sm text-gray-400">
          {challenge.title} • {formatDuration(videoDuration)}
        </div>
      </div>

      {/* Video Player - Mobile-optimized vertical/square format with minimal controls */}
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
              // Try to generate thumbnail from the main video element if we don't have one
              if (!thumbnailUrl && videoRef.current) {
                const video = videoRef.current;
                video.currentTime = 0.05;
              }
            }}
            onSeeked={() => {
              console.log('Main video seeked');
              // Generate thumbnail when seeking completes on main video
              if (!thumbnailUrl && videoRef.current) {
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
                        if (blob) {
                          const thumbUrl = URL.createObjectURL(blob);
                          setThumbnailUrl(thumbUrl);
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
            }}
            onCanPlay={() => {
              console.log('Main video can play');
              // Final fallback: if no thumbnail and video is ready, extract frame
              if (!thumbnailUrl && videoRef.current && videoRef.current.videoWidth > 0) {
                const video = videoRef.current;
                video.currentTime = 0.05;
              }
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

      {/* Status Message - Clean design */}
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

      {/* Action Buttons - Primary action first (Continue) */}
      <div className="flex gap-4 mt-auto">
        <PrimaryButton onClick={onRetakeVideo} text="Retake Video" className="flex-1" isActive={true} />
        <PrimaryButton
          onClick={onApproveVideo}
          text={canProceed ? 'Continue' : 'Too Short'}
          className={`flex-1 ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!canProceed}
          isActive={false}
        />
      </div>
    </div>
  );
};

export default VideoReviewScreen;
