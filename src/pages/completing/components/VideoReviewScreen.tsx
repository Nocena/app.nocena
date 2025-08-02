'use client';

import React, { useState, useEffect, useRef } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';

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
  onCancel: () => void; // Add cancel handler
}

const VideoReviewScreen: React.FC<VideoReviewScreenProps> = ({
  challenge,
  videoBlob,
  videoDuration,
  onApproveVideo,
  onRetakeVideo,
  onBack,
  onCancel,
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
  }, [videoBlob]);

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
      if (!thumbnailUrl) {
        extractFrame();
      }
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

      <div
        className="text-white h-full flex flex-col px-6 py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 80px)' }}
      >
        {/* Header - Compact */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-light mb-1">Review Your Recording</h2>
          <div className="text-sm text-gray-400">
            {challenge.title} • {formatDuration(videoDuration)}
          </div>
        </div>

        {/* Video Player */}
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
                if (!thumbnailUrl && videoRef.current) {
                  const video = videoRef.current;
                  video.currentTime = 0.05;
                }
              }}
              onSeeked={() => {
                console.log('Main video seeked');
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

        {/* Action Buttons */}
        <div className="flex gap-4 mt-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
    </div>
  );
};

export default VideoReviewScreen;
