// src/hooks/useLivestream.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LivestreamManager,
  StreamSession,
  StreamManifest,
  LivestreamConfig,
  DEFAULT_LIVESTREAM_CONFIG,
  livestreamUtils,
} from '../lib/livestream/livestreamUtils';

export type LivestreamStage =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'countdown'
  | 'streaming'
  | 'stopping'
  | 'uploading'
  | 'complete'
  | 'error';

export interface LivestreamState {
  stage: LivestreamStage;
  session: StreamSession | null;
  isInitialized: boolean;
  error: string | null;
  countdown: number;
  stats: {
    duration: number;
    totalChunks: number;
    uploadedChunks: number;
    failedChunks: number;
    queuedChunks: number;
    uploadedSegments: number;
    totalSize: number;
    averageChunkSize: number;
    uploadProgress: number;
    currentBitrate: number;
  };
}

export interface LivestreamActions {
  initialize: (userId: string, config?: Partial<LivestreamConfig>) => Promise<void>;
  startCountdown: () => void;
  startStreaming: () => Promise<void>;
  stopStreaming: () => Promise<StreamManifest | null>;
  addChunk: (chunkBlob: Blob) => Promise<void>;
  reset: () => void;
}

export interface UseLivestreamOptions {
  autoUpdateStats?: boolean;
  statsUpdateInterval?: number;
  countdownDuration?: number;
}

