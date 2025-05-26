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
  const type = challengeParams?.type || 'AI';

  // Define recording duration text based on challenge type and frequency
  const getDurationText = () => {
    if (type === 'PUBLIC') {
      return 'Record a 30-second video showing your completion of this location challenge';
    } else if (type === 'PRIVATE') {
      return 'Record a 30-second video showing your completion of this private challenge';
    }
    
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

  // Define selfie requirement text based on challenge type
  const getSelfieText = () => {
    if (type === 'PUBLIC') {
      return "Take a selfie at this location to verify you're actually there";
    } else if (type === 'PRIVATE') {
      return "Take a selfie to verify it's you completing this private challenge";
    }
    return "Take a quick selfie to verify it's you";
  };

  // Explanation text below
  const getExplanationText = () => {
    if (type === 'PUBLIC') {
      return "You need to be physically at this location to complete the challenge. Make sure your GPS is enabled and you're at the exact spot!";
    } else if (type === 'PRIVATE') {
      return "This private challenge was created for a select group. Complete it to earn rewards and show your progress!";
    }
    
    switch (frequency) {
      case 'daily':
        return "You need to record completing this in the moment, so make sure you're looking great and your camera is ready!";
      case 'weekly':
        return 'Weekly challenges are more complex so you should create a better submission documenting your journey.';
      case 'monthly':
        return 'Monthly challenges are the longest challenges you can make here - so let your creativity grab the wheel!';
      default:
        return "Take a quick selfie to verify it's you";
    }
  };

  // CTA button text
  const getCTAText = () => {
    if (type === 'PUBLIC') {
      return 'Complete Location Challenge';
    } else if (type === 'PRIVATE') {
      return 'Complete Private Challenge';
    }
    
    switch (frequency) {
      case 'daily':
        return 'Let\'s Go';
      case 'weekly':
        return 'Upload This Week\'s Adventure';
      case 'monthly':
        return 'Submit Monthly Challenge';
      default:
        return "Let's Go";
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

      <PrimaryButton onClick={onStartRecording} isActive={false} text={getCTAText()} />
    </div>
  );
};

export default IdleView;