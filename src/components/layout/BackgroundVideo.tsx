import React, { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
}

const BackgroundVideo: React.FC<VideoBackgroundProps> = ({ videoSrc }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Enable special playback attributes for better performance
    video.playsInline = true;
    video.muted = true;

    // Start playback
    const playVideo = () => {
      video.play().catch(() => {}); // Silent error handling
    };

    // Try to play as soon as possible
    playVideo();

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        playVideo();
      } else {
        video.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      video.pause();
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full -z-10 overflow-hidden bg-black pointer-events-none">
      <video
        ref={videoRef}
        className="absolute top-1/2 left-1/2 w-auto h-auto min-w-full min-h-full transform -translate-x-1/2 -translate-y-1/2 object-cover"
        src={videoSrc}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-black opacity-60" />
    </div>
  );
};

export default BackgroundVideo;
