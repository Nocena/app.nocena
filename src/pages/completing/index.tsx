// pages/completing/index.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import {
  getOrCreateChallenge,
  createChallengeCompletion,
  updateUserTokens,
  updateUserChallengeStrings,
} from '../../lib/api/dgraph';
import { getDayOfYear, getWeekOfYear, getMonth } from '../../lib/utils/dateUtils';
import { checkPinataForFile, createFallbackMediaMetadata } from '../../lib/utils/pinataUtils';

// Types and enums
import { RecordingState, ChallengeParams, MediaMetadata } from '../../lib/completing/types';

// Component imports
import ChallengeHeader from './components/ChallengeHeader';
import IdleView from './components/IdleView';
import StartingView from './components/StartingView';
import RecordingView from './components/RecordingView';
import SelfieView from './components/SelfieView';
import ReviewView from './components/ReviewView';
import StatusView from './components/StatusView';
import FileUploadView from './components/FileUploadView';

// Utilities for media handling
import {
  initializeBackCamera,
  initializeFrontCamera,
  createMediaRecorder,
  uploadMediaToIPFS,
  convertVideoToBase64,
  convertImageToBase64,
} from '../../lib/completing/mediaServices';

const CompletingView = () => {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  // State management
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [statusMessage, setStatusMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for stream handling
  const videoRef = useRef<HTMLVideoElement>(null);
  const selfieVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const backCameraStreamRef = useRef<MediaStream | null>(null);
  const frontCameraStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const selfieChunksRef = useRef<Blob[]>([]);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Type-safe query params
  const {
    type = 'AI',
    frequency = 'daily',
    title = 'Unknown Challenge',
    description = '',
    reward = '1',
    visibility = 'public',
  } = router.query as ChallengeParams;

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      // Clean up video streams
      if (backCameraStreamRef.current) {
        backCameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (frontCameraStreamRef.current) {
        frontCameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Clear timers
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      // Release object URLs
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
    };
  }, [videoPreviewUrl, selfiePreviewUrl]);

  // Begin actual recording after countdown
  const beginRecording = useCallback(() => {
    if (!backCameraStreamRef.current) return;

    try {
      // Setup MediaRecorder with fallback options
      let options = {};

      // Try supported MIME types
      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

      // Find first supported mime type
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options = { mimeType };
          break;
        }
      }

      // Clone the stream to prevent MediaRecorder from affecting the preview
      const videoTrack = backCameraStreamRef.current.getVideoTracks()[0];
      const audioTrack = backCameraStreamRef.current.getAudioTracks()[0];

      // Create a new stream for the recorder
      const recordingStream = new MediaStream();
      if (videoTrack) recordingStream.addTrack(videoTrack.clone());
      if (audioTrack) recordingStream.addTrack(audioTrack);

      // Create MediaRecorder with the cloned stream
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(recordingStream, options);
      } catch (e) {
        console.warn('MediaRecorder with options failed, trying fallback', e);
        mediaRecorder = new MediaRecorder(recordingStream);
      }

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, {
          type: mediaRecorder.mimeType || 'video/webm',
        });
        setVideoBlob(videoBlob);
        const videoUrl = URL.createObjectURL(videoBlob);
        setVideoPreviewUrl(videoUrl);

        // Clean up the recording stream
        recordingStream.getTracks().forEach((track) => track.stop());
      };

      // Start recording with smaller chunks for reliability
      mediaRecorder.start(500);

      // Ensure video element keeps displaying
      if (videoRef.current) {
        if (!videoRef.current.srcObject || videoRef.current.srcObject !== backCameraStreamRef.current) {
          videoRef.current.srcObject = backCameraStreamRef.current;
          videoRef.current.play().catch((e) => console.error('Error playing video:', e));
        }
      }

      setRecordingState(RecordingState.RECORDING);

      // Setup recording timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          const newTime = prevTime + 1;
          // Automatically stop at 30 seconds
          if (newTime >= 30) handleStopRecording();
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
      setRecordingState(RecordingState.ERROR);
    }
  }, []);

  // Start the recording process
  const handleStartRecording = useCallback(async () => {
    if (frequency === 'weekly' || frequency === 'monthly') {
      setRecordingState(RecordingState.FILE_UPLOAD);
      return;
    }

    setRecordingState(RecordingState.STARTING);

    // Initialize back camera - fixed TypeScript error
    const stream = await initializeBackCamera(videoRef as any);

    if (!stream) {
      setError('Could not access your camera. Please ensure you have granted permission.');
      setRecordingState(RecordingState.ERROR);
      return;
    }

    backCameraStreamRef.current = stream;

    // Start countdown
    setCountdown(3);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(countdownTimerRef.current!);
          beginRecording();
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
  }, [beginRecording]);

  // Add this new handler for file uploads
  const handleFilesSelected = useCallback(async (videoFile: File, selfieFile: File) => {
    setIsLoading(true);
    setRecordingState(RecordingState.UPLOADING);
    setStatusMessage('Processing your uploaded files...');

    try {
      // Convert files to blobs and then to base64
      const videoBlob = new Blob([videoFile], { type: videoFile.type });
      const selfieBlob = new Blob([selfieFile], { type: selfieFile.type });

      setVideoBlob(videoBlob);
      setSelfieBlob(selfieBlob);

      // Create preview URLs
      const videoUrl = URL.createObjectURL(videoBlob);
      const selfieUrl = URL.createObjectURL(selfieBlob);

      setVideoPreviewUrl(videoUrl);
      setSelfiePreviewUrl(selfieUrl);

      // Process as in the review step
      setRecordingState(RecordingState.REVIEW);
    } catch (err) {
      console.error('Error processing uploaded files:', err);
      setError('Failed to process your files. Please try again.');
      setRecordingState(RecordingState.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop recording and switch to selfie mode
  const handleStopRecording = useCallback(() => {
    // Clear recording timer
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop video stream tracks
    if (backCameraStreamRef.current) {
      backCameraStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Switch to selfie mode
    setRecordingState(RecordingState.SELFIE_MODE);

    // Initialize front camera - fixed TypeScript error
    initializeFrontCamera(selfieVideoRef as any).then((stream) => {
      if (stream) {
        frontCameraStreamRef.current = stream;
      } else {
        setError('Could not access your front camera for selfie.');
        setRecordingState(RecordingState.ERROR);
      }
    });
  }, []);

  // Capture selfie using MediaRecorder
  const handleCaptureSelfie = useCallback(async () => {
    if (!selfieVideoRef.current || !frontCameraStreamRef.current) {
      setError('Cannot access selfie camera. Please try again.');
      return;
    }

    try {
      // Take a snapshot from the video stream using canvas
      const video = selfieVideoRef.current;
      const canvas = document.createElement('canvas');

      // Match canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Flip horizontally for selfie mirror effect
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob with high quality
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          'image/jpeg',
          0.95,
        ); // High quality JPEG
      });

      // Set the selfie blob and create a URL for preview
      setSelfieBlob(blob);
      const selfieUrl = URL.createObjectURL(blob);
      setSelfiePreviewUrl(selfieUrl);

      // Stop the camera stream
      frontCameraStreamRef.current.getTracks().forEach((track) => track.stop());

      // Move to review state
      setRecordingState(RecordingState.REVIEW);
    } catch (err) {
      console.error('Error in selfie capture:', err);

      // Create a fallback selfie if capture fails
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw a colored rectangle as placeholder
          ctx.fillStyle = '#3B82F6';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'white';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Selfie Placeholder', canvas.width / 2, canvas.height / 2);

          canvas.toBlob((blob) => {
            if (blob) {
              setSelfieBlob(blob);
              const url = URL.createObjectURL(blob);
              setSelfiePreviewUrl(url);

              // Stop the camera
              if (frontCameraStreamRef.current) {
                frontCameraStreamRef.current.getTracks().forEach((track) => track.stop());
              }

              // Move to review state
              setRecordingState(RecordingState.REVIEW);
            }
          }, 'image/jpeg');
        }
      } catch (fallbackErr) {
        console.error('Even fallback failed:', fallbackErr);
        setError('Failed to capture selfie. Please try again.');
      }
    }
  }, []);

  // Submit challenge to backend
  const handleSubmitChallenge = useCallback(async () => {
    if (!user || !videoBlob) {
      setError('Missing required data to complete challenge');
      return;
    }

    // Set appropriate size limit based on challenge type
    const MAX_SIZE_MB = frequency === 'monthly' ? 95 : frequency === 'weekly' ? 60 : 30;
    const videoSizeMB = videoBlob.size / (1024 * 1024);

    if (videoSizeMB > MAX_SIZE_MB) {
      setError(`Video file is too large (${videoSizeMB.toFixed(1)}MB). Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    setRecordingState(RecordingState.UPLOADING);
    setIsLoading(true);
    setStatusMessage('Processing your challenge completion...');

    try {
      // Convert blobs to base64 for upload
      setStatusMessage('Converting media...');
      const videoBase64 = await convertVideoToBase64(videoBlob);
      const selfieBase64 = selfieBlob ? await convertImageToBase64(selfieBlob) : null;

      // Generate a unique challenge identifier for upload
      const tempChallengeId = title.replace(/\s+/g, '-').toLowerCase();

      // 1. Upload to IPFS - Updated to use 4 arguments
      setStatusMessage('Uploading to decentralized storage...');
      const mediaMetadata = await uploadMediaToIPFS(videoBase64, selfieBase64, tempChallengeId, user.id);

      // 2. Get or create the challenge in Dgraph
      setStatusMessage('Processing challenge details...');
      const isAIChallenge = type === 'AI';

      const challengeId = await getOrCreateChallenge(
        title,
        description || `${title} challenge`,
        parseInt(reward),
        type,
        isAIChallenge ? frequency : null,
        visibility || 'public',
      );

      // 3. Create challenge completion record with the enhanced media metadata
      setStatusMessage('Recording your completion...');

      // Convert MediaMetadata to string or MediaMetadata as expected by the function
      const mediaMetadataForCompletion = mediaMetadata as any;

      const completionId = await createChallengeCompletion(
        user.id,
        challengeId,
        mediaMetadataForCompletion,
        isAIChallenge,
        visibility || 'public',
      );

      // 4. Update user tokens in Dgraph
      setStatusMessage('Updating your rewards...');
      const rewardAmount = parseInt(reward);
      await updateUserTokens(user.id, rewardAmount);

      // 5. Update challenge tracking strings if this is an AI challenge
      if (isAIChallenge && frequency) {
        setStatusMessage('Updating your challenge streaks...');
        await updateUserChallengeStrings(user.id, frequency);
      }

      // 6. Update user context with new token balance and completion record
      const newCompletedChallenge = {
        type: isAIChallenge ? `AI-${frequency}` : 'Social',
        title: title || 'Unknown Challenge',
        date: new Date().toISOString(),
        proofCID: mediaMetadata.directoryCID || mediaMetadata.videoCID, // Support both formats
        hasVideo: true,
        hasSelfie: mediaMetadata.hasSelfie,
      };

      // Update local user context based on frequency
      const userUpdate: any = {
        earnedTokens: (user.earnedTokens || 0) + rewardAmount,
        completedChallenges: [...(user.completedChallenges || []), newCompletedChallenge],
      };

      // Update the challenge string in local context if it exists
      if (isAIChallenge && frequency) {
        const now = new Date();

        if (frequency === 'daily') {
          const dayOfYear = getDayOfYear(now) - 1;
          let dailyString = user.dailyChallenge || '0'.repeat(365);
          dailyString = dailyString.substring(0, dayOfYear) + '1' + dailyString.substring(dayOfYear + 1);
          userUpdate.dailyChallenge = dailyString;
        } else if (frequency === 'weekly') {
          const weekOfYear = getWeekOfYear(now) - 1;
          let weeklyString = user.weeklyChallenge || '0'.repeat(54);
          weeklyString = weeklyString.substring(0, weekOfYear) + '1' + weeklyString.substring(weekOfYear + 1);
          userUpdate.weeklyChallenge = weeklyString;
        } else if (frequency === 'monthly') {
          const month = now.getMonth();
          let monthlyString = user.monthlyChallenge || '0'.repeat(12);
          monthlyString = monthlyString.substring(0, month) + '1' + monthlyString.substring(month + 1);
          userUpdate.monthlyChallenge = monthlyString;
        }
      }

      // Update user in context/local storage
      await updateUser(userUpdate);

      // 7. Show success and move to completion state
      setStatusMessage(`Challenge completed! You earned ${reward} NOCENIX`);
      setRecordingState(RecordingState.COMPLETE);

      // 8. Navigate back to home page after a delay
      setTimeout(() => {
        router.push('/home');
      }, 2000);
    } catch (error: any) {
      console.error('Challenge submission error:', error);
      setError(error.message || 'Failed to complete challenge');
      setRecordingState(RecordingState.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [user, videoBlob, selfieBlob, type, frequency, title, description, reward, visibility, router, updateUser]);

  // Retake only the video
  const handleRetakeVideo = useCallback(() => {
    // Clear video state
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoBlob(null);
    setVideoPreviewUrl(null);

    // Reset to idle state to restart video capture
    setRecordingState(RecordingState.IDLE);
  }, [videoPreviewUrl]);

  // Retake only the selfie
  const handleRetakeSelfie = useCallback(() => {
    // Clear selfie state
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);
    setSelfieBlob(null);
    setSelfiePreviewUrl(null);

    // Move to selfie mode
    setRecordingState(RecordingState.SELFIE_MODE);

    // Initialize front camera again - fixed TypeScript error
    initializeFrontCamera(selfieVideoRef as any).then((stream) => {
      if (stream) {
        frontCameraStreamRef.current = stream;
      } else {
        setError('Could not access your front camera for selfie.');
        setRecordingState(RecordingState.ERROR);
      }
    });
  }, [selfiePreviewUrl]);

  // Reset everything for retry
  const handleRetry = useCallback(() => {
    // Clear error state
    setError(null);

    // Reset all media state
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    if (selfiePreviewUrl) URL.revokeObjectURL(selfiePreviewUrl);

    setVideoBlob(null);
    setSelfieBlob(null);
    setVideoPreviewUrl(null);
    setSelfiePreviewUrl(null);

    // Reset to idle state
    setRecordingState(RecordingState.IDLE);
  }, [videoPreviewUrl, selfiePreviewUrl]);

  // Render content based on current state
  const renderContent = () => {
    // Create a challenge params object to pass to components
    const challengeParams: ChallengeParams = {
      type,
      frequency,
      title,
      description,
      reward,
      visibility,
    };

    switch (recordingState) {
      case RecordingState.IDLE:
        return <IdleView onStartRecording={handleStartRecording} challengeParams={challengeParams} />;
      case RecordingState.FILE_UPLOAD:
        return (
          <FileUploadView
            onFilesSelected={handleFilesSelected}
            onCancel={() => setRecordingState(RecordingState.IDLE)}
            challengeParams={challengeParams}
          />
        );
      case RecordingState.STARTING:
        return <StartingView countdown={countdown} videoRef={videoRef} />;
      case RecordingState.RECORDING:
        return (
          <RecordingView
            videoRef={videoRef}
            recordingTime={recordingTime}
            description={description}
            onStopRecording={handleStopRecording}
            stream={backCameraStreamRef.current}
          />
        );
      case RecordingState.SELFIE_MODE:
        return <SelfieView selfieVideoRef={selfieVideoRef} onCaptureSelfie={handleCaptureSelfie} />;
      case RecordingState.REVIEW:
        return (
          <ReviewView
            videoPreviewUrl={videoPreviewUrl}
            videoBlob={videoBlob}
            selfiePreviewUrl={selfiePreviewUrl}
            selfieBlob={selfieBlob}
            onRetry={handleRetry}
            onSubmit={handleSubmitChallenge}
            onRetakeVideo={handleRetakeVideo}
            onRetakeSelfie={handleRetakeSelfie}
          />
        );
      case RecordingState.UPLOADING:
      case RecordingState.COMPLETE:
      case RecordingState.ERROR:
        return (
          <StatusView
            state={recordingState}
            statusMessage={statusMessage}
            error={error}
            reward={reward}
            onRetry={handleRetry}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-start px-4 pt-2 w-full max-w-md mx-auto overflow-y-auto pb-28">
      <ChallengeHeader title={title} reward={reward} />
      {renderContent()}
    </div>
  );
};

export default CompletingView;
