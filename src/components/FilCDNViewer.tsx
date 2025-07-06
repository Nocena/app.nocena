// src/components/FilCDNViewer.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface FilCDNViewerProps {
  sessionId: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}

// HLS.js type definitions
declare global {
  interface Window {
    Hls: any;
  }
}

interface HlsErrorData {
  type: string;
  details: string;
  fatal: boolean;
}

const FilCDNViewer: React.FC<FilCDNViewerProps> = ({ sessionId, autoplay = true, controls = true, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [hlsLoaded, setHlsLoaded] = useState(false);
  const mountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 [FilCDNViewer] Cleaning up HLS instance');
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        console.warn('⚠️ [FilCDNViewer] Error destroying HLS:', e);
      }
      hlsRef.current = null;
    }
  }, []);

  // Load HLS.js library
  const loadHLS = useCallback(async () => {
    if (hlsLoaded || !mountedRef.current) return true;

    try {
      console.log('📦 [FilCDNViewer] Loading HLS.js...');

      // Check if already loaded
      if (window.Hls) {
        setHlsLoaded(true);
        return true;
      }

      // Load HLS.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js';

      return new Promise<boolean>((resolve, reject) => {
        script.onload = () => {
          console.log('✅ [FilCDNViewer] HLS.js loaded successfully');
          setHlsLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('❌ [FilCDNViewer] Failed to load HLS.js');
          reject(new Error('Failed to load HLS.js'));
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('❌ [FilCDNViewer] HLS.js loading error:', error);
      return false;
    }
  }, [hlsLoaded]);

  // Check stream status
  const checkStreamStatus = useCallback(async () => {
    try {
      console.log('🔍 [FilCDNViewer] Checking stream status...');
      const response = await fetch('/api/filcdn/livestream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', sessionId }),
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 [FilCDNViewer] Stream status:', data);

      setStreamInfo(data);
      return data;
    } catch (error) {
      console.error('❌ [FilCDNViewer] Status check error:', error);
      throw error;
    }
  }, [sessionId]);

  // Load stream
  const loadStream = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      console.log(`🎬 [FilCDNViewer] Starting stream load for session: ${sessionId}`);
      setError(null);
      setIsLoading(true);

      // Check if video element exists
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Check stream status first
      const streamData = await checkStreamStatus();

      if (!streamData.success) {
        throw new Error('Stream not found');
      }

      const totalChunks = streamData.status?.totalChunks || streamData.totalChunks || 0;
      const uploadedSegments = streamData.status?.uploadedSegments || streamData.uploadedSegments || 0;

      console.log(`✅ [FilCDNViewer] Stream has ${totalChunks} chunks and ${uploadedSegments} segments`);

      // Need at least 50 chunks for first segment
      if (totalChunks < 50) {
        throw new Error(`Stream not ready - only ${totalChunks} chunks available (need 50+)`);
      }

      // Load HLS.js if needed
      const hlsLoadSuccess = await loadHLS();
      if (!hlsLoadSuccess) {
        throw new Error('Failed to load HLS.js library');
      }

      // Check browser support
      if (!window.Hls) {
        throw new Error('HLS.js not available');
      }

      if (!window.Hls.isSupported()) {
        throw new Error('HLS.js not supported in this browser');
      }

      console.log('🎥 [FilCDNViewer] Using HLS.js for playback');

      // Clean up existing HLS instance
      cleanup();

      // Create new HLS instance
      const hls = new window.Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;

      // Set up HLS event listeners
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ [FilCDNViewer] HLS.js manifest parsed');
        if (autoplay && videoRef.current) {
          videoRef.current.play().catch((e: any) => {
            console.warn('⚠️ [FilCDNViewer] Autoplay failed:', e);
          });
        }
      });

      hls.on(window.Hls.Events.ERROR, (_event: any, data: HlsErrorData) => {
        console.error('❌ [FilCDNViewer] HLS.js error:', data);

        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 [FilCDNViewer] Network error, attempting recovery...');
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 [FilCDNViewer] Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
            default:
              console.error('💥 [FilCDNViewer] Fatal error, cannot recover');
              setError(`HLS.js error: ${data.details}`);
              break;
          }
        }
      });

      // Load manifest
      const manifestUrl = `/api/filcdn/livestream?sessionId=${sessionId}`;
      console.log(`📄 [FilCDNViewer] Loading manifest: ${manifestUrl}`);

      hls.loadSource(manifestUrl);
      hls.attachMedia(videoRef.current);

      setIsLoading(false);
      setRetryCount(0);
    } catch (error: any) {
      console.error('❌ [FilCDNViewer] Stream loading error:', error);
      setError(error.message);
      setIsLoading(false);

      // Retry logic
      if (retryCount < 3 && mountedRef.current) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`🔄 [FilCDNViewer] Retrying in ${delay}ms... (${retryCount + 1}/3)`);
        setTimeout(() => {
          if (mountedRef.current) {
            setRetryCount((prev) => prev + 1);
            loadStream();
          }
        }, delay);
      }
    }
  }, [sessionId, autoplay, retryCount, checkStreamStatus, loadHLS, cleanup]);

  // Manual retry
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setError(null);
    loadStream();
  }, [loadStream]);

  // Component mount/unmount
  useEffect(() => {
    mountedRef.current = true;
    loadStream();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [sessionId]); // Only depend on sessionId

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  if (error) {
    return (
      <div className={`bg-black text-white flex flex-col items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Playback Error</h3>
          <p className="text-gray-300 mb-4 text-sm">Stream loading error: {error}</p>
          <button
            onClick={handleRetry}
            className="bg-nocenaPink hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Retry Now
          </button>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-900 rounded-lg text-xs max-w-xs">
            <div className="font-bold mb-2">Debug Info:</div>
            <div>Session: {sessionId}</div>
            <div>Retry Count: {retryCount}/3</div>
            {streamInfo && (
              <>
                <div>Chunks: {streamInfo.status?.totalChunks || streamInfo.totalChunks || 0}</div>
                <div>Segments: {streamInfo.status?.uploadedSegments || streamInfo.uploadedSegments || 0}</div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-black text-white flex flex-col items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-bold mb-2">Loading Stream</h3>
          <p className="text-gray-300 text-sm">Connecting to FilCDN...</p>
          {streamInfo && (
            <div className="mt-4 text-sm text-gray-400">
              {streamInfo.status?.totalChunks || streamInfo.totalChunks || 0} chunks,{' '}
              {streamInfo.status?.uploadedSegments || streamInfo.uploadedSegments || 0} segments
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        controls={controls}
        autoPlay={autoplay}
        muted={autoplay}
        playsInline
        className="w-full h-full bg-black"
        onLoadStart={() => console.log('🎥 [FilCDNViewer] Video load started')}
        onCanPlay={() => console.log('🎥 [FilCDNViewer] Video can play')}
        onPlaying={() => console.log('🎥 [FilCDNViewer] Video playing')}
        onError={(e) => console.error('🎥 [FilCDNViewer] Video error:', e)}
      />

      {/* Live indicator */}
      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span>LIVE</span>
      </div>

      {/* FilCDN Branding */}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
        Powered by <span className="text-nocenaPink font-bold">FilCDN</span>
      </div>
    </div>
  );
};

export default FilCDNViewer;
