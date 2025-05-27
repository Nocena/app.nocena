import React, { ReactNode } from 'react';
import Image from 'next/image';
import VideoBackground from './BackgroundVideo'; // Import the same VideoBackground component

interface AuthenticationLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const AuthenticationLayout = ({ children, title, subtitle }: AuthenticationLayoutProps) => {
  return (
    <div className="min-h-screen w-full text-white flex flex-col relative">
      {/* Add the same video background as the main app */}
      <VideoBackground videoSrc="/AppBG.mp4" />

      {/* Content container with proper z-index to appear over video */}
      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="w-full max-w-md mx-4">
          <div className="flex flex-col items-center max-w-md w-full px-4">
            <div className="max-w-full h-auto mx-auto mb-20 relative">
              <Image src="/logo/horizontal.png" alt="Nocena Logo" width={512} height={116} sizes="100vw" />
            </div>
            {title ? <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2> : null}
            {subtitle ? <p className="text-gray-300 mb-8 text-center">{subtitle}</p> : null}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationLayout;
