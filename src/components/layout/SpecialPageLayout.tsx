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

  return (
    <div className="app-container min-h-screen w-full text-white flex flex-col relative">
      {/* Add the video background first */}
      <VideoBackground videoSrc="/AppBG.mp4" />

      {/* Special Page Header with Back Button */}
      <div className="fixed top-0 left-0 right-0 z-[9990] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center p-4">
          <div
            className="rounded-full bg-[#212121] bg-opacity-50 backdrop-blur-md p-2 cursor-pointer"
            onClick={handleBack}
          >
            <Back width="24" height="24" color="white" />
          </div>
          <h1 className="text-xl font-medium ml-4">{title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow relative z-10 pt-16 pb-0 px-4">{children}</main>
    </div>
  );
};

export default SpecialPageLayout;
