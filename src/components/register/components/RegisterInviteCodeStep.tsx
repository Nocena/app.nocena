import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Control, Controller, ControllerRenderProps, useWatch, UseFormReset } from 'react-hook-form';
import PrimaryButton from '../../ui/PrimaryButton';
import NocenaCodeInputs from '../../form/NocenaCodeInput';
import XButton from '../../ui/XButton';

// Define FormValues interface here or import it
interface FormValues {
  username: string;
  inviteCode: string[];
  phoneNumber?: string;
  password?: string;
  verificationCode?: string[];
}

interface Props {
  control: Control<FormValues>;
  reset: UseFormReset<FormValues>;
  onValidCode: (code: string, ownerUsername?: string, ownerId?: string) => void;
  loading: boolean;
  error: string;
}

const RegisterInviteCodeStep = ({ control, reset, onValidCode, loading, error }: Props) => {
  const [shake, setShake] = useState(false);
  const [localError, setLocalError] = useState('');
  const [validationLoading, setValidationLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const invitationCode = useWatch({ name: 'inviteCode', control });

  // Focus first input on component mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Auto-validate when all 6 characters are entered
  useEffect(() => {
    if (invitationCode && invitationCode.every((c) => c) && invitationCode.length === 6) {
      validateCode(invitationCode);
    }
  }, [invitationCode]);

  const validateCode = async (codeArray: string[]) => {
    if (validationLoading || loading) return;

    setValidationLoading(true);
    setLocalError('');

    try {
      const codeString = codeArray.join('');
      
      // Accept "123456" as a valid code
      if (codeString === "123456") {
        // Add a slight delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Call success callback with mock invite info
        onValidCode(codeString, "demo_user", "demo_id");
        return;
      }

      // For other codes, make the API call (kept for when you want to revert to normal behavior)
      const response = await fetch('/api/registration/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: codeString }),
      });

      const data = await response.json();

      if (data.valid) {
        // Call success callback with invite info
        onValidCode(codeString, data.invite.ownerUsername, data.invite.ownerId);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        reset({ inviteCode: Array(6).fill('') });
        setLocalError('Invalid invite code. Please try again.');

        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err) {
      console.error('Error validating invite code:', err);
      
      // If the API call fails but the code is 123456, accept it anyway
      const codeString = codeArray.join('');
      if (codeString === "123456") {
        onValidCode(codeString, "demo_user", "demo_id");
        return;
      }
      
      setLocalError('Failed to validate code. Please try again.');
      reset({ inviteCode: Array(6).fill('') });

      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setValidationLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invitationCode && invitationCode.every((c) => c) && invitationCode.length === 6) {
      validateCode(invitationCode);
    }
  };

  // Use local error if available, otherwise use prop error
  const displayError = localError || error;
  const isCurrentlyLoading = loading || validationLoading;

  return (
    <>
      <div className={`flex justify-center mb-6 ${shake ? 'animate-shake' : ''}`}>
        <Controller
          name="inviteCode"
          control={control}
          render={({ field }: { field: ControllerRenderProps<FormValues, 'inviteCode'> }) => (
            <NocenaCodeInputs
              field={field}
              loading={isCurrentlyLoading}
              onValidateInvite={(code) => validateCode(code.split(''))}
              validationError={displayError}
            />
          )}
        />
      </div>

      {/* Loading indicator for validation */}
      {validationLoading && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2 text-nocenaBlue text-sm">
            <div className="w-4 h-4 border-2 border-nocenaBlue border-t-transparent rounded-full animate-spin"></div>
            <span>Validating invite code...</span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <PrimaryButton
          text={isCurrentlyLoading ? 'Verifying...' : 'Continue'}
          onClick={handleSubmit}
          disabled={!invitationCode || invitationCode.some((c) => !c) || isCurrentlyLoading}
          className="w-full"
        />
      </div>

      {/* Help text */}
      <div className="pt-10 flex items-center flex-col text-center">
        <XButton />

        <div className="text-center">
          <p className="text-sm mt-10">
            Already have an account?{' '}
            <Link href="/login" className="text-nocenaPink hover:text-nocenaPurple transition-colors">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default RegisterInviteCodeStep;