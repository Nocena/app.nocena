// pages/home/components/JourneyOnboarding.tsx - Fixed version
import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import VoiceAIChat from './AI'; // Import the VoiceAIChat component
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface JourneyOnboardingProps {
  onJourneyCreated: () => void; // Callback when journey creation is complete
}

// Create a wrapper component that handles the VoiceAIChat prop mismatch
const VoiceAIChatWrapper: React.FC<{ onPathSelect: (pathId: string) => void; userId: string }> = ({
  onPathSelect,
  userId,
}) => {
  // Use useEffect to handle localStorage side effect
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('currentUserId', userId);
    }
  }, [userId]);

  return (
    <div>
      <VoiceAIChat onPathSelect={onPathSelect} />
    </div>
  );
};

const JourneyOnboarding: React.FC<JourneyOnboardingProps> = ({ onJourneyCreated }) => {
  const { user } = useAuth();
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);

  const handlePathSelect = async (pathId: string) => {
    if (!user) {
      console.error('No user found during journey creation');
      return;
    }

    try {
      setIsCompletingSetup(true);
      console.log('Journey creation completed for path:', pathId);

      // The journey is already created by VoiceAIChat with proper targetUserId
      // No additional setup needed since we're using targetUserId filtering
      console.log('Journey setup complete, transitioning to home');

      // Clean up localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('currentUserId');
      }

      // Small delay to show completion state
      setTimeout(() => {
        onJourneyCreated();
      }, 1000);
    } catch (error) {
      console.error('Error completing journey setup:', error);
      setIsCompletingSetup(false);
    }
  };

  // Show completion state while transitioning
  if (isCompletingSetup) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

        <div className="relative z-10 text-center">
          <LoadingSpinner size="lg" />
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Setting up your journey...</h2>
            <p className="text-gray-300">Almost ready to start your first challenge!</p>
          </div>
        </div>
      </div>
    );
  }

  // Render the VoiceAIChat wrapper with user context
  if (!user) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <VoiceAIChatWrapper onPathSelect={handlePathSelect} userId={user.id} />;
};

export default JourneyOnboarding;
