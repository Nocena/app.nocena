// components/StatusView.tsx
import React from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { RecordingState } from '../../../lib/completing/types';

interface StatusViewProps {
  state: RecordingState.UPLOADING | RecordingState.COMPLETE | RecordingState.ERROR;
  statusMessage: string;
  error: string | null;
  reward: string;
  onRetry: () => void;
}

const nocenixIcon = '/nocenix.ico';

const StatusView: React.FC<StatusViewProps> = ({
  state,
  statusMessage,
  error,
  reward,
  onRetry
}) => {
  switch (state) {
    case RecordingState.UPLOADING:
      return (
        <div className="w-full flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-6"></div>
          <p className="text-center text-white text-xl mb-2">
            {statusMessage || "Processing your challenge..."}
          </p>
          <p className="text-center text-gray-400">
            This may take a moment (up to 2 minutes). Please don't close the app.
          </p>
        </div>
      );
      
    case RecordingState.COMPLETE:
      return (
        <div className="w-full flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-white text-2xl">✓</span>
          </div>
          <p className="text-center text-white text-xl mb-2">
            Challenge Completed!
          </p>
          <div className="flex items-center justify-center mb-6 py-2 px-6 rounded-full bg-[#2A3B4D]">
            <Image 
              src={nocenixIcon} 
              alt="Nocenix" 
              width={24} 
              height={24}
              className="mr-2"
            />
            <span className="font-bold text-white">{reward || "1"} NOCENIX</span>
          </div>
          <p className="text-center text-gray-300">
            Redirecting to home...
          </p>
        </div>
      );
      
    case RecordingState.ERROR:
      return (
        <div className="w-full flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-white text-2xl">!</span>
          </div>
          <p className="text-center text-white text-xl mb-4">
            Something went wrong
          </p>
          <p className="text-center text-gray-400 mb-6">
            {error || "We encountered an error while processing your challenge."}
          </p>
          <PrimaryButton
            text="Try Again"
            onClick={onRetry}
            isActive={true}
          />
        </div>
      );
    
    default:
      return null;
  }
};

export default StatusView;