export function useLivestream(options: UseLivestreamOptions = {}): [LivestreamState, LivestreamActions] {
  const { autoUpdateStats = true, statsUpdateInterval = 1000, countdownDuration = 3 } = options;

  const [state, setState] = useState<LivestreamState>({
    stage: 'idle',
    session: null,
    isInitialized: false,
    error: null,
    countdown: countdownDuration,
    stats: {
      duration: 0,
      totalChunks: 0,
      uploadedChunks: 0,
      failedChunks: 0,
      queuedChunks: 0,
      uploadedSegments: 0,
      totalSize: 0,
      averageChunkSize: 0,
      uploadProgress: 0,
      currentBitrate: 0,
    },
  });

  const managerRef = useRef<LivestreamManager>(LivestreamManager.getInstance());
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update stats periodically
  const updateStats = useCallback(() => {
    if (!state.session) return;

    const status = managerRef.current.getSessionStatus(state.session.sessionId);
    if (status) {
      const bitrate = livestreamUtils.calculateBitrate(state.session.manifest.chunks);

      setState((prev) => ({
        ...prev,
        stats: {
          duration: status.duration,
          totalChunks: status.totalChunks,
          uploadedChunks: status.uploadedChunks,
          failedChunks: status.failedChunks,
          queuedChunks: status.queuedChunks,
          uploadedSegments: status.uploadedSegments,
          totalSize: status.totalSize,
          averageChunkSize: status.averageChunkSize,
          uploadProgress: status.uploadProgress,
          currentBitrate: bitrate,
        },
      }));
    }
  }, [state.session]);

  // Start stats timer when streaming
  useEffect(() => {
    if (state.stage === 'streaming' && autoUpdateStats) {
      statsTimerRef.current = setInterval(updateStats, statsUpdateInterval);
      return () => {
        if (statsTimerRef.current) {
          clearInterval(statsTimerRef.current);
          statsTimerRef.current = null;
        }
      };
    }
  }, [state.stage, autoUpdateStats, statsUpdateInterval, updateStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current);
      }
    };
  }, []);

  const actions: LivestreamActions = {
    initialize: async (userId: string, config?: Partial<LivestreamConfig>) => {
      try {
        setState((prev) => ({ ...prev, stage: 'initializing', error: null }));

        const session = await managerRef.current.initializeSession(userId, config);

        setState((prev) => ({
          ...prev,
          stage: 'ready',
          session,
          isInitialized: true,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize session';
        setState((prev) => ({
          ...prev,
          stage: 'error',
          error: errorMessage,
        }));
      }
    },

    startCountdown: () => {
      if (state.stage !== 'ready') {
        console.warn('Cannot start countdown: not in ready state');
        return;
      }

      setState((prev) => ({ ...prev, stage: 'countdown', countdown: countdownDuration }));

      let currentCount = countdownDuration;
      countdownTimerRef.current = setInterval(() => {
        currentCount -= 1;

        if (currentCount <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          // Auto-start streaming after countdown
          actions.startStreaming();
        } else {
          setState((prev) => ({ ...prev, countdown: currentCount }));
        }
      }, 1000);
    },

    startStreaming: async () => {
      try {
        if (!state.session) {
          throw new Error('No session initialized');
        }

        setState((prev) => ({ ...prev, stage: 'streaming', error: null }));

        // Session is already live from initialization
        console.log(`🎬 Started streaming session: ${state.session.sessionId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start streaming';
        setState((prev) => ({
          ...prev,
          stage: 'error',
          error: errorMessage,
        }));
      }
    },

    stopStreaming: async () => {
      try {
        if (!state.session) {
          console.warn('No session to stop');
          return null;
        }

        setState((prev) => ({ ...prev, stage: 'stopping' }));

        // Update stats one final time
        updateStats();

        setState((prev) => ({ ...prev, stage: 'uploading' }));

        const manifest = await managerRef.current.endSession(state.session.sessionId);

        setState((prev) => ({
          ...prev,
          stage: 'complete',
          session: null,
        }));

        return manifest;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to stop streaming';
        setState((prev) => ({
          ...prev,
          stage: 'error',
          error: errorMessage,
        }));
        return null;
      }
    },

    addChunk: async (chunkBlob: Blob) => {
      try {
        if (!state.session || state.stage !== 'streaming') {
          console.warn('Cannot add chunk: not in streaming state');
          return;
        }

        await managerRef.current.addChunk(state.session.sessionId, chunkBlob);

        // Stats will be updated by the timer, but we can trigger immediate update
        updateStats();
      } catch (error) {
        console.error('Failed to add chunk:', error);
        // Don't change stage for chunk errors, just log them
      }
    },

    reset: () => {
      // Clean up timers
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current);
        statsTimerRef.current = null;
      }

      // Reset state
      setState({
        stage: 'idle',
        session: null,
        isInitialized: false,
        error: null,
        countdown: countdownDuration,
        stats: {
          duration: 0,
          totalChunks: 0,
          uploadedChunks: 0,
          failedChunks: 0,
          queuedChunks: 0,
          uploadedSegments: 0,
          totalSize: 0,
          averageChunkSize: 0,
          uploadProgress: 0,
          currentBitrate: 0,
        },
      });
    },
  };

  return [state, actions];
}

// Additional utility hooks

/**
 * Hook for managing camera and MediaRecorder for livestreaming
 */
export function useCamera(facingMode: 'user' | 'environment' = 'environment') {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      setIsInitialized(false);

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
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

      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        await videoRef.current.play();
        setIsInitialized(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      console.error('Camera initialization error:', err);
    }
  }, [facingMode, stream]);

  const setupRecorder = useCallback(
    (config: LivestreamConfig) => {
      if (!stream) {
        throw new Error('No stream available');
      }

      const options = livestreamUtils.getOptimalRecorderOptions(config);
      const recorder = new MediaRecorder(stream, options);

      setMediaRecorder(recorder);
      return recorder;
    },
    [stream],
  );

  const cleanup = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setMediaRecorder(null);
    setIsInitialized(false);
    setError(null);
  }, [stream, mediaRecorder]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    stream,
    mediaRecorder,
    videoRef,
    isInitialized,
    error,
    initializeCamera,
    setupRecorder,
    cleanup,
  };
}

/**
 * Hook for MediaRecorder integration with livestream
 */
export function useMediaRecorder(stream: MediaStream | null, config: LivestreamConfig, onChunk: (chunk: Blob) => void) {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(() => {
    if (!stream) {
      setError('No stream available');
      return;
    }

    try {
      const options = livestreamUtils.getOptimalRecorderOptions(config);
      const newRecorder = new MediaRecorder(stream, options);

      newRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          onChunk(event.data);
        }
      };

      newRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
      };

      newRecorder.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      newRecorder.onstop = () => {
        setIsRecording(false);
        if (chunkTimerRef.current) {
          clearInterval(chunkTimerRef.current);
          chunkTimerRef.current = null;
        }
      };

      setRecorder(newRecorder);

      // Start recording with time slices
      newRecorder.start(config.chunkDurationMs);

      console.log(`📹 Started recording with ${config.chunkDurationMs}ms chunks`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Recording start error:', err);
    }
  }, [stream, config, onChunk]);

  const stopRecording = useCallback(() => {
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
  }, [recorder]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    recorder,
    isRecording,
    error,
    startRecording,
    stopRecording,
  };
}
