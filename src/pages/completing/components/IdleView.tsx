// components/IdleView.tsx
import React from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { ChallengeParams } from '../../../lib/completing/types';

interface IdleViewProps {
  onStartRecording: () => void;
  challengeParams?: ChallengeParams;
}

const IdleView: React.FC<IdleViewProps> = ({ onStartRecording, challengeParams }) => {
  // Default to daily if not specified
  const frequency = challengeParams?.frequency || 'daily';
  
  // Define recording duration text based on challenge frequency
  const getDurationText = () => {
    switch (frequency) {
      case 'daily':
        return 'Record a 30-second video showing your completion';
      case 'weekly':
        return 'Upload an up to 1-minute video showing your completion';
      case 'monthly':
        return 'Upload an up to 3-minute video showing your completion';
      default:
        return 'Record a 30-second video showing your completion';
    }
  };
  
  // Define selfie requirement text based on challenge frequency
  const getSelfieText = () => {
    switch (frequency) {
      case 'daily':
        return 'Take a quick selfie to verify it\'s you';
      case 'weekly':
        return 'Take a quick selfie to verify it\'s you';
      case 'monthly':
        return 'Take a quick selfie to verify it\'s you';
      default:
        return 'Take a quick selfie to verify it\'s you';
    }
  };

  // Explanation text bellow
  const getExplanationText = () => {
    switch (frequency) {
      case 'daily':
        return 'You need to record completing this  in the moment, so make sure you\'re looking great and your camera is ready!';
      case 'weekly':
        return 'Weekly challenges are more complex so you should create a better submision documnting your journey.';
      case 'monthly':
        return 'Monthly challenges are the longest challenges you can make here - so let your creativity grab the wheel!';
      default:
        return 'Take a quick selfie to verify it\'s you';
    }
  };

    // Explanation text bellow
    const getCTAText = () => {
      switch (frequency) {
        case 'daily':
          return 'Lets go';
        case 'weekly':
          return 'Upload this weeks adventure';
        case 'monthly':
          return 'Submit monthly challenge';
        default:
          return 'Take a quick selfie to verify it\'s you';
      }
    };

  return (
    <div className="w-full flex flex-col items-center mb-10">
      <div className="bg-[#1A2734] rounded-xl p-6 w-full mb-6">
        <h3 className="text-center text-white text-lg mb-4">Ready to complete this challenge?</h3>
        <p className="text-center text-white mb-2">You'll need to:</p>
        <ol className="text-gray-300 list-decimal pl-8 mb-4">
          <li className="mb-2">{getDurationText()}</li>
          <li>{getSelfieText()}</li>
        </ol>
        <p className="text-center text-gray-400 mt-4">{getExplanationText()}</p>
      </div>
      
      <PrimaryButton
        onClick={onStartRecording}
        isActive={false}
        text={getCTAText()}
      />
    </div>
  );
};

export default IdleView;