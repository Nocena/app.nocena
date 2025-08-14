// components/RealMojiCapture.tsx - STABLE VERSION - No camera restarts
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface RealMojiCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmoji: {
    emoji: string;
    type: string;
    label: string;
  } | null;
  onCapture: (imageBlob: Blob, reactionType: string) => void;
  completionId: string;
}

const RealMojiCapture: React.FC<RealMojiCaptureProps> = ({
  isOpen,
  onClose,
  selectedEmoji,
  onCapture,
  completionId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Store selectedEmoji in a ref so it can't be lost during state updates
  const selectedEmojiRef = useRef<{
    emoji: string;
    type: string;
    label: string;
  } | null>(null);

  // CRITICAL: Track camera initialization state to prevent restarts
  const cameraInitializedRef = useRef(false);
  const isInitializingCameraRef = useRef(false);

  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  // Critical: Track if we're in the middle of capturing/processing
  const isActivelyCapturingRef = useRef(false);
  const hasSuccessfullyCompletedRef = useRef(false);

  // Protection system
  const protectionIdRef = useRef<string | null>(null);

  // Store selectedEmoji in ref when it changes
  useEffect(() => {
    if (selectedEmoji) {
      selectedEmojiRef.current = selectedEmoji;
      console.log('🎭 [RealMoji] Stored selectedEmoji in ref:', selectedEmoji);
    }
  }, [selectedEmoji]);

  // Register protection with global system
  const registerProtection = useCallback(() => {
    if (typeof window !== 'undefined') {
      protectionIdRef.current = `realmoji-${Date.now()}`;

      if (!(window as any).cameraProtectionRegistry) {
        (window as any).cameraProtectionRegistry = new Set();
      }

      (window as any).cameraProtectionRegistry.add(protectionIdRef.current);
      console.log('🛡️ [RealMoji] Registered camera protection:', protectionIdRef.current);
    }
  }, []);

  // Unregister protection
  const unregisterProtection = useCallback(() => {
    if (typeof window !== 'undefined' && protectionIdRef.current) {
      const registry = (window as any).cameraProtectionRegistry as Set<string>;
      if (registry) {
        registry.delete(protectionIdRef.current);
        console.log('🛡️ [RealMoji] Unregistered camera protection:', protectionIdRef.current);
      }
      protectionIdRef.current = null;
    }
  }, []);

  // Check if any component has camera protection active
  const isCameraProtected = useCallback(() => {
    if (typeof window !== 'undefined') {
      const registry = (window as any).cameraProtectionRegistry as Set<string>;
      return registry && registry.size > 0;
    }
    return false;
  }, []);

  // Enhanced stop camera that respects protection
  const stopCamera = useCallback(() => {
    // NEVER stop camera if we're actively capturing or processing
    if (isActivelyCapturingRef.current || isProcessing) {
      console.log('🎥 [RealMoji] Ignoring camera stop - actively capturing/processing');
      return;
    }

    console.log('🎥 [RealMoji] Stopping camera...');

    // Reset camera state
    cameraInitializedRef.current = false;
    isInitializingCameraRef.current = false;

    // Unregister protection
    unregisterProtection();

    // Stop all tracks from the stored stream reference
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log(`🎥 [RealMoji] Stopping ${track.kind} track:`, track.label);
        track.stop();
      });

      // Remove from global tracking
      if (typeof window !== 'undefined' && (window as any).activeCameraStreams) {
        const streams = (window as any).activeCameraStreams as MediaStream[];
        const index = streams.indexOf(streamRef.current);
        if (index > -1) {
          streams.splice(index, 1);
          console.log('🎥 [RealMoji] Removed camera stream from global tracking');
        }
      }

      streamRef.current = null;
    }

    // Also clear the video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
      videoRef.current.oncanplay = null;
      videoRef.current.onloadedmetadata = null;
    }
  }, [isProcessing, unregisterProtection]);

  const startCamera = useCallback(async () => {
    // Prevent multiple simultaneous camera initializations
    if (isInitializingCameraRef.current || cameraInitializedRef.current) {
      console.log('🎥 [RealMoji] Camera already initializing or initialized, skipping...');
      return;
    }

    isInitializingCameraRef.current = true;

    try {
      setCameraError(null);
      setIsCameraLoading(true);
      console.log('🎥 [RealMoji] Starting camera for RealMoji capture...');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 400 },
          height: { ideal: 400 },
          facingMode: 'user',
        },
        audio: false,
      });

      // Check if component was unmounted or camera stopped during async operation
      if (!isInitializingCameraRef.current) {
        console.log('🎥 [RealMoji] Camera initialization cancelled');
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      console.log('🎥 [RealMoji] MediaStream created:', {
        active: mediaStream.active,
        tracks: mediaStream.getTracks().length,
      });

      // Store stream in ref for cleanup
      streamRef.current = mediaStream;

      // Register stream globally for AppLayout tracking
      if (typeof window !== 'undefined') {
        if (!(window as any).activeCameraStreams) {
          (window as any).activeCameraStreams = [];
        }
        (window as any).activeCameraStreams.push(mediaStream);
        console.log('🎥 [RealMoji] Registered camera stream globally');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;

          const onLoadedData = () => {
            console.log('🎥 [RealMoji] Video loaded, dimensions:', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
            });
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('error', onError);

            // Mark as successfully initialized
            cameraInitializedRef.current = true;
            isInitializingCameraRef.current = false;
            setIsCameraLoading(false);
            resolve();
          };

          const onError = (e: Event) => {
            console.error('🎥 [RealMoji] Video error:', e);
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('error', onError);
            isInitializingCameraRef.current = false;
            setIsCameraLoading(false);
            reject(new Error('Video failed to load'));
          };

          video.addEventListener('loadeddata', onLoadedData);
          video.addEventListener('error', onError);

          // Start playing
          video.play().catch(reject);
        });

        console.log('🎥 [RealMoji] Video is ready and playing');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      isInitializingCameraRef.current = false;
      setIsCameraLoading(false);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  }, []);

  // CRITICAL: Only start camera ONCE when component opens
  useEffect(() => {
    if (isOpen && selectedEmoji && !cameraInitializedRef.current && !isInitializingCameraRef.current) {
      console.log('🎥 [RealMoji] Opening RealMoji capture - starting camera');
      isActivelyCapturingRef.current = false;
      hasSuccessfullyCompletedRef.current = false;
      setIsProcessing(false);
      startCamera();
    } else if (isOpen && selectedEmoji) {
      console.log('🎥 [RealMoji] RealMoji already open, camera already initialized');
    }

    // Cleanup function - only stop camera if not actively capturing
    return () => {
      if (!isActivelyCapturingRef.current && !isProcessing && hasSuccessfullyCompletedRef.current) {
        console.log('🎥 [RealMoji] Component cleanup - stopping camera');
        stopCamera();
      }
    };
  }, [isOpen, selectedEmoji]); // Removed startCamera and stopCamera from deps to prevent restarts

  // Protected cleanup for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isActivelyCapturingRef.current && !isProcessing) {
        console.log('Page hidden - stopping camera (not capturing)');
        stopCamera();
      } else if (document.hidden && (isActivelyCapturingRef.current || isProcessing)) {
        console.log('🛡️ [RealMoji] Page hidden but actively capturing - keeping camera alive');
      }
    };

    const handleBeforeUnload = () => {
      if (!isActivelyCapturingRef.current && !isProcessing) {
        console.log('Page unload - stopping camera (not capturing)');
        stopCamera();
      }
    };

    const handlePageHide = () => {
      if (!isActivelyCapturingRef.current && !isProcessing) {
        console.log('Page hide event - stopping camera (not capturing)');
        stopCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []); // Empty deps to prevent re-binding

  // Protected global camera stop listener
  useEffect(() => {
    const handleGlobalCameraStop = () => {
      if (isCameraProtected()) {
        console.log('🛡️ [RealMoji] Global camera stop blocked - protection active');
        return;
      }

      if (!isActivelyCapturingRef.current && !isProcessing) {
        console.log('🎥 [RealMoji] Received global camera stop event - stopping camera');
        stopCamera();
        onClose();
      } else {
        console.log('🛡️ [RealMoji] Ignoring global camera stop - actively capturing/processing');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('stopAllCameraStreams', handleGlobalCameraStop);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('stopAllCameraStreams', handleGlobalCameraStop);
      }
    };
  }, []); // Empty deps to prevent re-binding

  // Router change detection - with protection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history) {
      const handlePopState = () => {
        if (!isActivelyCapturingRef.current && !isProcessing) {
          console.log('🎥 [RealMoji] Navigation detected - stopping camera');
          stopCamera();
        } else {
          console.log('🛡️ [RealMoji] Navigation detected but actively capturing - keeping camera');
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []); // Empty deps to prevent re-binding

  const startCountdown = useCallback(() => {
    console.log('🎥 [RealMoji] Starting countdown...');
    setIsCapturing(true);
    isActivelyCapturingRef.current = true; // Mark as actively capturing

    // Register protection when we start capturing
    registerProtection();

    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Small delay after countdown, then capture
          setTimeout(() => {
            console.log('🎥 [RealMoji] Countdown complete, capturing photo...');
            capturePhoto();
          }, 100);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [registerProtection]);

  const capturePhoto = useCallback(async () => {
    console.log('🎥 [RealMoji] capturePhoto called');

    // Use the ref version of selectedEmoji
    const currentSelectedEmoji = selectedEmojiRef.current;

    // Enhanced debugging
    const debugInfo = {
      videoRef: !!videoRef.current,
      videoReadyState: videoRef.current?.readyState,
      videoVideoWidth: videoRef.current?.videoWidth,
      videoVideoHeight: videoRef.current?.videoHeight,
      canvasRef: !!canvasRef.current,
      selectedEmoji: !!selectedEmoji,
      selectedEmojiRef: !!currentSelectedEmoji,
      selectedEmojiDetails: currentSelectedEmoji,
      streamRef: !!streamRef.current,
      streamActive: streamRef.current?.active,
      streamTracks: streamRef.current?.getTracks().length,
      cameraInitialized: cameraInitializedRef.current,
      isInitializing: isInitializingCameraRef.current,
      isProtected: isCameraProtected(),
      protectionId: protectionIdRef.current,
    };

    console.log('🎥 [RealMoji] Debug info:', debugInfo);

    // Check using the ref version instead of prop
    if (!videoRef.current || !canvasRef.current || !currentSelectedEmoji || !streamRef.current) {
      console.error('🎥 [RealMoji] Missing required refs for capture');
      console.error('Missing:', {
        video: !videoRef.current,
        canvas: !canvasRef.current,
        emoji: !currentSelectedEmoji,
        stream: !streamRef.current,
      });
      setIsCapturing(false);
      isActivelyCapturingRef.current = false;
      setIsProcessing(false);
      unregisterProtection();
      return;
    }

    // Check if video is actually ready
    if (videoRef.current.readyState < 2) {
      console.error('🎥 [RealMoji] Video not ready yet, readyState:', videoRef.current.readyState);
      setIsCapturing(false);
      isActivelyCapturingRef.current = false;
      setIsProcessing(false);
      unregisterProtection();
      return;
    }

    // Check if video has dimensions
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      console.error('🎥 [RealMoji] Video has no dimensions:', {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
      setIsCapturing(false);
      isActivelyCapturingRef.current = false;
      setIsProcessing(false);
      unregisterProtection();
      return;
    }

    try {
      setIsProcessing(true);
      console.log('🎥 [RealMoji] Starting photo processing...');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log('🎥 [RealMoji] Canvas dimensions:', { width: canvas.width, height: canvas.height });

      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const blobPromise = new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          0.85,
        );
      });

      const blob = await blobPromise;
      console.log('🎥 [RealMoji] Photo blob created successfully:', { size: blob.size });

      // Mark as successfully completed BEFORE calling onCapture
      hasSuccessfullyCompletedRef.current = true;

      // Call the capture handler using the ref emoji data
      console.log('🎥 [RealMoji] Calling onCapture with emoji type:', currentSelectedEmoji.type);
      await onCapture(blob, currentSelectedEmoji.type);

      console.log('🎥 [RealMoji] Photo capture completed successfully');

      // Now it's safe to stop the camera and close
      stopCamera();
      onClose();
    } catch (error) {
      console.error('🎥 [RealMoji] Error during photo capture:', error);
      // Reset states on error
      setIsCapturing(false);
      isActivelyCapturingRef.current = false;
      setIsProcessing(false);
      unregisterProtection();
    }
  }, [onCapture, onClose, unregisterProtection]); // Removed dependencies that cause restarts

  const handleClose = useCallback(() => {
    console.log('🎥 [RealMoji] User cancelled - stopping camera');
    isActivelyCapturingRef.current = false;
    hasSuccessfullyCompletedRef.current = true; // Prevent cleanup conflicts
    setIsProcessing(false);
    unregisterProtection();
    stopCamera();
    setIsCapturing(false);
    setCountdown(null);
    onClose();
  }, [onClose, unregisterProtection]); // Removed stopCamera dependency

  // Use the ref version for display as well, with fallback to prop
  const displayEmoji = selectedEmojiRef.current || selectedEmoji;

  // Don't render if not open
  if (!isOpen || !displayEmoji) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={handleClose} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-white text-lg font-semibold">RealMoji</h1>
          <p className="text-white/80 text-sm">Show your {displayEmoji.label.toLowerCase()} reaction!</p>
        </div>
        <div className="w-10 h-10" /> {/* Spacer */}
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full flex items-center justify-center">
        {cameraError ? (
          <div className="text-center text-white p-6">
            <div className="text-4xl mb-4">📷</div>
            <p className="text-lg font-medium mb-2">Camera Access Required</p>
            <p className="text-sm text-white/80 mb-4">{cameraError}</p>
            <button onClick={startCamera} className="px-6 py-3 bg-white rounded-full text-black font-medium">
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Video Element */}
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

            {/* Circular Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/40" />
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-4 border-white shadow-lg"
                style={{
                  boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6)`,
                }}
              />
            </div>

            {/* Emoji Guide */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-black/70 rounded-full px-6 py-3 flex items-center space-x-3">
                <span className="text-4xl">{displayEmoji.emoji}</span>
                <span className="text-white font-medium">{displayEmoji.label}</span>
              </div>
            </div>

            {/* Camera loading indicator */}
            {isCameraLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                <div className="text-center text-white">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Starting camera...</p>
                </div>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                <div className="text-center text-white">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Processing your RealMoji...</p>
                  <div className="mt-2 text-sm text-white/80">🛡️ Camera protected</div>
                </div>
              </div>
            )}

            {/* Countdown */}
            {countdown !== null && !isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-8xl font-bold text-white drop-shadow-lg animate-pulse">{countdown}</div>
              </div>
            )}

            {/* Instructions */}
            {!isCapturing && countdown === null && !isProcessing && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 text-center">
                <p className="text-white text-lg font-medium mb-2">Make a {displayEmoji.label.toLowerCase()} face!</p>
                <p className="text-white/80 text-sm">Position your face in the circle</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Capture Button */}
      {!cameraError && !isCapturing && countdown === null && !isProcessing && !isCameraLoading && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={startCountdown}
            className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-400" />
          </button>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default RealMojiCapture;
