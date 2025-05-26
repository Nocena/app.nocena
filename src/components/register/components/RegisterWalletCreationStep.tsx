import { useState } from 'react';
import { useRouter } from 'next/router';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';

interface Props {
  wallet: {
    address: string;
    privateKey: string;
  };
}

const RegisterWalletCreationStep = ({ wallet }: Props) => {
  const router = useRouter();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
  const [step, setStep] = useState(1);

  const copyToClipboard = (text: string, type: 'address' | 'privateKey') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedPrivateKey(true);
        setTimeout(() => setCopiedPrivateKey(false), 2000);
      }
    });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      router.push('/home');
    }
  };

  if (step === 1) {
    return (
      <div className="h-screen flex flex-col justify-center items-center px-6">
        <div className="text-center mb-12">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-nocenaBlue via-nocenaPurple to-nocenaPink rounded-full flex items-center justify-center animate-pulse">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-nocenaPink to-nocenaBlue rounded-full opacity-20 animate-ping"></div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            🎉 Amazing!
          </h1>
          <p className="text-lg text-gray-300 mb-2">
            You just created your first crypto wallet
          </p>
          <p className="text-sm text-gray-400">
            It's like getting a special account for earning rewards
          </p>
        </div>

        <div className="w-full">
          <PrimaryButton 
            text="Show me how it works →"
            onClick={handleNext}
            className="w-full text-lg py-4"
          />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="h-screen flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-nocenaBlue to-nocenaPink rounded-2xl flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Your Reward Account</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            This is where all your earned tokens from completing daily challenges will appear.<br/>
            <span className="text-nocenaPink">Think of it like your points balance in a game.</span>
          </p>
        </div>

        <ThematicContainer 
          color="nocenaBlue" 
          asButton={false} 
          glassmorphic={true} 
          rounded="xl"
          className="p-6 mb-8"
        >
          <div className="text-center">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-300">Your Account ID</span>
              <button
                onClick={() => wallet && copyToClipboard(wallet.address, 'address')}
                className={`text-xs px-3 py-1 rounded-full transition-all ${
                  copiedAddress 
                    ? 'bg-white text-nocenaBlue' 
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                {copiedAddress ? '✓ Copied' : 'Copy to Share'}
              </button>
            </div>
            
            <div className="bg-black bg-opacity-30 p-4 rounded-xl mb-4">
              <p className="text-xs font-mono text-white break-all leading-relaxed">
                {wallet?.address}
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
              <span>Safe to share • Others can send you tokens with this</span>
            </div>
          </div>
        </ThematicContainer>

        <PrimaryButton 
          text="Got it! What's next? →"
          onClick={handleNext}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col justify-center px-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-nocenaPink to-nocenaPurple rounded-2xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
            <circle cx="12" cy="16" r="1"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Your Secret Recovery Key</h2>
        <p className="text-gray-400 text-sm">
          This is like your master password - keep it super safe!
        </p>
      </div>

      <ThematicContainer 
        color="nocenaPink" 
        asButton={false} 
        glassmorphic={true} 
        rounded="xl"
        className="p-5 mb-6"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-white font-medium">Recovery Key</span>
          <button
            onClick={() => wallet && copyToClipboard(wallet.privateKey, 'privateKey')}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              copiedPrivateKey 
                ? 'bg-white text-nocenaPink' 
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            {copiedPrivateKey ? '✓ Saved' : 'Copy & Save'}
          </button>
        </div>
        
        <div className="bg-black bg-opacity-40 p-3 rounded-xl mb-3">
          <p className="text-xs font-mono text-white break-all leading-relaxed">
            {wallet?.privateKey}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-start space-x-2 text-xs text-gray-200">
            <span className="text-nocenaPink mt-0.5">🔒</span>
            <span>Copy this and save it somewhere safe (like in your notes app)</span>
          </div>
          <div className="flex items-start space-x-2 text-xs text-gray-200">
            <span className="text-nocenaPink mt-0.5">🚫</span>
            <span>Never share this with anyone - it's your account's master key</span>
          </div>
          <div className="flex items-start space-x-2 text-xs text-gray-200">
            <span className="text-nocenaPink mt-0.5">⚡</span>
            <span>You'll only see this once, so save it now!</span>
          </div>
        </div>
      </ThematicContainer>

      <div className="space-y-3">
        <PrimaryButton 
          text="I've saved it safely - Let's go! 🚀"
          onClick={handleNext}
          className="w-full"
        />
        <p className="text-center text-xs text-gray-500">
          Ready to start your first challenge and earn some tokens?
        </p>
      </div>
    </div>
  );
};

export default RegisterWalletCreationStep;