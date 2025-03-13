// components/SelfieView.tsx
import React from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';

interface SelfieViewProps {
  selfieVideoRef: React.RefObject<HTMLVideoElement | null>;
  onCaptureSelfie: () => void;
}

const SelfieView: React.FC<SelfieViewProps> = ({ 
  selfieVideoRef, 
  onCaptureSelfie 
}) => {
  return (
    <div className="w-full flex flex-col items-center relative">
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden mb-4">
        <video 
          ref={selfieVideoRef}
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        
        {/* Guidance overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
          <p className="text-white text-center text-sm">
            Now take a quick selfie to verify it's you!
          </p>
        </div>
      </div>
      
      <PrimaryButton
        text="Take Selfie"
        onClick={onCaptureSelfie}
        isActive={true}
      />
    </div>
  );
};

export default SelfieView;