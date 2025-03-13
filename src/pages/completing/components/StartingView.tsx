// components/StartingView.tsx
import React from 'react';

interface StartingViewProps {
  countdown: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const StartingView: React.FC<StartingViewProps> = ({ countdown, videoRef }) => {
  return (
    <div className="w-full flex flex-col items-center relative">
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden mb-4">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-7xl font-bold text-white animate-pulse">
            {countdown}
          </div>
        </div>
      </div>
      
      <p className="text-white text-center">
        Get ready! Recording will start in {countdown}...
      </p>
    </div>
  );
};

export default StartingView;