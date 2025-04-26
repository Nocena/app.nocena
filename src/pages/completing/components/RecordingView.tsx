// components/RecordingView.tsx
import React, { useEffect } from 'react';

interface RecordingViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  recordingTime: number;
  description: string;
  onStopRecording: () => void;
  stream?: MediaStream | null; // Pass the stream directly if needed
}

const RecordingView: React.FC<RecordingViewProps> = ({
  videoRef,
  recordingTime,
  description,
  onStopRecording,
  stream,
}) => {
  // Ensure video keeps playing when component mounts
  useEffect(() => {
    if (videoRef.current) {
      // Check if video needs reconnection to stream
      if (!videoRef.current.srcObject && stream) {
        videoRef.current.srcObject = stream;
      }

      // Make sure video is playing
      if (videoRef.current.paused) {
        videoRef.current.play().catch((e) => console.error('Failed to play video:', e));
      }
    }
  }, [videoRef, stream]);

  return (
    <div className="w-full flex flex-col items-center relative mb-10">
      <div className="relative w-full aspect-3/4 rounded-lg overflow-hidden mb-4">
        {/* Add key prop to force re-render */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          key="recording-video" // Force fresh mount
        />

        {/* Recording indicator */}
        <div className="absolute top-4 left-4 flex items-center bg-black bg-opacity-60 rounded-full px-3 py-1">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-white text-sm">{recordingTime}s</span>
        </div>

        {/* Guidance overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2">
          <p className="text-white text-center text-sm">{description}</p>
        </div>
      </div>

      <div className="flex justify-between w-full px-4 mt-2">
        <p className="text-gray-300">Recording: {recordingTime}/30s</p>

        <button onClick={onStopRecording} className="text-white bg-blue-500 px-4 py-1 rounded-full">
          {recordingTime < 30 ? 'Stop Early' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default RecordingView;
