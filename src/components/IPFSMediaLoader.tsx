// components/IPFSMediaLoader.tsx
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getBackupGatewayUrl } from '../lib/api/pinata';

interface IPFSMediaLoaderProps {
  videoUrl: string | null;
  selfieUrl: string | null;
  className?: string;
  loop: boolean;
}

const IPFSMediaLoader: React.FC<IPFSMediaLoaderProps> = ({ videoUrl, selfieUrl, className = '', loop = false }) => {
  const [videoError, setVideoError] = useState<boolean>(false);
  const [selfieError, setSelfieError] = useState<boolean>(false);
  const [videoLoading, setVideoLoading] = useState<boolean>(true);
  const [selfieLoading, setSelfieLoading] = useState<boolean>(true);
  const [currentVideoGateway, setCurrentVideoGateway] = useState<number>(0);
  const [currentSelfieGateway, setCurrentSelfieGateway] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cornerVideoRef = useRef<HTMLVideoElement>(null);

  // Maximum number of gateway attempts before giving up
  const MAX_GATEWAY_ATTEMPTS = 5;

  // Extract media info from URL for better error handling
  const extractMediaInfo = (url: string | null) => {
    if (!url) return null;

    try {
      // Parse the URL to extract CID and filename
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // For IPFS gateway URLs, the format is typically /ipfs/CID/filename
      if (pathParts.length >= 3 && pathParts[1] === 'ipfs') {
        return {
          cid: pathParts[2],
          fileName: pathParts[3] || '',
          fullPath: urlObj.pathname,
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing URL:', url, error);
      return null;
    }
  };

  // Get media info
  const videoInfo = extractMediaInfo(videoUrl);
  const selfieInfo = extractMediaInfo(selfieUrl);

  // Set up video event handlers on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const handleLoadStart = () => {
      console.log('Video load started:', videoUrl);
      setVideoLoading(true);
      setVideoError(false);
    };

    const handleCanPlay = () => {
      console.log('Video can play:', videoUrl);
      setVideoLoading(false);
      // Auto-play the video when it can play (only if it's in the main view)
      if (video && !isPlaying && !isSwapped) {
        video.play().catch((err) => {
          console.error('Error auto-playing video:', err);
        });
      }
    };

    const handleLoadedData = () => {
      console.log('Video data loaded:', videoUrl);
      setVideoLoading(false);
      // Auto-play the video when data is loaded (only if it's in the main view)
      if (video && !isPlaying && !isSwapped) {
        video.play().catch((err) => {
          console.error('Error auto-playing video:', err);
        });
      }
    };

    const handleError = (e: Event) => {
      console.error('Video error event:', e);
      handleVideoError();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    // Add all event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Set initial src and load
    if (video.src !== videoUrl) {
      video.src = videoUrl;
      video.load();
    }

    // Cleanup
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl, isSwapped]);

  // Set up corner video event handlers for auto-play in corner
  useEffect(() => {
    const cornerVideo = cornerVideoRef.current;
    if (!cornerVideo || !videoUrl || isMainVideo) return;

    const handleCornerVideoCanPlay = () => {
      // Auto-play corner video when it can play
      cornerVideo.play().catch((err) => {
        console.error('Error auto-playing corner video:', err);
      });
    };

    const handleCornerVideoLoadedData = () => {
      // Auto-play corner video when data is loaded
      cornerVideo.play().catch((err) => {
        console.error('Error auto-playing corner video:', err);
      });
    };

    cornerVideo.addEventListener('canplay', handleCornerVideoCanPlay);
    cornerVideo.addEventListener('loadeddata', handleCornerVideoLoadedData);

    // Set src and load
    if (cornerVideo.src !== videoUrl) {
      cornerVideo.src = videoUrl;
      cornerVideo.load();
    }

    // Cleanup
    return () => {
      cornerVideo.removeEventListener('canplay', handleCornerVideoCanPlay);
      cornerVideo.removeEventListener('loadeddata', handleCornerVideoLoadedData);
    };
  }, [videoUrl, isSwapped]);

  // Handle video loading error
  const handleVideoError = () => {
    // Try the next gateway, up to MAX_GATEWAY_ATTEMPTS (increase to 6)
    const MAX_GATEWAY_ATTEMPTS = 6;

    if (currentVideoGateway >= MAX_GATEWAY_ATTEMPTS - 1) {
      console.error('Failed to load video after trying multiple gateways');
      setVideoError(true);
      setVideoLoading(false);
      return;
    }

    // Try an alternative gateway
    const nextGatewayIndex = currentVideoGateway + 1;
    const backupUrl = getBackupGatewayUrl(videoUrl, nextGatewayIndex);

    if (backupUrl) {
      console.log(`Switching to gateway ${nextGatewayIndex} for video: ${backupUrl}`);
      setCurrentVideoGateway(nextGatewayIndex);

      // Update the video source with a new URL
      const video = videoRef.current;
      if (video) {
        video.src = backupUrl;
        video.load();
      }
    } else {
      console.error('No more gateway alternatives available');
      setVideoError(true);
      setVideoLoading(false);
    }
  };

  // Handle selfie loading error
  const handleSelfieError = () => {
    // Try an alternative gateway
    const backupUrl = getBackupGatewayUrl(selfieUrl, currentSelfieGateway + 1);

    if (backupUrl && backupUrl !== selfieUrl && currentSelfieGateway < MAX_GATEWAY_ATTEMPTS) {
      console.log(`Trying alternative gateway for selfie: ${backupUrl}`);
      setCurrentSelfieGateway(currentSelfieGateway + 1);
      return;
    }

    // If no more gateways to try
    console.error('Failed to load selfie after trying alternative gateways');
    setSelfieError(true);
    setSelfieLoading(false);
  };

  // Toggle play/pause for the video
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => {
        console.error('Error playing video:', err);
      });
    }
  };

  // Handle media swap (BeReal-style functionality)
  const handleMediaSwap = () => {
    if (!videoUrl || !selfieUrl) return;

    // Pause all videos when swapping
    const mainVideo = videoRef.current;
    const cornerVideo = cornerVideoRef.current;

    if (mainVideo) {
      mainVideo.pause();
    }
    if (cornerVideo) {
      cornerVideo.pause();
    }

    setIsPlaying(false);
    setIsSwapped((prev) => !prev);
  };

  // Debug function to diagnose IPFS issues directly in the browser
  const handleDebugClick = async () => {
    try {
      // Get either video or selfie info
      const mediaInfo = videoInfo || selfieInfo;
      if (!mediaInfo) {
        console.error('No valid media info available for debugging');
        return;
      }

      console.log('Starting IPFS diagnostics with:', mediaInfo);

      // Try all gateways directly from browser instead of using API
      const success = await tryAllGateways(mediaInfo.cid);

      if (!success) {
        console.log('All gateways failed. The file may not be available on IPFS anymore.');
      }
    } catch (error) {
      console.error('Error running IPFS diagnostics:', error);
    }
  };

  // Make simple fetch request to check if file exists
  const checkFile = async (url: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Try different gateways directly in browser
  const tryAllGateways = async (cid: string) => {
    console.log('Manually checking gateways for', cid);

    const gateways = [
      'https://gateway.pinata.cloud/ipfs',
      'https://jade-elaborate-emu-349.mypinata.cloud/ipfs',
      'https://ipfs.io/ipfs',
      'https://cloudflare-ipfs.com/ipfs',
      'https://dweb.link/ipfs',
      'https://gateway.ipfs.io/ipfs',
    ];

    for (const gateway of gateways) {
      const url = `${gateway}/${cid}`;
      console.log(`Checking gateway: ${url}`);
      const exists = await checkFile(url);
      console.log(`Gateway ${gateway}: ${exists ? 'Working' : 'Failed'}`);

      if (exists) {
        // Update video element if it exists
        const video = videoRef.current;
        if (video) {
          video.src = url;
          video.load();
          return true;
        }
      }
    }

    return false;
  };

  // Determine what to show in main area vs corner based on swap state
  const mainMediaUrl = isSwapped ? selfieUrl : videoUrl;
  const cornerMediaUrl = isSwapped ? videoUrl : selfieUrl;
  const isMainVideo = !isSwapped;
  const isMainSelfie = isSwapped;

  return (
    <div className={`ipfs-media-container relative ${className}`}>
      {/* Main Media Area */}
      <div className="main-media relative bg-black rounded-lg overflow-hidden aspect-[3/4] w-full">
        {/* Main Video */}
        {isMainVideo && videoUrl && (
          <>
            {videoLoading && !videoError && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}

            {videoError ? (
              <div className="flex items-center justify-center h-full w-full bg-gray-800 rounded-lg">
                <div className="text-center p-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-400">Video unavailable</p>
                  <button
                    onClick={handleDebugClick}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Run diagnostics
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  loop={loop}
                  preload="metadata"
                  poster="/images/placeholder.avif"
                  onClick={togglePlayPause}
                  style={{
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                  }}
                />

                {/* Play/Pause overlay */}
                {!videoLoading && !videoError && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center cursor-pointer z-5 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'} transition-opacity`}
                    onClick={togglePlayPause}
                  >
                    {!isPlaying && (
                      <div className="w-26 h-26 rounded-full bg-black bg-opacity-60 flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Main Selfie */}
        {isMainSelfie && selfieUrl && (
          <>
            {selfieLoading && !selfieError && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}

            {selfieError ? (
              <div className="flex items-center justify-center h-full w-full bg-gray-800 rounded-lg">
                <div className="text-center p-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-400">Image unavailable</p>
                </div>
              </div>
            ) : (
              <Image
                src={selfieUrl}
                alt="Selfie"
                fill
                className="object-cover"
                onError={handleSelfieError}
                onLoad={() => setSelfieLoading(false)}
                unoptimized
              />
            )}
          </>
        )}
      </div>

      {/* Corner Media (Clickable for swap) - 30% bigger and no arrow icon */}
      {cornerMediaUrl && (
        <div
          className="absolute top-2 right-2 w-24 h-24 rounded-md overflow-hidden border-2 border-white shadow-lg z-20 cursor-pointer hover:scale-105 transition-transform duration-200"
          onClick={handleMediaSwap}
        >
          {/* Corner Video - now loops */}
          {!isMainVideo && videoUrl && (
            <video
              ref={cornerVideoRef}
              className="w-full h-full object-cover"
              src={videoUrl}
              playsInline
              muted
              loop
              preload="metadata"
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%',
              }}
            />
          )}

          {/* Corner Selfie */}
          {!isMainSelfie && selfieUrl && (
            <>
              {selfieLoading && !selfieError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              )}

              {selfieError ? (
                <div className="flex items-center justify-center h-full w-full bg-gray-800">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              ) : (
                <Image
                  src={selfieUrl}
                  alt="Selfie"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  onError={handleSelfieError}
                  onLoad={() => setSelfieLoading(false)}
                  unoptimized
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default IPFSMediaLoader;
