// components/IdleView.tsx
import React from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';

interface IdleViewProps {
  onStartRecording: () => void;
}

const IdleView: React.FC<IdleViewProps> = ({ onStartRecording }) => {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-[#1A2734] rounded-xl p-6 w-full mb-6">
        <h3 className="text-center text-white text-lg mb-4">Ready to complete this challenge?</h3>
        <p className="text-center text-gray-400 mb-2">You'll need to:</p>
        <ol className="text-gray-300 list-decimal pl-8 mb-4">
          <li className="mb-2">Record a 30-second video showing your completion</li>
          <li>Take a quick selfie to verify it's you</li>
        </ol>
        <p className="text-center text-gray-400 mt-4">
          Make sure you're in a well-lit area and your camera is ready!
        </p>
      </div>
      
      <PrimaryButton
        text="Start Recording"
        onClick={onStartRecording}
        isActive={true}
      />
    </div>
  );
};

export default IdleView;