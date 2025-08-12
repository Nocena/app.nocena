import React, { useEffect, useCallback } from 'react';
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

  // Function to stop all camera streams
  const stopAllCameraStreams = useCallback(() => {
    console.log('🎥 [SpecialPageLayout] Stopping all camera streams...');

    // Dispatch global camera stop event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stopAllCameraStreams'));
    }

    // Also handle globally tracked streams
    if (typeof window !== 'undefined' && (window as any).activeCameraStreams) {
      const streams = (window as any).activeCameraStreams as MediaStream[];
      streams.forEach((stream: MediaStream, index: number) => {
        console.log(`🎥 [SpecialPageLayout] Stopping globally tracked stream ${index}`);
        stream.getTracks().forEach((track: MediaStreamTrack) => {
          track.stop();
          console.log(`🎥 [SpecialPageLayout] Stopped track: ${track.kind} - ${track.label}`);
        });
      });
      // Clear the global array
      (window as any).activeCameraStreams = [];
    }
  }, []);

  // Handle back navigation with camera cleanup
  const handleBack = useCallback(() => {
    console.log('🎥 [SpecialPageLayout] Back button clicked, stopping camera streams');
    stopAllCameraStreams();

    // Small delay to ensure cleanup completes before navigation
    setTimeout(() => {
      router.back();
    }, 100);
  }, [router, stopAllCameraStreams]);

  // Handle page visibility and cleanup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🎥 [SpecialPageLayout] Page hidden, stopping camera streams');
        stopAllCameraStreams();
      }
    };

    const handleBeforeUnload = () => {
      console.log('🎥 [SpecialPageLayout] Page unloading, stopping camera streams');
      stopAllCameraStreams();
    };

    const handlePageHide = () => {
      console.log('🎥 [SpecialPageLayout] Page hide event, stopping camera streams');
      stopAllCameraStreams();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);

      // Final cleanup when component unmounts
      console.log('🎥 [SpecialPageLayout] Component unmounting, final camera cleanup');
      stopAllCameraStreams();
    };
  }, [stopAllCameraStreams]);

  // Handle router events for navigation cleanup
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      console.log(`🎥 [SpecialPageLayout] Route changing to ${url}, stopping camera streams`);
      stopAllCameraStreams();
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      stopAllCameraStreams();
    };
  }, [router.events, stopAllCameraStreams]);

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
