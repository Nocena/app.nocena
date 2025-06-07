import React from 'react';
import { useRouter } from 'next/router';
import Back from '../icons/back';
import VideoBackground from './BackgroundVideo';

interface SpecialPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

const SpecialPageLayout: React.FC<SpecialPageLayoutProps> = ({ title, children }) => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const headerHeight = 'calc(env(safe-area-inset-top) + 64px)'; // 64px for header

  return (
    <div className="app-container h-screen w-full text-white flex flex-col relative overflow-hidden">
      {/* Add the video background first */}
      <VideoBackground videoSrc="/AppBG.mp4" />

      {/* Special Page Header with Back Button */}
      <div 
        className="fixed top-0 left-0 right-0 z-[9990] bg-black/20 backdrop-blur-sm border-b border-white/10"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          height: headerHeight,
        }}
      >
        <div className="flex items-center p-4 h-full">
          <div
            className="rounded-full bg-[#212121] bg-opacity-50 backdrop-blur-md p-2 cursor-pointer flex items-center justify-center"
            onClick={handleBack}
          >
            <Back width="24" height="24" color="white" />
          </div>
          <h1 className="text-xl font-medium ml-4">{title}</h1>
        </div>
      </div>

      {/* Main Content - Full height with proper scroll */}
      <main 
        className="flex-1 relative z-10 overflow-y-auto"
        style={{
          marginTop: headerHeight,
          height: `calc(100vh - ${headerHeight})`,
        }}
      >
        <div className="h-full w-full p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SpecialPageLayout;
