// src/pages/completing/components/FileUploadView.tsx
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChallengeParams } from '../../../lib/completing/types';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface FileUploadViewProps {
  onFilesSelected: (videoFile: File, selfieFile: File) => void;
  onCancel: () => void;
  challengeParams?: ChallengeParams;
}

const FileUploadView: React.FC<FileUploadViewProps> = ({ onFilesSelected, onCancel, challengeParams }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [durationValid, setDurationValid] = useState<boolean | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Default to weekly if not specified
  const frequency = challengeParams?.frequency || 'weekly';

  // Duration requirements
  const getDurationLimits = () => {
    if (frequency === 'weekly') {
      return { min: 15, max: 60 };
    } else if (frequency === 'monthly') {
      return { min: 60, max: 180 };
    }
    return { min: 15, max: 60 }; // Default
  };

  const { min: minDuration, max: maxDuration } = getDurationLimits();

  // Check video duration when metadata loads
  const checkVideoDuration = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const duration = video.duration;

    console.log(`Video duration: ${duration}s, Required: ${minDuration}-${maxDuration}s`);
    setVideoDuration(duration);

    const isValid = duration >= minDuration && duration <= maxDuration;
    setDurationValid(isValid);

    // Generate thumbnail
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg');
        setVideoThumbnail(thumbnail);
      }
    } catch (err) {
      console.error('Error generating thumbnail:', err);
    }

    setIsVideoLoading(false);
  };

  // Generate video thumbnail and validate duration when video is loaded
  useEffect(() => {
    if (videoPreview && videoRef.current) {
      const video = videoRef.current;
      setIsVideoLoading(true);

      // Load metadata and check duration
      if (video.readyState >= 2) {
        checkVideoDuration();
      } else {
        const handleMetadataLoaded = () => {
          checkVideoDuration();
        };

        video.addEventListener('loadedmetadata', handleMetadataLoaded);
        return () => {
          video.removeEventListener('loadedmetadata', handleMetadataLoaded);
        };
      }
    }
  }, [videoPreview, minDuration, maxDuration]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }

      // Reset duration validation
      setDurationValid(null);
      setVideoDuration(null);
      setVideoThumbnail(null);
      setIsVideoLoading(true);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoPreview(previewUrl);
      setError(null);
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file for your selfie');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setSelfieFile(file);
      setSelfiePreview(previewUrl);
      setError(null);
    }
  };

  const handleSubmit = () => {
    if (!videoFile || !selfieFile) {
      setError('Please upload both a video and a selfie');
      return;
    }

    if (durationValid !== true) {
      setError(
        `Video duration must be between ${formatDuration(minDuration, true)} and ${formatDuration(maxDuration, true)}`,
      );
      return;
    }

    onFilesSelected(videoFile, selfieFile);
  };

  const formatDuration = (seconds: number | null, showUnit = false) => {
    if (seconds === null) return '--';

    // For weekly challenges with short durations, show seconds
    if (frequency === 'weekly' && seconds < 60) {
      return `${Math.round(seconds)}${showUnit ? 's' : ''}`;
    }

    // For longer durations, show minutes
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);

    if (secs === 0) {
      return `${mins}${showUnit ? 'm' : ''}`;
    }

    return showUnit ? `${mins}m ${secs}s` : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <LoadingSpinner />
        <p className="mt-4 text-white">Processing your files...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center mb-10">
      <div className="bg-[#1A2734] rounded-xl p-6 w-full mb-6">
        <h3 className="text-center text-white text-lg mb-6">Upload Your Challenge</h3>

        {/* Video upload section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <p className="text-white text-lg">Video of your challenge:</p>
            {videoDuration !== null && (
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  durationValid ? 'bg-green-500 bg-opacity-30 text-green-200' : 'bg-red-500 bg-opacity-30 text-red-200'
                }`}
              >
                {formatDuration(videoDuration)}
              </span>
            )}
          </div>

          {/* Video preview or upload prompt */}
          {videoPreview ? (
            <div className="relative rounded-lg overflow-hidden mb-2">
              {/* Hidden video element for metadata */}
              <video ref={videoRef} src={videoPreview} className="hidden" preload="metadata" />

              {/* Duration validation banner */}
              {videoDuration !== null && !durationValid && (
                <div className="px-4 py-3 rounded-lg text-sm bg-red-900 bg-opacity-40 text-red-200 border border-red-700 mb-4 flex items-center mt-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Video too {videoDuration < minDuration ? 'short' : 'long'}: {formatDuration(videoDuration)}
                  <div className="ml-auto text-xs opacity-80">
                    Required: {minDuration}s - {maxDuration}s
                  </div>
                </div>
              )}

              {/* Thumbnail or video player */}
              <div className="relative rounded-lg overflow-hidden">
                {videoThumbnail ? (
                  <div
                    className="relative cursor-pointer"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.className = 'w-full h-auto block rounded-lg';
                        videoRef.current.controls = true;
                        videoRef.current.play();
                        setVideoThumbnail(null);
                      }
                    }}
                  >
                    <div className="relative w-full aspect-video">
                      <Image
                        src={videoThumbnail}
                        alt="Video thumbnail"
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-black bg-opacity-60 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : isVideoLoading ? (
                  <div className="bg-gray-800 rounded-lg h-48 flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                ) : null}
              </div>

              <button
                onClick={() => {
                  if (videoPreview) URL.revokeObjectURL(videoPreview);
                  setVideoFile(null);
                  setVideoPreview(null);
                  setVideoThumbnail(null);
                  setVideoDuration(null);
                  setDurationValid(null);
                  setIsVideoLoading(false);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full z-10"
                aria-label="Remove video"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-500 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition w-full h-48 flex flex-col items-center justify-center"
              onClick={() => videoInputRef.current?.click()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400 mb-2"
              >
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              <p className="text-gray-400 text-lg">Tap to select video</p>
              <p className="text-gray-500 text-sm mt-1">
                {frequency === 'weekly'
                  ? `Required: ${formatDuration(minDuration, true)}-${formatDuration(maxDuration, true)}`
                  : `Required: ${formatDuration(minDuration, true)}-${formatDuration(maxDuration, true)}`}
              </p>
            </div>
          )}

          <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleVideoChange} />
        </div>

        {/* Selfie upload section */}
        <div className="mb-6">
          <p className="text-white text-lg mb-3">Selfie photo:</p>

          {selfiePreview ? (
            <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden mb-2">
              <div className="relative w-full h-full">
                <Image
                  src={selfiePreview}
                  alt="Selfie preview"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-lg"
                />
              </div>
              <button
                onClick={() => {
                  if (selfiePreview) URL.revokeObjectURL(selfiePreview);
                  setSelfieFile(null);
                  setSelfiePreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                aria-label="Remove selfie"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition w-48 h-48 mx-auto flex flex-col items-center justify-center"
              onClick={() => selfieInputRef.current?.click()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400 mb-2"
              >
                <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9"></path>
                <rect x="4" y="16" width="16" height="6" rx="1"></rect>
                <circle cx="12" cy="9" r="3"></circle>
              </svg>
              <p className="text-gray-400">Tap to select selfie</p>
            </div>
          )}

          <input type="file" accept="image/*" className="hidden" ref={selfieInputRef} onChange={handleSelfieChange} />
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-40 p-3 rounded-lg mt-4 mb-4 text-red-200 border border-red-800">
            {error}
          </div>
        )}
      </div>

      <div className="w-full grid grid-cols-2 gap-5 px-1">
        <PrimaryButton text="Cancel" onClick={onCancel} isActive={false} />
        <PrimaryButton
          text="Submit"
          onClick={handleSubmit}
          isActive={durationValid === true}
          disabled={!videoFile || !selfieFile || durationValid !== true}
        />
      </div>
    </div>
  );
};

export default FileUploadView;
