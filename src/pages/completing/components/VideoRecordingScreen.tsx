'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ThematicContainer from '../../../components/ui/ThematicContainer';

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

interface VideoRecordingScreenProps {
  challenge: Challenge;
  onVideoRecorded: (videoBlob: Blob, actualDuration: number) => void;
  onBack: () => void;
}

type RecordingStage = 'ready' | 'countdown' | 'recording' | 'stopping';

const VideoRecordingScreen: React.FC<VideoRecordingScreenProps> = ({ challenge, onVideoRecorded, onBack }) => {
  const [stage, setStage] = useState<RecordingStage>('ready');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(30);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const actualDurationRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);

  // Clean up function
  const cleanupCamera = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // iOS-specific video play function with user gesture requirement
  const playVideoWithUserGesture = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      // For iOS, we need to ensure this is called from a user gesture
      console.log('Attempting to play video with user gesture...');
      await videoElement.play();
      console.log('Video play successful');
      return true;
    } catch (error) {
      console.error('Video play failed:', error);
      return false;
    }
  }, []);

  // Initialize camera with iOS-specific handling
  const initializeCamera = useCallback(
    async (userTriggered = false) => {
      try {
        setCameraError(null);
        setCameraInitialized(false);
        retryCountRef.current += 1;

        console.log(`Initializing camera (attempt ${retryCountRef.current}, user triggered: ${userTriggered})`);

        // Detect if we're in PWA mode
        const isPWA =
          (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
        console.log('PWA mode detected:', isPWA);

        // Clean up any existing stream
        cleanupCamera();

        // Use basic constraints for better iOS compatibility
        const constraints = {
          video: {
            facingMode: facingMode,
            // In PWA mode, be even more conservative with constraints
            ...(isPWA && {
              width: { max: 1280 },
              height: { max: 720 },
              frameRate: { max: 30 },
            }),
          },
          audio: true,
        };

        console.log('Requesting camera with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!stream || !stream.active) {
          throw new Error('Stream is not active');
        }

        streamRef.current = stream;
        console.log('Stream obtained:', stream.id, 'Active:', stream.active);

        if (videoRef.current) {
          const videoElement = videoRef.current;

          // Critical: Set all required attributes BEFORE setting srcObject
          videoElement.muted = true;
          videoElement.playsInline = true;
          videoElement.autoplay = true;
          videoElement.controls = false;

          // Set webkit-specific attributes for older iOS versions
          videoElement.setAttribute('webkit-playsinline', 'true');
          videoElement.setAttribute('playsinline', 'true');

          console.log('Setting video srcObject...');
          videoElement.srcObject = stream;

          // For iOS, we often need to handle video playing manually
          const handleVideoPlay = async () => {
            try {
              console.log('Video metadata loaded, attempting play...');
              console.log('Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
              console.log('Video readyState:', videoElement.readyState);
              console.log('PWA mode:', isPWA);

              // In PWA mode, we ALWAYS need user interaction
              if (isPWA && !userTriggered && !isUserInteracting) {
                console.log('PWA mode requires user interaction, waiting...');
                setCameraError('Tap the record button to start camera');
                return;
              }

              // On iOS, video.play() often needs to be called from a user gesture
              if (userTriggered || isUserInteracting) {
                const playSuccess = await playVideoWithUserGesture(videoElement);
                if (playSuccess) {
                  setCameraInitialized(true);
                  setupMediaRecorder(stream);
                  console.log('Camera initialized successfully');
                } else {
                  throw new Error('Failed to play video');
                }
              } else {
                // Try automatic play, but don't fail if it doesn't work
                try {
                  await videoElement.play();
                  setCameraInitialized(true);
                  setupMediaRecorder(stream);
                  console.log('Camera initialized successfully (auto-play)');
                } catch (autoPlayError) {
                  console.log('Auto-play failed, waiting for user interaction:', autoPlayError);
                  // Don't throw error here, just wait for user interaction
                  setCameraError('Tap the record button to start camera');
                }
              }
            } catch (error) {
              console.error('Error in handleVideoPlay:', error);
              throw error;
            }
          };

          // Set up event listeners
          videoElement.addEventListener('loadedmetadata', handleVideoPlay, { once: true });

          // Fallback: force load and try immediate play if metadata is already loaded
          if (videoElement.readyState >= 1) {
            console.log('Video already has metadata, starting immediately');
            setTimeout(handleVideoPlay, 100);
          }

          // iOS fallback: try to force load
          try {
            videoElement.load();
          } catch (loadError) {
            console.log('Video load() not needed or failed:', loadError);
          }
        } else {
          throw new Error('Video element not available');
        }
      } catch (error: any) {
        console.error('Error accessing camera:', error);
        let errorMessage = 'Unable to access camera.';

        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and refresh.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera settings not supported.';
        } else if (error.message.includes('user gesture')) {
          errorMessage = 'Tap the record button to start camera';
        }

        setCameraError(errorMessage);

        // Retry with more basic constraints if this was the first attempt
        if (retryCountRef.current === 1 && error.name === 'OverconstrainedError') {
          console.log('Retrying with basic constraints...');
          setTimeout(() => {
            const basicConstraints = {
              video: true,
              audio: true,
            };
            navigator.mediaDevices
              .getUserMedia(basicConstraints)
              .then((stream) => {
                streamRef.current = stream;
                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  setCameraError('Tap the record button to start camera');
                }
              })
              .catch((retryError) => {
                console.error('Basic constraints also failed:', retryError);
                setCameraError('Camera initialization failed completely.');
              });
          }, 500);
        }
      }
    },
    [facingMode, cleanupCamera, playVideoWithUserGesture, isUserInteracting],
  );

  // Setup MediaRecorder with iOS-compatible settings
  const setupMediaRecorder = useCallback(
    (stream: MediaStream) => {
      try {
        chunksRef.current = [];

        // Use MP4 for better iOS compatibility
        let mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
          mimeType = 'video/webm;codecs=h264';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        }

        console.log('Using MIME type:', mimeType);

        const options: MediaRecorderOptions = {
          mimeType: mimeType,
        };

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          console.log('Data available:', event.data.size, 'bytes');
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped, chunks:', chunksRef.current.length);
          const actualDuration = actualDurationRef.current;

          if (chunksRef.current.length === 0) {
            setCameraError('Recording failed. Please try again.');
            return;
          }

          const blob = new Blob(chunksRef.current, {
            type: mimeType,
          });

          console.log('Created blob:', blob.size, 'bytes, type:', blob.type);
          onVideoRecorded(blob, actualDuration);
        };

        mediaRecorder.onerror = (event: any) => {
          console.error('MediaRecorder error:', event.error);
          setCameraError('Recording error occurred. Please try again.');
        };

        console.log('MediaRecorder setup complete');
      } catch (error) {
        console.error('Error setting up MediaRecorder:', error);
        setCameraError('Failed to setup video recording.');
      }
    },
    [onVideoRecorded],
  );

  // Initialize camera on component mount
  useEffect(() => {
    initializeCamera(false);
    return cleanupCamera;
  }, [facingMode, initializeCamera, cleanupCamera]);

  // Countdown effect
  useEffect(() => {
    if (stage === 'countdown') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            startRecording();
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stage]);

  const startCountdown = useCallback(async () => {
    setIsUserInteracting(true);

    // If camera isn't initialized, try to initialize it with user gesture
    if (!cameraInitialized && videoRef.current && streamRef.current) {
      try {
        const success = await playVideoWithUserGesture(videoRef.current);
        if (success) {
          setCameraInitialized(true);
          if (mediaRecorderRef.current) {
            setStage('countdown');
            setCountdown(3);
          } else {
            setupMediaRecorder(streamRef.current);
            setTimeout(() => {
              setStage('countdown');
              setCountdown(3);
            }, 500);
          }
        } else {
          setCameraError('Unable to start camera. Please try again.');
        }
      } catch (error) {
        console.error('Error starting camera from user gesture:', error);
        setCameraError('Unable to start camera. Please try again.');
      }
    } else if (!cameraInitialized || !mediaRecorderRef.current) {
      // Try to reinitialize camera with user gesture
      initializeCamera(true);
    } else {
      setStage('countdown');
      setCountdown(3);
    }
  }, [cameraInitialized, playVideoWithUserGesture, setupMediaRecorder, initializeCamera]);

  const startRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      try {
        console.log('Starting recording...');
        setStage('recording');
        setRecordingTime(30);

        recordingStartTimeRef.current = Date.now();
        mediaRecorderRef.current.start(1000);

        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => {
            if (prev <= 1) {
              stopRecording();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        console.error('Error starting recording:', error);
        setCameraError('Failed to start recording.');
        setStage('ready');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping recording...');
      setStage('stopping');

      const endTime = Date.now();
      const actualDuration = (endTime - recordingStartTimeRef.current) / 1000;
      actualDurationRef.current = actualDuration;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }

      // Don't cleanup camera immediately, wait for the blob
      setTimeout(cleanupCamera, 1000);
    }
  }, [cleanupCamera]);

  const flipCamera = useCallback(async () => {
    if (stage === 'recording' || stage === 'countdown') return;

    try {
      setCameraInitialized(false);
      retryCountRef.current = 0;
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    } catch (error) {
      console.error('Error flipping camera:', error);
    }
  }, [stage]);

  const formatTime = (seconds: number) => {
    return `00:${seconds.toString().padStart(2, '0')}`;
  };

  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <div className="text-lg mb-4">{cameraError}</div>
          <button
            onClick={() => {
              setCameraError(null);
              setCameraInitialized(false);
              retryCountRef.current = 0;
              setIsUserInteracting(true);
              initializeCamera(true);
            }}
            className="bg-nocenaPink px-6 py-3 rounded-lg text-white font-medium"
          >
            Try Again
          </button>
          <button onClick={onBack} className="ml-4 bg-gray-600 px-6 py-3 rounded-lg text-white font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      {/* Safe area top padding */}
      <div
        className="absolute top-0 left-0 right-0 z-20"
        style={{
          height: 'env(safe-area-inset-top)',
          background: 'rgba(0,0,0,0.3)',
        }}
      />

      {/* Flip Camera Button */}
      {stage !== 'recording' && stage !== 'countdown' && (
        <div
          className="absolute right-4 z-20"
          style={{
            top: 'calc(env(safe-area-inset-top) + 16px)',
          }}
        >
          <button className="focus:outline-none" aria-label="Flip Camera" onClick={flipCamera}>
            <ThematicContainer
              color="nocenaBlue"
              glassmorphic={true}
              asButton={false}
              rounded="full"
              className="w-12 h-12 flex items-center justify-center"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </ThematicContainer>
          </button>
        </div>
      )}

      {/* Back Button */}
      <div
        className="absolute left-4 z-20"
        style={{
          top: 'calc(env(safe-area-inset-top) + 16px)',
        }}
      >
        <button className="focus:outline-none" aria-label="Go Back" onClick={onBack}>
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
      </div>

      {/* Countdown Overlay */}
      {stage === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
          <div className="text-center">
            <div className="text-8xl font-bold text-white mb-4 animate-pulse drop-shadow-lg">{countdown}</div>
            <div className="text-xl text-white/90">Get ready...</div>
          </div>
        </div>
      )}

      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        controls={false}
        preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover ${
          facingMode === 'user' ? 'transform scale-x-[-1]' : ''
        }`}
        style={{
          objectFit: 'cover',
          width: '100vw',
          height: '100vh',
          background: '#000',
          zIndex: 1,
        }}
        onError={(e) => {
          console.error('Video element error:', e);
          setCameraError('Video display error. Please try again.');
        }}
      />

      {/* Camera Status Indicator */}
      {!cameraInitialized && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-lg">Initializing camera...</div>
            <div className="text-sm mt-2 opacity-75">Tap record button if camera doesn't start</div>
          </div>
        </div>
      )}

      {/* Timer (only show during recording) */}
      {stage === 'recording' && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 z-10"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 140px)',
          }}
        >
          <div className="bg-black/50 px-4 py-2 rounded-full">
            <span className="text-white text-2xl font-black">{formatTime(recordingTime)}</span>
          </div>
        </div>
      )}

      {/* Recording Button */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 z-10"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 40px)',
        }}
      >
        {stage === 'ready' && (
          <button
            onClick={startCountdown}
            className="relative w-20 h-20 rounded-full border-4 border-white transition-all duration-300 bg-black/20 backdrop-blur-sm"
          >
            <div
              className="absolute inset-2 rounded-full transition-opacity"
              style={{
                background: cameraInitialized ? '#FF15C9' : '#666',
                opacity: cameraInitialized ? 1 : 0.7,
              }}
            />
            {!cameraInitialized && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
        )}

        {stage === 'countdown' && (
          <div className="relative w-20 h-20 rounded-full border-4 border-white transition-all duration-300 bg-black/20 backdrop-blur-sm">
            <div className="absolute inset-2 bg-gray-600 rounded-full" />
          </div>
        )}

        {stage === 'recording' && (
          <button
            onClick={stopRecording}
            className="relative w-20 h-20 rounded-full border-4 border-white transition-all duration-500 ease-in-out bg-black/20 backdrop-blur-sm"
          >
            <div
              className="absolute inset-6 transition-all duration-500 ease-in-out rounded-sm"
              style={{
                background: '#FF15C9',
              }}
            />
          </button>
        )}

        {stage === 'stopping' && (
          <div className="relative w-20 h-20 rounded-full border-4 border-white bg-black/20 backdrop-blur-sm">
            <div className="absolute inset-2 bg-gray-600 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Safe area bottom padding */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20"
        style={{
          height: 'env(safe-area-inset-bottom)',
          background: 'rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
};

export default VideoRecordingScreen;
