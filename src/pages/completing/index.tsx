import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicImage from '../../components/ui/ThematicImage';
import ThematicText from '../../components/ui/ThematicText';
import { 
  getOrCreateChallenge, 
  createChallengeCompletion, 
  updateUserTokens 
} from '../../utils/api/dgraph';

interface ChallengeParams {
  type?: string;       // Maps to "category" in our schema
  frequency?: string;  // "daily", "weekly", "monthly" for AI challenges
  title?: string;
  description?: string;
  reward?: string;
  visibility?: string; // "public", "private", "group"
}

interface MediaMetadata {
  directoryCID: string;
  hasVideo: boolean;
  hasSelfie: boolean;
  timestamp: number;
  videoFileName?: string;
  selfieFileName?: string;
}

const nocenixIcon = '/nocenix.ico';

// Recording states
enum RecordingState {
  IDLE = 'idle',
  STARTING = 'starting',
  RECORDING = 'recording',
  SELFIE_MODE = 'selfie_mode',
  REVIEW = 'review',
  UPLOADING = 'uploading',
  COMPLETE = 'complete',
  ERROR = 'error'
}

const CompletingView = () => {
  const router = useRouter();
  const { user, updateUser } = useAuth();
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
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Type-safe query params
  const { 
    type = 'AI', 
    frequency = 'daily', 
    title = 'Unknown Challenge', 
    description = '', 
    reward = '1',
    visibility = 'public' 
  } = router.query as ChallengeParams;

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      // Clean up video streams
      if (backCameraStreamRef.current) {
        backCameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (frontCameraStreamRef.current) {
        frontCameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Clear timers
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      // Release object URLs
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      if (selfiePreviewUrl) {
        URL.revokeObjectURL(selfiePreviewUrl);
      }
    };
  }, [videoPreviewUrl, selfiePreviewUrl]);

  // Initialize back camera stream
  const initializeBackCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        },
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      backCameraStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      return true;
    } catch (err) {
      console.error('Error accessing back camera:', err);
      setError('Could not access your camera. Please ensure you have granted permission.');
      setRecordingState(RecordingState.ERROR);
      return false;
    }
  }, []);

  // Initialize front camera stream
  const initializeFrontCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 } 
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      frontCameraStreamRef.current = stream;
      
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream;
        await selfieVideoRef.current.play();
      }
      
      return true;
    } catch (err) {
      console.error('Error accessing front camera:', err);
      setError('Could not access your front camera for selfie. Please ensure you have granted permission.');
      return false;
    }
  }, []);

  // Start the recording process
  const startRecording = useCallback(async () => {
    setRecordingState(RecordingState.STARTING);
    
    // Initialize back camera
    const backCameraInitialized = await initializeBackCamera();
    if (!backCameraInitialized) return;
    
    // Start countdown
    setCountdown(3);
    
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          clearInterval(countdownTimerRef.current!);
          beginRecording();
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
  }, [initializeBackCamera]);

  // Begin actual recording after countdown
  const beginRecording = useCallback(() => {
    if (!backCameraStreamRef.current) return;
    
    try {
      // Setup MediaRecorder with fallback options for broader browser support
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      let mediaRecorder: MediaRecorder;
      
      // Try to create MediaRecorder with preferred options
      try {
        mediaRecorder = new MediaRecorder(backCameraStreamRef.current, options);
      } catch (e) {
        // If preferred options fail, try without specifying codecs
        console.warn('MediaRecorder with specified options failed, trying fallback', e);
        mediaRecorder = new MediaRecorder(backCameraStreamRef.current);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setVideoBlob(videoBlob);
        const videoUrl = URL.createObjectURL(videoBlob);
        setVideoPreviewUrl(videoUrl);
      };
      
      // Start recording
      mediaRecorder.start(1000); // Capture in 1-second chunks
      setRecordingState(RecordingState.RECORDING);
      
      // Setup recording timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          
          // Automatically stop at 30 seconds
          if (newTime >= 30) {
            stopRecording();
          }
          
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
      setRecordingState(RecordingState.ERROR);
    }
  }, []);

  // Stop recording and switch to selfie mode
  const stopRecording = useCallback(() => {
    // Clear recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop video stream tracks
    if (backCameraStreamRef.current) {
      backCameraStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Switch to selfie mode
    setRecordingState(RecordingState.SELFIE_MODE);
    initializeFrontCamera();
  }, [initializeFrontCamera]);

  // Capture selfie from front camera
  const captureSelfie = useCallback(async () => {
    if (!selfieVideoRef.current || !frontCameraStreamRef.current) {
      setError('Cannot access selfie camera. Please try again.');
      return;
    }
    
    try {
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      canvas.width = selfieVideoRef.current.videoWidth;
      canvas.height = selfieVideoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      // Draw the current video frame to the canvas
      ctx.drawImage(selfieVideoRef.current, 0, 0);
      
      // Convert to Blob
      const selfieBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else throw new Error('Failed to create selfie image');
        }, 'image/jpeg', 0.9);
      });
      
      // Save selfie blob and generate preview URL
      setSelfieBlob(selfieBlob);
      const selfieUrl = URL.createObjectURL(selfieBlob);
      setSelfiePreviewUrl(selfieUrl);
      
      // Stop front camera stream
      frontCameraStreamRef.current.getTracks().forEach(track => track.stop());
      
      // Move to review state
      setRecordingState(RecordingState.REVIEW);
    } catch (err) {
      console.error('Error capturing selfie:', err);
      setError('Failed to capture selfie. Please try again.');
    }
  }, []);

  // Upload both video and selfie to IPFS
  const uploadMedia = useCallback(async (): Promise<MediaMetadata> => {
    if (!videoBlob || !selfieBlob || !user) {
      throw new Error('Missing media files or user data');
    }
    
    try {
      // Convert video blob to base64
      const videoBase64 = await blobToBase64(videoBlob);
      
      // Convert selfie blob to base64
      const selfieBase64 = await blobToBase64(selfieBlob);
      
      const fileName = `challenge_${user.id}_${Date.now()}`;
      
      // Upload to our API endpoint that handles Pinata IPFS upload
      const response = await fetch('/api/pinChallengeToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoFile: videoBase64,
          selfieFile: selfieBase64,
          fileName,
          userId: user.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload media');
      }
      
      const data = await response.json();
      return data.mediaMetadata;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }, [videoBlob, selfieBlob, user]);

  // Helper to convert Blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Submit challenge completion
  const submitChallenge = useCallback(async () => {
    if (!user || !videoBlob || !selfieBlob) {
      setError('Missing required data to complete challenge');
      return;
    }
    
    setRecordingState(RecordingState.UPLOADING);
    setIsLoading(true);
    setStatusMessage('Processing your challenge completion...');
    
    try {
      // 1. Upload to IPFS
      setStatusMessage('Uploading to decentralized storage...');
      const mediaMetadata = await uploadMedia();
      
      // 2. Get or create the challenge in Dgraph
      setStatusMessage('Processing challenge details...');
      const isAIChallenge = type === 'AI';
      
      const challengeId = await getOrCreateChallenge(
        title,
        description || `${title} challenge`,
        parseInt(reward),
        type,
        isAIChallenge ? frequency : null,
        visibility || 'public'
      );
      
      // 3. Create challenge completion record with the enhanced media metadata
      setStatusMessage('Recording your completion...');
      const completionId = await createChallengeCompletion(
        user.id,
        challengeId,
        mediaMetadata, // Pass the full metadata object
        isAIChallenge,
        visibility || 'public'
      );
      
      // 4. Update user tokens in Dgraph
      setStatusMessage('Updating your rewards...');
      const rewardAmount = parseInt(reward);
      await updateUserTokens(user.id, rewardAmount);
      
      // 5. Update user context with new token balance and completion record
      const newCompletedChallenge = {
        type: isAIChallenge ? `AI-${frequency}` : 'Social',
        title: title || 'Unknown Challenge',
        date: new Date().toISOString(),
        proofCID: mediaMetadata.directoryCID, // Use the directory CID
        hasVideo: true,
        hasSelfie: true
      };
      
      // Update user in context/local storage
      await updateUser({
        earnedTokens: (user.earnedTokens || 0) + rewardAmount,
        completedChallenges: [
          ...(user.completedChallenges || []),
          newCompletedChallenge
        ]
      });
      
      // 6. Show success and move to completion state
      setStatusMessage(`Challenge completed! You earned ${reward} NOCENIX`);
      setRecordingState(RecordingState.COMPLETE);
      
      // 7. Navigate back to home page after a delay
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
  }, [user, videoBlob, selfieBlob, uploadMedia, type, frequency, title, description, reward, visibility, router, updateUser]);

  // Retry handling
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

  // Render different UI based on recording state
  const renderContent = () => {
    switch (recordingState) {
      case RecordingState.IDLE:
        return (
          <div className="w-full flex flex-col items-center">
            <div className="bg-[#1A2734] rounded-xl p-6 w-full mb-6">
              <h3 className="text-center text-white text-lg mb-4">Ready to complete this challenge?</h3>
              <p className="text-center text-gray-400 mb-2">You'll need to:</p>
              <ol className="text-gray-300 list-decimal pl-8 mb-4">
                <li className="mb-2">Record a 30-second video showing your completion</li>
                <li>Take a quick selfie to verify it's you</li>
              </ol>
              <p className="text-center text-gray-400 mt-4">
                Make sure you're in a well-lit area and your camera is ready!
              </p>
            </div>
            
            <PrimaryButton
              text="Start Recording"
              onClick={startRecording}
              isActive={true}
            />
          </div>
        );
        
      case RecordingState.STARTING:
        return (
          <div className="w-full flex flex-col items-center relative">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-7xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
            </div>
            
            <p className="text-white text-center">
              Get ready! Recording will start in {countdown}...
            </p>
          </div>
        );
        
      case RecordingState.RECORDING:
        return (
          <div className="w-full flex flex-col items-center relative">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {/* Recording indicator */}
              <div className="absolute top-4 left-4 flex items-center bg-black bg-opacity-60 rounded-full px-3 py-1">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-white text-sm">{recordingTime}s</span>
              </div>
              
              {/* Guidance overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
                <p className="text-white text-center text-sm">
                  {description}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between w-full px-4 mt-2">
              <p className="text-gray-300">
                Recording: {recordingTime}/30s
              </p>
              
              <button 
                onClick={stopRecording}
                className="text-white bg-blue-500 px-4 py-1 rounded-full"
              >
                {recordingTime < 30 ? "Stop Early" : "Continue"}
              </button>
            </div>
          </div>
        );
        
      case RecordingState.SELFIE_MODE:
        return (
          <div className="w-full flex flex-col items-center relative">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
              <video 
                ref={selfieVideoRef}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {/* Guidance overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
                <p className="text-white text-center text-sm">
                  Now take a quick selfie to verify it's you!
                </p>
              </div>
            </div>
            
            <PrimaryButton
              text="Take Selfie"
              onClick={captureSelfie}
              isActive={true}
            />
          </div>
        );
        
      case RecordingState.REVIEW:
        return (
          <div className="w-full flex flex-col items-center relative">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
              {/* Video Preview */}
              {videoPreviewUrl && (
                <video
                  src={videoPreviewUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
              
              {/* Selfie Preview Overlay */}
              {selfiePreviewUrl && (
                <div className="absolute top-2 left-2 w-1/4 aspect-square bg-black rounded-md overflow-hidden border-2 border-white">
                  <img
                    src={selfiePreviewUrl}
                    alt="Selfie"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            
            <div className="w-full space-y-3 mt-4">
              <p className="text-center text-white">
                How does your challenge proof look?
              </p>
              
              <div className="flex justify-between gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-2 rounded-full bg-gray-700 text-white"
                >
                  Retry
                </button>
                
                <PrimaryButton
                  text="Submit Challenge"
                  onClick={submitChallenge}
                  isActive={true}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        );
        
      case RecordingState.UPLOADING:
        return (
          <div className="w-full flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-6"></div>
            <p className="text-center text-white text-xl mb-2">
              {statusMessage || "Processing your challenge..."}
            </p>
            <p className="text-center text-gray-400">
              This may take a moment. Please don't close the app.
            </p>
          </div>
        );
        
      case RecordingState.COMPLETE:
        return (
          <div className="w-full flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
              <span className="text-white text-2xl">✓</span>
            </div>
            <p className="text-center text-white text-xl mb-2">
              Challenge Completed!
            </p>
            <div className="flex items-center justify-center mb-6 py-2 px-6 rounded-full bg-[#2A3B4D]">
              <Image 
                src={nocenixIcon} 
                alt="Nocenix" 
                width={24} 
                height={24}
                className="mr-2"
              />
              <span className="font-bold text-white">{reward || "1"} NOCENIX</span>
            </div>
            <p className="text-center text-gray-300">
              Redirecting to home...
            </p>
          </div>
        );
        
      case RecordingState.ERROR:
        return (
          <div className="w-full flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
              <span className="text-white text-2xl">!</span>
            </div>
            <p className="text-center text-white text-xl mb-4">
              Something went wrong
            </p>
            <p className="text-center text-gray-400 mb-6">
              {error || "We encountered an error while processing your challenge."}
            </p>
            <PrimaryButton
              text="Try Again"
              onClick={handleRetry}
              isActive={true}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-start px-4 py-8 w-full max-w-md mx-auto overflow-y-auto pb-28">
      {/* Challenge Circle Image with AI Icon */}
      <ThematicImage className="rounded-full mb-6">
        <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
          <Image
            src="/ai.png"
            alt="Challenge"
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        </div>
      </ThematicImage>

      {/* Challenge Title */}
      <ThematicText text={title || ''} isActive={true} className="text-xl mb-4" />

      {/* Token Reward Display */}
      <div className="flex items-center justify-center mb-6 py-2 px-6 rounded-full bg-[#2A3B4D]">
        <Image 
          src={nocenixIcon} 
          alt="Nocenix" 
          width={24} 
          height={24}
          className="mr-2"
        />
        <span className="font-bold text-white">{reward || "1"} NOCENIX</span>
      </div>

      {/* Main Content Area - changes based on state */}
      {renderContent()}
    </div>
  );
};

export default CompletingView;