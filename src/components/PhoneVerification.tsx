/**
 * @deprecated
 */

import React, { useState, useRef } from 'react';
import PrimaryButton from './ui/PrimaryButton';
import Image from 'next/image';

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerify: (code: string) => void;
  onResend: () => void;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({ phoneNumber, onVerify, onResend }) => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null, null, null]);

  const handleChange = (value: string, index: number) => {
    // Only allow numbers
    const newValue = value.replace(/[^0-9]/g, '');

    // Update code array
    const newCode = [...verificationCode];
    newCode[index] = newValue;
    setVerificationCode(newCode);

    // Auto-advance to next input
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Navigate to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/[^0-9]/g, '');

    if (pastedText) {
      const newCode = [...verificationCode];
      for (let i = 0; i < Math.min(pastedText.length, 6); i++) {
        newCode[i] = pastedText[i];
      }
      setVerificationCode(newCode);

      // Focus the field after the pasted content
      const lastIndex = Math.min(pastedText.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.every((c) => c)) {
      setLoading(true);
      setError('');

      try {
        const code = verificationCode.join('');
        onVerify(code);
      } catch (err) {
        console.error(err);
        setError('Failed to verify code. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } else {
      setError('Please enter all 6 digits of the verification code');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-md w-full px-4">
      <div className="w-64 mb-20 relative">
        <Image src="/logo/horizontal.png" alt="Nocena Logo" width={256} height={256} priority />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-center">Verify Your Phone</h2>
      <p className="text-gray-300 mb-8 text-center">We sent a verification code to {phoneNumber}</p>

      <form onSubmit={handleSubmit} className="w-full">
        <div className={`flex justify-center mb-6 ${shake ? 'animate-shake' : ''}`}>
          {verificationCode.map((char, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={char}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`w-12 h-12 m-1 text-2xl text-center bg-gray-800 border focus:outline-none focus:ring-2 focus:ring-opacity-50 rounded-lg
                ${
                  index < 3
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
            text={loading ? 'Verifying...' : 'Verify'}
            onClick={handleSubmit}
            disabled={verificationCode.some((c) => !c) || loading}
            className="w-full"
          />
        </div>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-400 mb-3">Didn't receive the code?</p>
        <button onClick={onResend} className="text-nocenaBlue hover:text-white transition-colors">
          Resend verification code
        </button>
      </div>
    </div>
  );
};

export default PhoneVerification;
