import React, { useEffect, useRef, useState } from 'react';

interface ReviewViewProps {
  videoPreviewUrl: string | null;
  videoBlob: Blob | null;
  selfiePreviewUrl: string | null;
  selfieBlob: Blob | null;
  onRetry: () => void;
  onSubmit: () => void;
  onRetakeSelfie?: () => void;
  onRetakeVideo?: () => void;
}

const ReviewView: React.FC<ReviewViewProps> = ({
  videoPreviewUrl,
  videoBlob,
  selfiePreviewUrl,
  selfieBlob,
  onRetry,
  onSubmit,
  onRetakeSelfie,
  onRetakeVideo
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [selfieLoaded, setSelfieLoaded] = useState(false);
  const [retakeOptions, setRetakeOptions] = useState(false);
  const [selfieError, setSelfieError] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  // Load video preview
  useEffect(() => {
    if (videoRef.current && videoBlob) {
      try {
        // Create object URL directly
        const videoUrl = URL.createObjectURL(videoBlob);
        videoRef.current.src = videoUrl;
        videoRef.current.load();
        
        videoRef.current.onloadeddata = () => {
          setVideoLoaded(true);
          console.log("Video loaded successfully");
        };
        
        videoRef.current.onerror = (err) => {
          console.error("Error in video element:", err);
        };
      } catch (err) {
        console.error("Error setting up video:", err);
      }
    }
  }, [videoBlob]);

  // Process selfie blob
  useEffect(() => {
    // Clean up previous URL if it exists
    if (selfieUrl) {
      URL.revokeObjectURL(selfieUrl);
    }
    
    // First try to use the provided selfiePreviewUrl
    if (selfiePreviewUrl) {
      console.log("Using provided selfie preview URL");
      setSelfieUrl(selfiePreviewUrl);
      setSelfieLoaded(true);
      return;
    }
    
    // Otherwise create a new URL from the blob
    if (selfieBlob) {
      try {
        const newUrl = URL.createObjectURL(selfieBlob);
        console.log("Created new selfie URL from blob:", newUrl);
        setSelfieUrl(newUrl);
        setSelfieLoaded(true);
        setSelfieError(false);
      } catch (err) {
        console.error("Failed to create object URL for selfie:", err);
        setSelfieError(true);
        setSelfieLoaded(false);
      }
    }
  }, [selfieBlob, selfiePreviewUrl]);

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (selfieUrl) {
        URL.revokeObjectURL(selfieUrl);
      }
    };
  }, [selfieUrl]);

  // Toggle retake options
  const toggleRetakeOptions = () => {
    setRetakeOptions(!retakeOptions);
  };

  return (
    <div className="w-full flex flex-col items-center mb-10">
      {/* Main video display with selfie overlay */}
      <div className="w-full mb-4 relative">
        <video 
          ref={videoRef}
          className="w-full aspect-[3/4] object-cover rounded-lg"
          controls
          playsInline
          autoPlay={false}
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black bg-opacity-40 rounded-full p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="white">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Selfie overlay in top right corner */}
        <div className="absolute top-4 right-4 w-24 h-24 overflow-hidden rounded-lg border-2 border-white shadow-lg">
          {selfieLoaded && selfieUrl ? (
            <img
              src={selfieUrl}
              className="w-full h-full object-cover"
              alt="Selfie"
              onLoad={() => console.log("Selfie image loaded successfully")}
              onError={(e) => {
                console.error("Error loading selfie image:", e);
                setSelfieError(true);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-white text-xs text-center px-1">
                {selfieError ? "Selfie error" : "Loading selfie..."}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Display debugging info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full mb-3 p-2 bg-gray-900 text-white text-xs rounded">
          <div>Selfie URL: {selfieUrl ? '✓' : '✗'}</div>
          <div>Selfie Loaded: {selfieLoaded ? '✓' : '✗'}</div>
          <div>Selfie Error: {selfieError ? '✓' : '✗'}</div>
          <div>Video Loaded: {videoLoaded ? '✓' : '✗'}</div>
        </div>
      )}
      
      {/* Retake options button */}
      <button
        onClick={toggleRetakeOptions}
        className="w-full py-3 px-4 flex items-center justify-center text-white bg-gray-800 rounded-lg mb-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 mr-2 transition-transform duration-200 ${retakeOptions ? 'rotate-180' : ''}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        {retakeOptions ? 'Hide retake options' : 'Show retake options'}
      </button>
      
      {/* Retake options */}
      {retakeOptions && (
        <div className="w-full space-y-3 mb-3">
          <button
            onClick={onRetakeVideo}
            className="w-full py-4 bg-gray-700 text-white rounded-lg text-base flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Retake video
          </button>
          
          <button
            onClick={onRetakeSelfie}
            className="w-full py-4 bg-gray-700 text-white rounded-lg text-base flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Retake selfie
          </button>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="w-full mt-4 flex justify-between gap-4">
        <button
          onClick={onRetry}
          className="flex-1 py-4 rounded-xl bg-gray-700 text-white text-lg font-medium"
        >
          Retry
        </button>
        
        <button
          onClick={onSubmit}
          className="flex-1 py-4 rounded-xl bg-green-500 text-white text-lg font-medium flex items-center justify-center"
          disabled={!videoLoaded}
        >
          <span>Submit</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReviewView;