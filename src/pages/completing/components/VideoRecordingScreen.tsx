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
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Setup media recorder - try MP4 first, fallback to WebM
      let mediaRecorder: MediaRecorder;

      if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/mp4;codecs=h264,aac',
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 128000,
        });
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8,opus',
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 128000,
        });
      } else {
        // Fallback to default
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Calculate actual recording duration
        const actualDuration = actualDurationRef.current;
        console.log('Recording stopped. Actual duration:', actualDuration);

        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || 'video/webm',
        });

        // Pass both the blob and the actual duration
        onVideoRecorded(blob, actualDuration);
      };
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions and try again.');
      onBack();
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
    setStage('countdown');
    setCountdown(3);
  };

  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      setStage('recording');
      setRecordingTime(30);

      // Record the start time
      recordingStartTimeRef.current = Date.now();
      mediaRecorderRef.current.start(1000);

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setStage('stopping');

      // Calculate actual duration
      const endTime = Date.now();
      const actualDuration = (endTime - recordingStartTimeRef.current) / 1000;
      actualDurationRef.current = actualDuration;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      mediaRecorderRef.current.stop();
      stopCamera();
    }
  };

  const flipCamera = async () => {
    if (stage === 'recording') return; // Don't flip during recording

    try {
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    } catch (error) {
      console.error('Error flipping camera:', error);
      // Silently fail on desktop or if flip not supported
    }
  };

  const formatTime = (seconds: number) => {
    return `00:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      {/* Flip Camera Button - Only show when not recording or countdown */}
      {stage !== 'recording' && stage !== 'countdown' && (
        <div className="absolute top-6 right-4 z-20">
          <button className="focus:outline-none pointer-events-auto" aria-label="Flip Camera" onClick={flipCamera}>
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
        <div className="absolute inset-0 flex items-center justify-center z-20">
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
        className={`absolute inset-0 w-full h-full object-cover ${
          facingMode === 'user' ? 'transform scale-x-[-1]' : ''
        }`}
      />

      {/* Timer (only show during recording) */}
      {stage === 'recording' && (
        <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 z-10">
          <span className="text-white text-2xl font-black">{formatTime(recordingTime)}</span>
        </div>
      )}

      {/* Recording Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        {stage === 'ready' && (
          <button
            onClick={startCountdown}
            className="relative w-20 h-20 rounded-full border-2 border-white transition-all duration-300"
          >
            <div
              className="absolute inset-1 rounded-full"
              style={{
                background: '#FF15C9',
              }}
            />
          </button>
        )}

        {stage === 'countdown' && (
          <div className="relative w-20 h-20 rounded-full border-2 border-white transition-all duration-300">
            <div className="absolute inset-1 bg-gray-600 rounded-full" />
          </div>
        )}

        {stage === 'recording' && (
          <button
            onClick={stopRecording}
            className="relative w-20 h-20 rounded-full border-2 border-white transition-all duration-500 ease-in-out"
          >
            <div
              className="absolute inset-4 transition-all duration-500 ease-in-out animate-circle-to-square"
              style={{
                background: '#FF15C9',
              }}
            />
          </button>
        )}

        {stage === 'stopping' && (
          <div className="relative w-20 h-20 rounded-full border-2 border-white">
            <div className="absolute inset-1 bg-gray-600 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoRecordingScreen;
