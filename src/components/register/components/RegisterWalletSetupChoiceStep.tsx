import { useState } from 'react';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';

interface Props {
  onChoice: (choice: 'new' | 'existing') => void;
}

const RegisterWalletSetupChoiceStep = ({ onChoice }: Props) => {
  const [selectedChoice, setSelectedChoice] = useState<'new' | 'existing' | null>(null);

  const handleContinue = () => {
    if (selectedChoice) {
      onChoice(selectedChoice);
    }
  };

  return (
    <div className="flex flex-col px-6 py-8">
      <div className="text-center mb-10">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-2xl animate-pulse opacity-20"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white border-opacity-10 shadow-xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Reward Wallet Setup</h2>
        <p className="text-gray-400 text-sm font-light leading-relaxed max-w-xs mx-auto">
          Choose how you'd like to set up your reward system
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <ThematicContainer
          color={selectedChoice === 'new' ? 'nocenaPink' : 'nocenaBlue'}
          asButton={true}
          glassmorphic={true}
          rounded="xl"
          className={`p-6 transition-all duration-300 border ${
            selectedChoice === 'new'
              ? 'border-pink-400 border-opacity-50 scale-105 shadow-xl'
              : 'border-white border-opacity-5 hover:scale-[1.02]'
          }`}
          onClick={() => setSelectedChoice('new')}
        >
          <div className="flex items-start space-x-5">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold text-base mb-2 tracking-wide">Automatic Setup</h3>
              <p className="text-gray-300 text-sm font-light leading-relaxed mb-3">
                We'll create everything for you automatically. No crypto knowledge needed - just start earning!
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <span className="text-xs text-emerald-400 font-medium tracking-wide">RECOMMENDED FOR BEGINNERS</span>
              </div>
            </div>
            {selectedChoice === 'new' && (
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
            )}
          </div>
        </ThematicContainer>

        <ThematicContainer
          color={selectedChoice === 'existing' ? 'nocenaPink' : 'nocenaPurple'}
          asButton={true}
          glassmorphic={true}
          rounded="xl"
          className={`p-6 transition-all duration-300 border ${
            selectedChoice === 'existing'
              ? 'border-pink-400 border-opacity-50 scale-105 shadow-xl'
              : 'border-white border-opacity-5 hover:scale-[1.02]'
          }`}
          onClick={() => setSelectedChoice('existing')}
        >
          <div className="flex items-start space-x-5">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold text-base mb-2 tracking-wide">Connect Existing Wallet</h3>
              <p className="text-gray-300 text-sm font-light leading-relaxed mb-3">
                Already have a crypto wallet? Connect it to import your identity and receive rewards there.
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-xs text-purple-400 font-medium tracking-wide">FOR CRYPTO USERS</span>
              </div>
            </div>
            {selectedChoice === 'existing' && (
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
            )}
          </div>
        </ThematicContainer>
      </div>

      <ThematicContainer
        color="nocenaBlue"
        asButton={false}
        glassmorphic={true}
        rounded="xl"
        className="p-4 mb-8 border border-blue-500 border-opacity-20"
      >
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="text-xs text-blue-200 font-light leading-relaxed">
            <p className="font-medium mb-1 text-blue-100">Safe & Secure</p>
            <p>Your rewards are stored on the Polygon blockchain, ensuring they're always yours and can't be lost.</p>
          </div>
        </div>
      </ThematicContainer>

      <PrimaryButton
        text={selectedChoice ? 'CONTINUE SETUP' : 'CHOOSE AN OPTION'}
        onClick={handleContinue}
        className="w-full"
        disabled={!selectedChoice}
      />
    </div>
  );
};

export default RegisterWalletSetupChoiceStep;
