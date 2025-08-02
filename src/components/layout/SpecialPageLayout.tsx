import React from 'react';
import { useRouter } from 'next/router';
import Back from '../icons/back';
import VideoBackground from './BackgroundVideo';

interface SpecialPageLayoutProps {
  title?: string; // Make title optional since we're not using it
  children: React.ReactNode;
  showHeader?: boolean; // Optional prop to show/hide the header with back button
}

const SpecialPageLayout: React.FC<SpecialPageLayoutProps> = ({ children, showHeader = true }) => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="app-container min-h-screen w-full text-white flex flex-col relative">
      {/* Add the video background first */}
      <VideoBackground videoSrc="/AppBG.mp4" />

      {/* Special Page Header with Back Button ONLY - Conditionally rendered */}
      {showHeader && (
        <div
          className="fixed top-0 left-0 right-0 z-[9990]"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            height: 'calc(env(safe-area-inset-top) + 64px)',
          }}
        >
          <div className="flex items-center p-4 h-16">
            <div
              className="rounded-full bg-[#212121] bg-opacity-50 backdrop-blur-md p-2 cursor-pointer flex items-center justify-center"
              onClick={handleBack}
            >
              <Back width="24" height="24" color="white" />
            </div>
            {/* Removed the title text completely */}
          </div>
        </div>
      )}

      {/* Main Content - Adjust margin based on whether header is shown */}
      <main
        className="flex-1 relative z-10 overflow-y-auto"
        style={{
          marginTop: showHeader ? 'calc(env(safe-area-inset-top) + 64px)' : 'env(safe-area-inset-top)',
          minHeight: showHeader
            ? 'calc(100vh - env(safe-area-inset-top) - 64px)'
            : 'calc(100vh - env(safe-area-inset-top))',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', // Ensure bottom padding
        }}
      >
        <div className={`h-full w-full ${showHeader ? 'p-4 pb-8' : ''}`}>{children}</div>
      </main>
    </div>
  );
};

export default SpecialPageLayout;
