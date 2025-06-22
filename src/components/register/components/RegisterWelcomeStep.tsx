import React, { useEffect, useRef, useState } from 'react';

interface Props {
  inviteOwner?: string;
  videoPreloaded?: boolean;
  preloadedVideo?: HTMLVideoElement | null;
}

const RegisterWelcomeStep: React.FC<Props> = ({ inviteOwner, videoPreloaded = false, preloadedVideo = null }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showElements, setShowElements] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      if (videoPreloaded && preloadedVideo) {
        console.log('🎬 Using preloaded video for instant playback');

        // Method 1: Clone the preloaded video's state
        try {
          // Copy all the important properties from preloaded video
          video.src = preloadedVideo.src;
          video.preload = 'auto';
          video.muted = true;
          video.playsInline = true;

          // If the preloaded video has buffered data, this should be instant
          if (preloadedVideo.readyState >= 3) {
            // HAVE_FUTURE_DATA or better
            console.log('✅ Preloaded video has sufficient data, should play instantly');
            setVideoLoaded(true);
            setVideoReady(true);

            // Try to play immediately since data is ready
            video
              .play()
              .then(() => {
                console.log('🎬 Preloaded video started playing successfully');
              })
              .catch((error) => {
                console.warn('⚠️ Autoplay failed but video is ready:', error);
              });
          } else {
            console.log('📼 Preloaded video needs more buffering');
            video.load(); // Trigger loading with the benefit of browser cache
          }
        } catch (error) {
          console.error('❌ Error using preloaded video:', error);
          // Fallback to normal loading
          video.src = '/intro.MP4';
          video.load();
        }
      } else {
        console.log('🎬 No preloaded video, loading normally (this may take time for large files)');
        video.src = '/intro.MP4';
        video.load();

        // Show ready state immediately since we don't want to wait
        setTimeout(() => {
          setVideoReady(true);
        }, 1000);
      }
    }

    // Show elements with animation delay
    const timer = setTimeout(() => setShowElements(true), 500);
    return () => clearTimeout(timer);
  }, [videoPreloaded, preloadedVideo]);

  const handleVideoLoad = () => {
    console.log('📼 Video loaded and ready to play');
    setVideoLoaded(true);
    setVideoReady(true);
  };

  const handleVideoEnd = () => {
    console.log('🎬 Welcome video finished playing');
    setVideoEnded(true);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('❌ Video failed to load:', e);
    console.log('🔄 Continuing with text-only welcome screen');
    // Don't block the welcome screen if video fails
    setVideoLoaded(false);
    setVideoReady(true); // Allow UI to show anyway
  };

  const handleVideoCanPlay = () => {
    console.log('✅ Video can start playing');
    setVideoReady(true);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video Background - Smart Crop */}
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          className={`min-w-full min-h-full object-cover transition-opacity duration-1000 ${
            videoLoaded && videoReady ? 'opacity-90' : 'opacity-0'
          }`}
          muted
          playsInline
          onLoadedData={handleVideoLoad}
          onCanPlay={handleVideoCanPlay}
          onEnded={handleVideoEnd}
          onError={handleVideoError}
          preload="auto"
          style={{
            transform: 'scale(1.2)', // Slight zoom to ensure no black bars
            filter: 'brightness(0.7) contrast(1.1)', // Enhance for overlay text
          }}
        >
          <source src="/intro.MP4" type="video/mp4" />
          {/* Fallback source with lowercase */}
          <source src="/intro.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Background Gradient for when video is not visible */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 transition-opacity duration-1000 ${
          videoLoaded && videoReady ? 'opacity-0' : 'opacity-100'
        }`}
      ></div>

      {/* Gradient Overlays for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent via-transparent to-black/70"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-nocenaBlue/10 via-transparent to-nocenaPurple/10"></div>

      {/* Loading State - Only show for the first few moments */}
      {!showElements && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center space-x-3 mb-4">
              <div className="w-4 h-4 bg-gradient-to-r from-nocenaBlue to-nocenaPurple rounded-full animate-bounce"></div>
              <div
                className="w-4 h-4 bg-gradient-to-r from-nocenaPurple to-nocenaPink rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-4 h-4 bg-gradient-to-r from-nocenaPink to-nocenaBlue rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
            <p className="text-white/80 text-lg">
              {videoPreloaded ? 'Initializing experience...' : 'Loading experience...'}
            </p>
            {videoPreloaded && <p className="text-white/60 text-sm mt-2">Video ready, starting now!</p>}
          </div>
        </div>
      )}

      {/* Floating Content - Cinematic Style */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
        {/* Top Floating Title */}
        <div
          className={`text-center mt-16 transition-all duration-1500 ${
            showElements ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12'
          }`}
        >
          <div className="inline-block">
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-8 py-6 border border-white/20 shadow-2xl">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Welcome to the</h1>
              <h1 className="text-5xl font-black text-white tracking-tight">CHALLENGE</h1>
              <div className="w-24 h-1 bg-gradient-to-r from-nocenaBlue to-nocenaPink mx-auto mt-3 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Cards */}
        <div className="space-y-6 pb-8">
          {/* Subtitle */}
          <div
            className={`text-center transition-all duration-1000 delay-300 ${
              showElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-block bg-black/50 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/10">
              <p className="text-white/90 text-lg font-light">The world is watching</p>
            </div>
          </div>

          {/* Invite Card - Floating from right */}
          {inviteOwner && (
            <div
              className={`transition-all duration-1000 delay-500 ${
                showElements ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`}
            >
              <div className="ml-auto mr-4 w-fit">
                <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl max-w-xs">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-nocenaBlue via-nocenaPurple to-nocenaPink rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-nocenaPink rounded-full border-2 border-black animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm font-medium">Invited by</p>
                      <p className="text-white text-xl font-bold">{inviteOwner}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Token Card - Floating from left */}
          {inviteOwner && (
            <div
              className={`transition-all duration-1000 delay-700 ${
                showElements ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              <div className="ml-4 w-fit">
                <div className="bg-gradient-to-r from-nocenaPink/30 via-nocenaPurple/30 to-nocenaBlue/30 backdrop-blur-xl border border-nocenaPink/40 rounded-2xl p-5 shadow-2xl max-w-xs">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-nocenaPink to-nocenaBlue rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8s.602 1.766 1.324 2.246.1.323 1.676.662V12a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 10.766 14 9.991 14 8s-.602-1.766-1.324-2.246A4.535 4.535 0 0011 5.092V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-nocenaPink text-xl font-bold">+50 Nocenix</p>
                      <p className="text-white/80 text-sm">tokens for both!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Status Indicator */}
          <div
            className={`text-center transition-all duration-1000 delay-900 ${
              showElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-block bg-black/50 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10">
              <div className="flex items-center space-x-3">
                {videoEnded ? (
                  <>
                    <div className="w-3 h-3 bg-gradient-to-r from-nocenaPink to-nocenaBlue rounded-full animate-pulse"></div>
                    <span className="text-nocenaPink font-semibold">Ready to explore</span>
                  </>
                ) : videoReady ? (
                  <>
                    <div className="w-3 h-3 bg-gradient-to-r from-nocenaBlue to-nocenaPurple rounded-full animate-pulse"></div>
                    <span className="text-white/90 font-medium">Experience loading...</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-white/90 font-medium">
                      {videoPreloaded ? 'Starting...' : 'Initializing...'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Video Performance Indicator (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div
              className={`text-center transition-all duration-1000 delay-1100 ${
                showElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="inline-block bg-black/30 backdrop-blur-xl rounded-lg px-3 py-1 border border-white/5">
                <div className="flex items-center space-x-2 text-xs">
                  {videoPreloaded ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-300">Video preloaded ✓</span>
                    </>
                  ) : videoLoaded ? (
                    <>
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-300">Video loaded ✓</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-yellow-300">Loading video...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterWelcomeStep;
