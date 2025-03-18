// components/InviteCodeInput.tsx

import React, { useState, useRef, useEffect } from 'react';
import { validateDiscordInviteCode } from '../lib/api/dgraph';
import { useRouter } from 'next/router';
import PrimaryButton from './ui/PrimaryButton';

interface InviteCodeInputProps {
  onValidCode: (code: string) => void;
}

const InviteCodeInput: React.FC<InviteCodeInputProps> = ({ onValidCode }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  
  const MAX_ATTEMPTS = 3;
  const SHORT_BLOCK_MINUTES = 30;
  const LONG_BLOCK_HOURS = 24;

  // Load previous rate limit data from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('nocena_invite_rate_limit');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.blockUntil && new Date(data.blockUntil) > new Date()) {
          // Still blocked
          setBlocked(true);
          setBlockEndTime(new Date(data.blockUntil));
          setAttempts(data.attempts || 0);
        } else if (data.attempts) {
          // Not blocked but has previous attempts
          setAttempts(data.attempts);
        }
      } catch (e) {
        console.error('Error parsing rate limit data:', e);
      }
    }
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!blocked || !blockEndTime) return;

    const updateCountdown = () => {
      const now = new Date();
      if (blockEndTime && now < blockEndTime) {
        const diffMs = blockEndTime.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHrs > 0) {
          setCountdown(`${diffHrs}h ${diffMins}m`);
        } else {
          setCountdown(`${diffMins}m`);
        }
      } else {
        // Block expired
        setBlocked(false);
        setCountdown('');
        clearInterval(interval);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [blocked, blockEndTime]);

  // Focus first input on component mount (if not blocked)
  useEffect(() => {
    if (!blocked && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [blocked]);

  const saveRateLimitData = (attempts: number, blockUntil: Date | null = null) => {
    try {
      localStorage.setItem('nocena_invite_rate_limit', JSON.stringify({
        attempts,
        blockUntil: blockUntil ? blockUntil.toISOString() : null
      }));
    } catch (e) {
      console.error('Error saving rate limit data:', e);
    }
  };

  const applyRateLimit = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      const now = new Date();
      let blockUntil;
      
      // Check if this is the first time being blocked or a repeat
      const previousBlock = localStorage.getItem('nocena_invite_previous_block');
      
      if (previousBlock) {
        // Longer block for repeat offenders
        blockUntil = new Date(now.getTime() + LONG_BLOCK_HOURS * 60 * 60 * 1000);
      } else {
        // First block is shorter
        blockUntil = new Date(now.getTime() + SHORT_BLOCK_MINUTES * 60 * 1000);
        // Mark that they've been blocked before
        localStorage.setItem('nocena_invite_previous_block', 'true');
      }
      
      setBlocked(true);
      setBlockEndTime(blockUntil);
      saveRateLimitData(0, blockUntil); // Reset attempts counter but set block
      
      setError(`Too many failed attempts. Please try again later.`);
    } else {
      saveRateLimitData(newAttempts);
      const remaining = MAX_ATTEMPTS - newAttempts;
      setError(`Invalid invite code. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    }
  };

  const handleChange = (value: string, index: number) => {
    // Only allow alphanumeric characters and auto-uppercase
    const newValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Update code array
    const newCode = [...code];
    newCode[index] = newValue;
    setCode(newCode);
    
    // Auto-advance to next input
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Check if all fields are filled
    if (index === 5 && newValue && newCode.every(c => c)) {
      validateCode(newCode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Navigate to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    if (pastedText) {
      const newCode = [...code];
      for (let i = 0; i < Math.min(pastedText.length, 6); i++) {
        newCode[i] = pastedText[i];
      }
      setCode(newCode);
      
      // Focus the field after the pasted content
      const lastIndex = Math.min(pastedText.length, 5);
      inputRefs.current[lastIndex]?.focus();
      
      // Validate if all fields are filled
      if (newCode.every(c => c) && newCode.length === 6) {
        validateCode(newCode);
      }
    }
  };

  const validateCode = async (codeArray: string[]) => {
    if (loading || blocked) return;
    if (codeArray.some(c => !c)) return;

    setLoading(true);
    setError('');
    
    try {
      const codeString = codeArray.join('');
      const isValid = await validateDiscordInviteCode(codeString);
      
      if (isValid) {
        // Reset rate limiting on success
        setAttempts(0);
        saveRateLimitData(0);
        
        onValidCode(codeString);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setCode(['', '', '', '', '', '']);
        
        applyRateLimit();
        
        if (!blocked && inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to validate code. Please try again.');
      setCode(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.every(c => c)) {
      validateCode(code);
    }
  };

  const openDiscord = () => {
    window.open('https://discord.gg/4xwXAB2zhp', '_blank');
  };

  const handleShowLoginPage = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col items-center max-w-md w-full px-4">
      <img src="/logo/eyes.png" alt="Nocena Logo" className="w-64 mb-20" />
      <h2 className="text-2xl font-bold mb-2 text-center">Join the Challenge</h2>
      <p className="text-gray-300 mb-8 text-center">Enter your invite code to create your account</p>
      
      {blocked ? (
        <div className="text-center p-6 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg w-full mb-6">
          <p className="text-lg mb-2">Too many failed attempts</p>
          <p>Please try again in {countdown}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full">
          <div className={`flex justify-center mb-6 ${shake ? 'animate-shake' : ''}`}>
            {code.map((char, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                maxLength={1}
                value={char}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-12 h-12 m-1 text-2xl text-center bg-gray-800 border focus:outline-none focus:ring-2 focus:ring-opacity-50 rounded-lg
                  ${index < 3 
                    ? 'text-nocenaPink border-nocenaPink focus:ring-nocenaPink' 
                    : 'text-nocenaBlue border-nocenaBlue focus:ring-nocenaBlue'
                  }
                  ${index === 2 ? 'mr-4' : ''}
                `}
                disabled={loading}
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          <div className="mb-6">
            <PrimaryButton 
              text={loading ? "Verifying..." : "Continue"} 
              onClick={handleSubmit}
              disabled={code.some(c => !c) || loading}
              className="w-full"
            />
          </div>
        </form>
      )}

      <div className="mt-4 text-center">
        <p className="text-gray-400 mb-3">Don't have an invite code? You can get one on our Discord server after completing short quiz in our invite-codes channel.</p>
        <div className="flex justify-center">
          <button 
            onClick={openDiscord}
            className="flex items-center justify-center bg-[#5865F2] hover:bg-[#4752C4] text-white py-2 px-4 rounded-2xl transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" />
            </svg>
            Join our Discord
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p>
          Already have an account?{' '}
          <a onClick={handleShowLoginPage} className="text-nocenaBlue cursor-pointer">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default InviteCodeInput;