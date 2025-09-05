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
  const [permissionChecked, setPermissionChecked] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const actualDurationRef = useRef<number>(0);

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

  // Check camera permissions first - Android Chrome specific handling
  const checkCameraPermissions = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera not supported on this device.');
      return false;
    }

    try {
      // For Android Chrome, we need to explicitly request camera permission first
      // Sometimes Chrome only prompts for microphone if both are requested together
      console.log('Checking camera permissions...');

      // First, try to request just camera permission to force the prompt
      try {
        console.log('Requesting camera-only permission first...');
        const cameraOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: false,
        });
        console.log('Camera permission granted');
        cameraOnlyStream.getTracks().forEach((track) => track.stop());

        // Now request microphone separately
        console.log('Requesting microphone permission...');
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        console.log('Microphone permission granted');
        audioOnlyStream.getTracks().forEach((track) => track.stop());

        return true;
      } catch (cameraError: any) {
        console.log('Camera-first approach failed, trying combined request:', cameraError);

        // Fallback to combined request
        try {
          const combinedStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: true,
          });
          console.log('Combined permission request successful');
          combinedStream.getTracks().forEach((track) => track.stop());
          return true;
        } catch (combinedError: any) {
          console.error('Both permission approaches failed:', combinedError);

          if (combinedError.name === 'NotAllowedError') {
            setCameraError('Camera or microphone access denied. Please allow both camera and microphone access.');
          } else if (combinedError.name === 'NotFoundError') {
            setCameraError('Camera or microphone not found on this device.');
          } else {
            setCameraError('Unable to access camera and microphone. Please check your device settings.');
          }
          return false;
        }
      }
    } catch (error) {
      console.log('Permission check completely failed:', error);
      setCameraError('Failed to check camera permissions. Please try again.');
      return false;
    }
  }, [facingMode]);

  // Initialize camera with better Android compatibility
  const initializeCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraInitialized(false);

      console.log('Initializing camera...');

      // Clean up any existing stream
      cleanupCamera();

      // Check permissions first (this will properly request both camera and microphone)
      if (!permissionChecked) {
        const canProceed = await checkCameraPermissions();
        setPermissionChecked(true);
        if (!canProceed) {
          return;
        }
      }

      // Now that permissions are confirmed, request the actual stream
      // Use more compatible constraints for Android
      const baseConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      console.log('Requesting final stream with constraints:', baseConstraints);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(baseConstraints);
      } catch (error: any) {
        console.log('Detailed constraints failed, trying basic:', error);
        // Fallback to very basic constraints for problematic devices
        const fallbackConstraints = {
          video: { facingMode: facingMode },
          audio: true,
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      if (!stream || !stream.active) {
        throw new Error('Stream is not active');
      }

      streamRef.current = stream;
      console.log('Stream obtained:', stream.id, 'Active:', stream.active);

      if (videoRef.current) {
        const videoElement = videoRef.current;

        // Set all required attributes for cross-platform compatibility
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.autoplay = true;
        videoElement.controls = false;

        // Additional attributes for older browsers/devices
        videoElement.setAttribute('webkit-playsinline', 'true');
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('autoplay', 'true');
        videoElement.setAttribute('muted', 'true');

        console.log('Setting video srcObject...');
        videoElement.srcObject = stream;

        // Handle video loading and playing
        const handleCanPlay = async () => {
          try {
            console.log('Video can play, attempting to start...');
            await videoElement.play();
            setCameraInitialized(true);
            setupMediaRecorder(stream);
            console.log('Camera initialized successfully');
          } catch (playError) {
            console.error('Video play error:', playError);
            // On some devices, we need user interaction to play
            setCameraError('Tap the record button to start the camera');
          }
        };

        // Use canplay event for better compatibility
        videoElement.addEventListener('canplay', handleCanPlay, { once: true });

        // Fallback timeout
        setTimeout(() => {
          if (!cameraInitialized && videoElement.readyState >= 3) {
            console.log('Fallback: forcing video play attempt');
            handleCanPlay();
          }
        }, 1000);
      } else {
        throw new Error('Video element not available');
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera.';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera settings not supported on this device.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Camera access was interrupted.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Camera access blocked for security reasons.';
      }

      setCameraError(errorMessage);
    }
  }, [facingMode, cleanupCamera, checkCameraPermissions, permissionChecked]);

  // Setup MediaRecorder with better format support
  const setupMediaRecorder = useCallback(
    (stream: MediaStream) => {
      try {
        chunksRef.current = [];

        // Try different MIME types in order of preference for cross-platform compatibility
        const mimeTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=h264,opus',
          'video/webm',
          'video/mp4;codecs=h264,aac',
          'video/mp4',
        ];

        let selectedMimeType = '';
        for (const mimeType of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType;
            console.log('Selected MIME type:', mimeType);
            break;
          }
        }

        if (!selectedMimeType) {
          throw new Error('No supported video format found');
        }

        const options: MediaRecorderOptions = {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
          audioBitsPerSecond: 128000, // 128 kbps for audio
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
            type: selectedMimeType,
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
    initializeCamera();
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
    // If camera isn't initialized, try to start it with user interaction
    if (!cameraInitialized && videoRef.current && streamRef.current) {
      try {
        await videoRef.current.play();
        setCameraInitialized(true);
        setupMediaRecorder(streamRef.current);
        setTimeout(() => {
          setStage('countdown');
          setCountdown(3);
        }, 100);
      } catch (error) {
        console.error('Error starting camera from user gesture:', error);
        setCameraError('Unable to start camera. Please try again.');
      }
    } else if (!cameraInitialized || !mediaRecorderRef.current) {
      // Try to reinitialize camera
      initializeCamera();
      setTimeout(() => {
        if (cameraInitialized) {
          setStage('countdown');
          setCountdown(3);
        }
      }, 500);
    } else {
      setStage('countdown');
      setCountdown(3);
    }
  }, [cameraInitialized, setupMediaRecorder, initializeCamera]);

  const startRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      try {
        console.log('Starting recording...');
        setStage('recording');
        setRecordingTime(30);

        recordingStartTimeRef.current = Date.now();
        mediaRecorderRef.current.start(1000); // Record in 1-second chunks

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
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    } catch (error) {
      console.error('Error flipping camera:', error);
    }
  }, [stage]);

  const formatTime = (seconds: number) => {
    return `00:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRetry = useCallback(() => {
    setCameraError(null);
    setCameraInitialized(false);
    setPermissionChecked(false);
    initializeCamera();
  }, [initializeCamera]);

  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <div className="text-lg mb-4">{cameraError}</div>
          <div className="space-y-3">
            <button onClick={handleRetry} className="w-full bg-nocenaPink px-6 py-3 rounded-lg text-white font-medium">
              Try Again
            </button>
            <button onClick={onBack} className="w-full bg-gray-600 px-6 py-3 rounded-lg text-white font-medium">
              Go Back
            </button>
          </div>
          {cameraError.includes('permission') && (
            <div className="text-sm text-gray-400 mt-4">
              <p>If the problem persists:</p>
              <p>• Allow BOTH camera AND microphone access</p>
              <p>• Check browser permissions in settings</p>
              <p>• Try refreshing the page</p>
              <p>• Make sure no other apps are using the camera</p>
            </div>
          )}
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
            <div className="text-sm mt-2 opacity-75">This should only take a moment</div>
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
            disabled={!cameraInitialized}
            className={`relative w-20 h-20 rounded-full transition-all duration-300 ${
              cameraInitialized
                ? 'border-2 border-white shadow-lg hover:scale-105'
                : 'border-2 border-gray-600 opacity-50'
            }`}
            aria-label="Start recording"
          >
            <div
              className={`absolute inset-1 rounded-full transition-all duration-300 ${
                cameraInitialized ? 'bg-gradient-to-br from-nocenaPink to-nocenaPurple' : 'bg-gray-600'
              }`}
            />
            {cameraInitialized && <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />}
            {!cameraInitialized && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
        )}

        {stage === 'countdown' && (
          <div className="relative w-20 h-20 rounded-full border-2 border-white opacity-50">
            <div className="absolute inset-1 bg-gray-600 rounded-full" />
          </div>
        )}

        {stage === 'recording' && (
          <button
            onClick={stopRecording}
            className="relative w-20 h-20 rounded-full border-2 border-white transition-all duration-500 ease-in-out shadow-lg hover:scale-105"
            aria-label="Stop recording"
          >
            <div className="absolute inset-1 bg-gradient-to-br from-nocenaPink to-nocenaPurple rounded-full" />
            <div className="absolute inset-6 transition-all duration-500 ease-in-out rounded-sm bg-white" />
            <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
          </button>
        )}

        {stage === 'stopping' && (
          <div className="relative w-20 h-20 rounded-full border-2 border-white opacity-50">
            <div className="absolute inset-1 bg-gray-600 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
