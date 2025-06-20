import React, { useEffect, useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';

interface Props {
  inviteOwner?: string;
  setStep: () => void;
}

const RegisterWelcomeStep: React.FC<Props> = ({ setStep, inviteOwner }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useAccount();

  // Handle welcome animation
  useEffect(() => {
    if (isConnected) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setStep();
      }, 4000); // 4 seconds for welcome animation

      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  return (
    <div className="max-w-md text-center space-y-6">
      {/* Main welcome message */}
      <div>
        <h1 className="text-3xl font-semibold mb-4">Welcome to the challenge</h1>
        <p className="text-lg text-gray-300">Get ready to earn while exploring...</p>
      </div>

      {/* Personalized invite message */}
      {inviteOwner && (
        <div className="bg-nocenaBlue/10 border border-nocenaBlue/30 rounded-2xl p-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-nocenaBlue to-nocenaPurple rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <span className="text-nocenaBlue font-medium">Invited by</span>
          </div>
          <p className="text-white text-lg font-semibold">{inviteOwner}</p>
          <p className="text-white/60 text-sm mt-1">You both will earn 50 Nocenix tokens!</p>
        </div>
      )}

      {/* Loading animation elements */}
      {isLoading && (
        <div className="flex justify-center space-x-2 mt-8">
          <div className="w-2 h-2 bg-nocenaBlue rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-nocenaPurple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-nocenaPink rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}

      {/* Additional welcome info */}
      <div className="flex justify-center mt-8">
        {/*<p>Setting up your account...</p>*/}
        <ConnectKitButton label="Connect Wallet" mode="dark" />
      </div>
    </div>
  );
};

export default RegisterWelcomeStep;
