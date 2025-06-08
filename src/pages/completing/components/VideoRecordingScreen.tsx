'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const actualDurationRef = useRef<number>(0);

  // Initialize camera on component mount
  useEffect(() => {
    initializeCamera();
    return () => stopCamera();
  }, [facingMode]);

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

  const initializeCamera = async () => {
    try {
      setCameraError(null);

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Request both video and audio together
      const constraints = {
        video: {
          facingMode: facingMode,
        },
        audio: true, // Request audio from the start
      };

      console.log('Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        const videoElement = videoRef.current;

        // Clear any existing srcObject
        videoElement.srcObject = null;

        // Set new stream
        videoElement.srcObject = stream;

        // On iOS, we need to wait for user interaction
        const startVideo = async () => {
          try {
            videoElement.muted = true;
            videoElement.autoplay = true;
            videoElement.playsInline = true;

            await videoElement.play();
            setCameraInitialized(true);

            setTimeout(() => {
              setupMediaRecorder(stream);
            }, 500);
          } catch (error) {
            console.error('Error starting video:', error);
            setCameraError('Unable to start camera. Please ensure camera permissions are granted.');
          }
        };

        // Wait for metadata and then start
        videoElement.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
          startVideo();
        };

        // Fallback attempts
        videoElement.oncanplay = () => {
          console.log('Video can play');
          if (videoElement.paused && !cameraInitialized) {
            startVideo();
          }
        };
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
      }

      setCameraError(errorMessage);
    }
  };

  const setupMediaRecorder = (stream: MediaStream) => {
    try {
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualDuration = actualDurationRef.current;

        if (chunksRef.current.length === 0) {
          setCameraError('Recording failed. Please try again.');
          return;
        }

        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || 'video/webm',
        });

        onVideoRecorded(blob, actualDuration);
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        setCameraError('Recording error occurred. Please try again.');
      };
    } catch (error) {
      console.error('Error setting up MediaRecorder:', error);
      setCameraError('Failed to setup video recording.');
    }
  };

  const stopCamera = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCountdown = () => {
    if (!cameraInitialized || !mediaRecorderRef.current) {
      setCameraError('Camera not ready. Please wait and try again.');
      return;
    }
    setStage('countdown');
    setCountdown(3);
  };

  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      try {
        setStage('recording');
        setRecordingTime(30);

        recordingStartTimeRef.current = Date.now();
        mediaRecorderRef.current.start(1000); // Collect data every second

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
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
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

      stopCamera();
    }
  };

  const flipCamera = async () => {
    if (stage === 'recording' || stage === 'countdown') return;

    try {
      setCameraInitialized(false);
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    } catch (error) {
      console.error('Error flipping camera:', error);
    }
  };

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
              initializeCamera();
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
        style={
          {
            objectFit: 'cover',
            width: '100vw',
            height: '100vh',
            background: '#000',
            zIndex: 1,
            WebkitPlaysinline: true, // This is the correct way for React
          } as React.CSSProperties
        }
        onError={(e) => {
          console.error('Video element error:', e);
          setCameraError('Video display error. Please try again.');
        }}
        onLoadedData={() => {
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(console.error);
          }
        }}
        onCanPlay={() => {
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(console.error);
          }
        }}
      />

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
            disabled={!cameraInitialized}
          >
            <div
              className={`absolute inset-2 rounded-full transition-opacity ${
                cameraInitialized ? 'opacity-100' : 'opacity-50'
              }`}
              style={{
                background: cameraInitialized ? '#FF15C9' : '#666',
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
