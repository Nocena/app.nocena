import { useState } from 'react';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';

interface Props {
  wallet: {
    address: string;
    privateKey: string;
  };
  onNext: () => void;
}

const RegisterWalletCreationStep = ({ wallet, onNext }: Props) => {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 3000);
    });
  };

  const handleNext = () => {
    if (!showPrivateKey) {
      setShowPrivateKey(true);
      return;
    }
    
    if (showPrivateKey && !keySaved) {
      alert('Please copy and save your recovery key before continuing');
      return;
    }
    
    onNext();
  };

  return (
    <div className="flex flex-col px-6 py-8">
      <div className="text-center mb-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-2xl animate-pulse opacity-20"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white border-opacity-10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
              <path d="M3 12c0 9 9 9 9 9s9 0 9-9" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Reward Wallet Created!</h2>
        <p className="text-gray-400 text-sm font-light">Your secure wallet has been automatically generated</p>
      </div>

      <div className="space-y-4 mb-8">
        <ThematicContainer color="nocenaBlue" asButton={false} glassmorphic={true} rounded="xl" className="p-5 border border-white border-opacity-5">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2 text-sm tracking-wide">REWARD ADDRESS</h3>
              <p className="text-gray-300 text-xs mb-3 font-light">Where your tokens will be sent</p>
              <div className="bg-black bg-opacity-50 p-3 rounded-lg border border-gray-700 border-opacity-50">
                <p className="text-xs font-mono text-white break-all leading-relaxed">{wallet?.address}</p>
              </div>
            </div>
          </div>
        </ThematicContainer>

        {showPrivateKey && (
          <ThematicContainer color="nocenaPink" asButton={false} glassmorphic={true} rounded="xl" className="p-5 border border-red-500 border-opacity-20">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                  <circle cx="12" cy="16" r="1" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2 text-sm tracking-wide">RECOVERY KEY</h3>
                <p className="text-gray-300 text-xs mb-3 font-light">Important: Save this to recover your wallet if needed</p>
                <div className="bg-black bg-opacity-60 p-3 rounded-lg border border-gray-700 border-opacity-50 mb-4">
                  <p className="text-xs font-mono text-white break-all leading-relaxed">{wallet?.privateKey}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(wallet?.privateKey || '')}
                  className={`w-full py-3 px-4 rounded-lg text-xs font-medium transition-all duration-300 ${
                    keySaved 
                      ? 'bg-emerald-500 text-white shadow-lg' 
                      : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20 border border-white border-opacity-20'
                  }`}
                >
                  {keySaved ? 'COPIED TO CLIPBOARD ✓' : 'COPY RECOVERY KEY'}
                </button>
              </div>
            </div>
          </ThematicContainer>
        )}
      </div>

      {!showPrivateKey && (
        <ThematicContainer color="nocenaPink" asButton={false} glassmorphic={true} rounded="xl" className="p-4 mb-6 border border-amber-500 border-opacity-20">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="text-xs text-amber-200 font-light leading-relaxed">
              <p className="font-medium mb-1 text-amber-100 tracking-wide">IMPORTANT SECURITY STEP</p>
              <p>Next, we'll show you a recovery key. Please save it somewhere safe - it's the only way to recover your wallet if you lose access to your account.</p>
            </div>
          </div>
        </ThematicContainer>
      )}

      <PrimaryButton 
        text={showPrivateKey ? (keySaved ? "CONTINUE SETUP" : "SAVE RECOVERY KEY FIRST") : "SHOW RECOVERY KEY"} 
        onClick={handleNext}
        className="w-full"
        disabled={showPrivateKey && !keySaved}
      />
    </div>
  );
};

export default RegisterWalletCreationStep;
