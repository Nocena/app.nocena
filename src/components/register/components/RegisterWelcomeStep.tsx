import React, { useEffect, useRef, useState } from 'react';

interface Props {
  inviteOwner?: string;
}

const RegisterWelcomeStep: React.FC<Props> = ({ inviteOwner }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showElements, setShowElements] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(console.error);
    }
    
    const timer = setTimeout(() => setShowElements(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video Background - Smart Crop */}
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={videoRef}
          className="min-w-full min-h-full object-cover opacity-90"
          muted
          playsInline
          onLoadedData={handleVideoLoad}
          onEnded={handleVideoEnd}
          preload="auto"
          style={{ 
            transform: 'scale(1.2)', // Slight zoom to ensure no black bars
            filter: 'brightness(0.7) contrast(1.1)' // Enhance for overlay text
          }}
        >
          <source src="/intro.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Gradient Overlays for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent via-transparent to-black/70"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-nocenaBlue/10 via-transparent to-nocenaPurple/10"></div>

      {/* Loading State */}
      {!videoLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center space-x-3 mb-4">
              <div className="w-4 h-4 bg-gradient-to-r from-nocenaBlue to-nocenaPurple rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-gradient-to-r from-nocenaPurple to-nocenaPink rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-4 h-4 bg-gradient-to-r from-nocenaPink to-nocenaBlue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-white/80 text-lg">Loading experience...</p>
          </div>
        </div>
      )}

      {/* Floating Content - Cinematic Style */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
        {/* Top Floating Title */}
        <div className={`text-center mt-16 transition-all duration-1500 ${showElements ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12'}`}>
          <div className="inline-block">
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-8 py-6 border border-white/20 shadow-2xl">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Welcome to the</h1>
              <h1 className="text-5xl font-black text-white tracking-tight">
                CHALLENGE
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-nocenaBlue to-nocenaPink mx-auto mt-3 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Cards */}
        <div className="space-y-6 pb-8">
          {/* Subtitle */}
          <div className={`text-center transition-all duration-1000 delay-300 ${showElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block bg-black/50 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/10">
              <p className="text-white/90 text-lg font-light">The world is watching</p>
            </div>
          </div>

          {/* Invite Card - Floating from right */}
          {inviteOwner && (
            <div className={`transition-all duration-1000 delay-500 ${showElements ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
              <div className="ml-auto mr-4 w-fit">
                <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl max-w-xs">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-nocenaBlue via-nocenaPurple to-nocenaPink rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
            <div className={`transition-all duration-1000 delay-700 ${showElements ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <div className="ml-4 w-fit">
                <div className="bg-gradient-to-r from-nocenaPink/30 via-nocenaPurple/30 to-nocenaBlue/30 backdrop-blur-xl border border-nocenaPink/40 rounded-2xl p-5 shadow-2xl max-w-xs">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-nocenaPink to-nocenaBlue rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8s.602 1.766 1.324 2.246.1.323 1.676.662V12a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 10.766 14 9.991 14 8s-.602-1.766-1.324-2.246A4.535 4.535 0 0011 5.092V5z" clipRule="evenodd"/>
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

          {/* Status */}
          <div className={`text-center transition-all duration-1000 delay-900 ${showElements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block bg-black/50 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10">
              <div className="flex items-center space-x-3">
                {videoEnded ? (
                  <>
                    <div className="w-3 h-3 bg-gradient-to-r from-nocenaPink to-nocenaBlue rounded-full animate-pulse"></div>
                    <span className="text-nocenaPink font-semibold">Ready to explore</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gradient-to-r from-nocenaBlue to-nocenaPurple rounded-full animate-pulse"></div>
                    <span className="text-white/90 font-medium">Initializing...</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterWelcomeStep;
