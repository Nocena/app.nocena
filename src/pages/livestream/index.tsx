// src/pages/livestream/index.tsx - Complete FilCDN Livestream Implementation
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

type LivestreamStage = 'ready' | 'countdown' | 'streaming' | 'stopping' | 'uploading' | 'complete';

interface StreamStats {
  totalChunks: number;
  uploadedSegments: number;
  bufferSize: number;
  duration: number;
  dataTransferred: number;
  avgChunkSize: number;
  uploadProgress: number;
  currentBitrate: number;
}

const LivestreamPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [stage, setStage] = useState<LivestreamStage>('ready');
  const [countdown, setCountdown] = useState(3);
  const [streamingTime, setStreamingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [streamStats, setStreamStats] = useState<StreamStats>({
    totalChunks: 0,
    uploadedSegments: 0,
    bufferSize: 0,
    duration: 0,
    dataTransferred: 0,
    avgChunkSize: 0,
    uploadProgress: 0,
    currentBitrate: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const CHUNK_DURATION_MS = 100; // 0.1 seconds
  const BITRATE = 2500000; // 2.5 Mbps for good quality
  const STATUS_UPDATE_INTERVAL = 1000; // Update stats every second

  // Clean up function
  const cleanupCamera = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
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

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraInitialized(false);

      console.log('🎥 Initializing camera for FilCDN livestream...');
      cleanupCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        const videoElement = videoRef.current;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.autoplay = true;
        videoElement.srcObject = stream;

        const handleCanPlay = async () => {
          try {
            await videoElement.play();
            setCameraInitialized(true);
            console.log('✅ Camera initialized for FilCDN livestream');
          } catch (playError) {
            console.error('❌ Video play error:', playError);
            setCameraError('Tap the start button to begin');
          }
        };

        videoElement.addEventListener('canplay', handleCanPlay, { once: true });
      }
    } catch (error: any) {
      console.error('❌ Error accessing camera:', error);
      setCameraError('Unable to access camera. Please allow camera access.');
    }
  }, [facingMode, cleanupCamera]);

  // Initialize session
  const initializeSession = useCallback(async () => {
    const newSessionId = `live_${Date.now()}_${user?.id || 'anonymous'}`;
    setSessionId(newSessionId);

    try {
      const formData = new FormData();
      formData.append('action', 'start');
      formData.append('sessionId', newSessionId);
      formData.append('userId', user?.id || 'anonymous');

      const response = await fetch('/api/filcdn/livestream', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to start stream session');
      }

      console.log('🎬 FilCDN stream session initialized:', result);
      return newSessionId;
    } catch (error) {
      console.error('❌ Failed to initialize FilCDN stream session:', error);
      setCameraError('Failed to initialize FilCDN streaming session');
      return null;
    }
  }, [user?.id]);

  // Upload chunk to FilCDN
  const uploadChunk = useCallback(
    async (chunkBlob: Blob) => {
      if (!sessionId) {
        console.error('❌ No sessionId available for chunk upload');
        return;
      }

      console.log(`📦 Uploading chunk: ${chunkBlob.size} bytes for session ${sessionId}`);

      try {
        const formData = new FormData();
        formData.append('action', 'chunk');
        formData.append('sessionId', sessionId);
        formData.append('chunk', chunkBlob, `chunk_${Date.now()}.webm`);
        formData.append('timestamp', Date.now().toString());

        console.log(`🔄 Sending chunk to API...`);

        const response = await fetch('/api/filcdn/livestream', {
          method: 'POST',
          body: formData,
        });

        console.log(`📡 API Response status: ${response.status}`);

        const result = await response.json();

        if (result.success) {
          console.log(`✅ Chunk upload successful:`, {
            chunkIndex: result.chunkIndex,
            totalChunks: result.totalChunks,
            bufferSize: result.bufferSize,
            streamDuration: result.streamDuration,
          });

          setStreamStats((prev) => ({
            ...prev,
            totalChunks: result.totalChunks,
            bufferSize: result.bufferSize,
            dataTransferred: prev.dataTransferred + chunkBlob.size,
            avgChunkSize: (prev.avgChunkSize * (result.totalChunks - 1) + chunkBlob.size) / result.totalChunks,
          }));
        } else {
          console.error('❌ FilCDN chunk upload failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Failed to upload chunk to FilCDN:', error);
      }
    },
    [sessionId],
  );

  // Setup MediaRecorder for chunked recording
  const setupMediaRecorder = useCallback(() => {
    if (!streamRef.current) {
      console.error('❌ No stream available for MediaRecorder');
      return false;
    }

    try {
      // Check format support first
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.error(`❌ MIME type not supported: ${mimeType}`);
        // Try alternative formats
        const alternatives = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];

        for (const alt of alternatives) {
          if (MediaRecorder.isTypeSupported(alt)) {
            console.log(`✅ Using alternative format: ${alt}`);
            mimeType = alt;
            break;
          }
        }
      } else {
        console.log(`✅ MIME type supported: ${mimeType}`);
      }

      const options = {
        mimeType,
        videoBitsPerSecond: BITRATE,
        audioBitsPerSecond: 128000,
      };

      console.log(`🔧 Creating MediaRecorder with options:`, options);

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

      // Add all the event handlers with logging
      mediaRecorderRef.current.ondataavailable = async (event) => {
        console.log(`📹 MediaRecorder data available: ${event.data.size} bytes`);
        if (event.data && event.data.size > 0) {
          await uploadChunk(event.data);
        } else {
          console.warn('⚠️ Empty chunk received from MediaRecorder');
        }
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        setCameraError('Recording error occurred');
      };

      mediaRecorderRef.current.onstart = () => {
        console.log('✅ MediaRecorder started successfully');
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('🛑 MediaRecorder stopped');
      };

      return true;
    } catch (error) {
      console.error('❌ Failed to setup MediaRecorder:', error);
      setCameraError('Recording setup failed');
      return false;
    }
  }, [uploadChunk]);

  // Get stream status
  const updateStreamStatus = useCallback(async () => {
    if (!sessionId || stage !== 'streaming') return;

    try {
      const formData = new FormData();
      formData.append('action', 'status');
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/filcdn/livestream', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        const status = result.status;

        // FIXED: Better progress calculation
        const totalChunks = status.totalChunks || 0;
        const bufferSize = status.bufferSize || 0;
        const uploadedSegments = status.uploadedSegments || 0;

        // Calculate progress based on buffer fill percentage
        // Buffer fills from 0-49, then resets to 0 when segment uploads
        let uploadProgress = 0;

        if (totalChunks > 0) {
          // Progress within current buffer (0-98%)
          const bufferProgress = (bufferSize / 50) * 98;

          // Bonus progress for completed segments (2% per segment)
          const segmentBonus = uploadedSegments * 2;

          uploadProgress = Math.min(bufferProgress + segmentBonus, 100);

          // Special case: if buffer is full (50 chunks), show 100% briefly
          if (bufferSize === 0 && totalChunks >= 50) {
            uploadProgress = 100;
          }
        }

        console.log(
          `📊 Progress calculation: buffer=${bufferSize}/50 (${Math.round((bufferSize / 50) * 100)}%), segments=${uploadedSegments}, final=${Math.round(uploadProgress)}%`,
        );

        setStreamStats((prev) => ({
          ...prev,
          totalChunks,
          uploadedSegments,
          bufferSize,
          duration: status.duration,
          uploadProgress,
          currentBitrate:
            prev.dataTransferred > 0 && streamingTime > 0 ? (prev.dataTransferred * 8) / streamingTime : 0,
        }));
      }
    } catch (error) {
      console.error('❌ Failed to get FilCDN stream status:', error);
    }
  }, [sessionId, stage, streamingTime]);

  // Initialize camera and session on mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const init = async () => {
      await initializeCamera();
      await initializeSession();
    };

    init();
    return cleanupCamera;
  }, [isAuthenticated, router, initializeCamera, initializeSession, cleanupCamera]);

  // Countdown effect
  useEffect(() => {
    if (stage === 'countdown') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            startStreaming();
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stage]);

  // Status update effect
  useEffect(() => {
    if (stage === 'streaming') {
      statusTimerRef.current = setInterval(updateStreamStatus, STATUS_UPDATE_INTERVAL);
      return () => {
        if (statusTimerRef.current) {
          clearInterval(statusTimerRef.current);
          statusTimerRef.current = null;
        }
      };
    }
  }, [stage, updateStreamStatus]);

  const startCountdown = useCallback(() => {
    if (!cameraInitialized || !sessionId) {
      setCameraError('Camera or FilCDN session not ready. Please try again.');
      return;
    }
    setStage('countdown');
    setCountdown(3);
  }, [cameraInitialized, sessionId]);

  const startStreaming = useCallback(() => {
    console.log('🎬 Starting FilCDN livestream...');
    setStage('streaming');
    setStreamingTime(0);

    // Setup MediaRecorder
    if (!setupMediaRecorder()) {
      setCameraError('Failed to setup recording');
      return;
    }

    // Start recording with time slices
    if (mediaRecorderRef.current) {
      console.log(`📹 MediaRecorder state: ${mediaRecorderRef.current.state}`);
      console.log(`📹 MediaRecorder mimeType: ${mediaRecorderRef.current.mimeType}`);

      mediaRecorderRef.current.start(CHUNK_DURATION_MS);

      console.log(`📹 MediaRecorder started with ${CHUNK_DURATION_MS}ms chunks`);
      console.log(`📹 MediaRecorder state after start: ${mediaRecorderRef.current.state}`);
    } else {
      console.error('❌ MediaRecorder is null!');
    }

    // Start streaming timer
    timerRef.current = setInterval(() => {
      setStreamingTime((prev) => prev + 1);
    }, 1000);
  }, [setupMediaRecorder]);

  const stopStreaming = useCallback(async () => {
    console.log('🛑 Stopping FilCDN livestream...');
    setStage('stopping');

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStage('uploading');

    // End FilCDN stream session
    try {
      const formData = new FormData();
      formData.append('action', 'end');
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/filcdn/livestream', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('🏁 FilCDN stream ended:', result);

      if (result.success) {
        setStage('complete');
        // Show completion message
        setTimeout(() => {
          cleanupCamera();
          router.push('/profile');
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Failed to end FilCDN stream:', error);
      setTimeout(() => {
        cleanupCamera();
        router.push('/profile');
      }, 1000);
    }
  }, [sessionId, cleanupCamera, router]);

  const flipCamera = useCallback(() => {
    if (stage === 'streaming' || stage === 'countdown') return;
    setCameraInitialized(false);
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, [stage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleBack = () => {
    if (stage === 'streaming') {
      stopStreaming();
    } else {
      cleanupCamera();
      router.push('/profile');
    }
  };

  // Register custom back handler for AppLayout
  useEffect(() => {
    const handleCustomBack = (event: CustomEvent) => {
      event.preventDefault();
      handleBack();
    };

    window.addEventListener('nocena_custom_back', handleCustomBack as EventListener);

    window.dispatchEvent(
      new CustomEvent('nocena_register_custom_back', {
        detail: { hasCustomBack: true },
      }),
    );

    return () => {
      window.removeEventListener('nocena_custom_back', handleCustomBack as EventListener);
      window.dispatchEvent(
        new CustomEvent('nocena_register_custom_back', {
          detail: { hasCustomBack: false },
        }),
      );
    };
  }, [stage]);

  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <div className="text-lg mb-4">{cameraError}</div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-nocenaPink px-6 py-3 rounded-lg text-white font-medium"
            >
              Try Again
            </button>
            <button onClick={handleBack} className="w-full bg-gray-600 px-6 py-3 rounded-lg text-white font-medium">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      {/* Flip Camera Button */}
      {stage !== 'streaming' && stage !== 'countdown' && (
        <div className="absolute right-4 top-4 z-20">
          <button onClick={flipCamera} className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Live Indicator */}
      {stage === 'streaming' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-red-500 px-3 py-1 rounded-full flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white font-bold text-sm">LIVE to FilCDN</span>
          </div>
        </div>
      )}

      {/* Advanced Stream Stats */}
      {stage === 'streaming' && (
        <div className="absolute top-4 left-4 z-20 bg-black/70 rounded-lg p-3 text-xs space-y-1">
          <div className="font-bold text-sm mb-2">📊 FilCDN Stats</div>
          <div>📦 Chunks: {streamStats.totalChunks}</div>
          <div>📤 Segments: {streamStats.uploadedSegments}</div>
          <div>📊 Buffer: {streamStats.bufferSize}</div>
          <div>💾 Data: {formatBytes(streamStats.dataTransferred)}</div>
          {streamStats.avgChunkSize > 0 && <div>📏 Avg: {formatBytes(streamStats.avgChunkSize)}</div>}
          {streamStats.currentBitrate > 0 && <div>🔗 Rate: {Math.round(streamStats.currentBitrate / 1000)}kbps</div>}
        </div>
      )}

      {/* Upload Progress */}
      {stage === 'streaming' && (
        <div className="absolute top-4 right-4 z-20 bg-black/70 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="text-xs font-bold">🚀 FilCDN</div>
            <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  streamStats.uploadProgress >= 100
                    ? 'bg-green-500'
                    : streamStats.uploadProgress >= 80
                      ? 'bg-yellow-500'
                      : 'bg-gradient-to-r from-nocenaPink to-purple-500'
                }`}
                style={{ width: `${Math.min(streamStats.uploadProgress, 100)}%` }}
              />
            </div>
            <div className="text-xs font-mono">{Math.round(streamStats.uploadProgress)}%</div>
          </div>
          <div className="text-xs text-white/70 mt-1 text-center">
            {streamStats.bufferSize > 0
              ? `Buffering: ${streamStats.bufferSize}/50 chunks`
              : streamStats.uploadedSegments > 0
                ? `${streamStats.uploadedSegments} segments uploaded`
                : 'Real-time streaming active'}
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-white/50 mt-1 space-y-1">
              <div>Buffer: {streamStats.bufferSize}/50</div>
              <div>Segments: {streamStats.uploadedSegments}</div>
              <div>Total: {streamStats.totalChunks} chunks</div>
            </div>
          )}
        </div>
      )}

      {/* Countdown Overlay */}
      {stage === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
          <div className="text-center">
            <div className="text-8xl font-bold text-white mb-4 animate-pulse">{countdown}</div>
            <div className="text-xl text-white/90">Going live to FilCDN...</div>
            <div className="text-sm text-white/70 mt-2">Session: {sessionId.split('_')[1]}</div>
            <div className="text-xs text-white/50 mt-1">0.1s chunks • Real-time upload</div>
          </div>
        </div>
      )}

      {/* Processing Overlays */}
      {(stage === 'stopping' || stage === 'uploading') && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-xl text-white mb-2">
              {stage === 'stopping' ? 'Stopping Stream' : 'Finalizing FilCDN Upload'}
            </div>
            <div className="text-sm text-white/70 mb-4">
              {stage === 'stopping' ? 'Ending recording...' : 'Processing final segments for FilCDN...'}
            </div>
            {streamStats.totalChunks > 0 && (
              <div className="space-y-2 text-xs text-white/60">
                <div>Total chunks: {streamStats.totalChunks}</div>
                <div>Data processed: {formatBytes(streamStats.dataTransferred)}</div>
                <div>Duration: {formatTime(streamingTime)}</div>
                <div>Average bitrate: {Math.round(streamStats.currentBitrate / 1000)}kbps</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion Overlay */}
      {stage === 'complete' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-xl text-white mb-2">Stream Complete!</div>
            <div className="text-sm text-white/70 mb-4">Successfully uploaded to FilCDN</div>
            <div className="space-y-1 text-xs text-white/50">
              <div>Total chunks: {streamStats.totalChunks}</div>
              <div>Data uploaded: {formatBytes(streamStats.dataTransferred)}</div>
              <div>Stream duration: {formatTime(streamingTime)}</div>
            </div>
            <div className="text-xs text-white/40 mt-4">Redirecting to profile...</div>
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
        style={{ objectFit: 'cover' }}
      />

      {/* Initialization Loading */}
      {(!cameraInitialized || !sessionId) && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-lg">Initializing FilCDN Livestream...</div>
            <div className="text-sm text-white/70 mt-2">
              {!cameraInitialized && 'Setting up camera...'}
              {cameraInitialized && !sessionId && 'Creating FilCDN session...'}
            </div>
            <div className="text-xs text-white/50 mt-1">Preparing 100ms chunk streaming</div>
          </div>
        </div>
      )}

      {/* Streaming Timer and Bitrate */}
      {stage === 'streaming' && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black/50 px-4 py-2 rounded-full text-center">
            <span className="text-white text-xl font-bold">{formatTime(streamingTime)}</span>
            <div className="text-xs text-white/70 mt-1 flex items-center justify-center space-x-2">
              <span>{Math.round(streamStats.currentBitrate / 1000)}kbps</span>
              <span>•</span>
              <span>{streamStats.totalChunks} chunks</span>
            </div>
          </div>
        </div>
      )}

      {/* Control Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        {stage === 'ready' && (
          <button
            onClick={startCountdown}
            disabled={!cameraInitialized || !sessionId}
            className="w-20 h-20 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:opacity-50 flex items-center justify-center transition-all"
          >
            <span className="text-white font-bold text-sm">LIVE</span>
          </button>
        )}

        {stage === 'countdown' && (
          <div className="w-20 h-20 rounded-full border-4 border-white bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{countdown}</span>
          </div>
        )}

        {stage === 'streaming' && (
          <button
            onClick={stopStreaming}
            className="w-20 h-20 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 flex items-center justify-center group transition-all"
          >
            <div className="w-6 h-6 bg-white rounded-sm group-hover:scale-90 transition-transform"></div>
          </button>
        )}

        {(stage === 'stopping' || stage === 'uploading') && (
          <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-600 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {stage === 'complete' && (
          <div className="w-20 h-20 rounded-full border-4 border-white bg-green-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Session and Technical Info */}
      {sessionId && stage !== 'ready' && (
        <div className="absolute bottom-4 left-4 z-10 text-xs text-white/50 space-y-1">
          <div>Session: {sessionId.split('_')[1]}</div>
          {stage === 'streaming' && (
            <div className="text-green-400">● Live on FilCDN • {CHUNK_DURATION_MS}ms chunks</div>
          )}
        </div>
      )}

      {/* FilCDN Branding */}
      {stage === 'streaming' && (
        <div className="absolute bottom-4 right-4 z-10 text-xs text-white/60">
          <div className="bg-black/30 px-2 py-1 rounded">
            Powered by <span className="text-nocenaPink font-bold">FilCDN</span>
          </div>
        </div>
      )}

      {/* Share Stream URL */}
      {stage === 'streaming' && (
        <div className="absolute top-20 right-4 z-10">
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}/watch/${sessionId}`;
              if (navigator.share) {
                navigator.share({
                  title: 'Watch my live stream on FilCDN',
                  url: shareUrl,
                });
              } else {
                navigator.clipboard.writeText(shareUrl);
                alert('Stream URL copied to clipboard!');
              }
            }}
            className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm hover:bg-black/70"
          >
            📤 Share
          </button>
        </div>
      )}
    </div>
  );
};

export default LivestreamPage;
