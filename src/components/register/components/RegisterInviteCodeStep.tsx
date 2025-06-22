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
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const [validationLoading, setValidationLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const MAX_ATTEMPTS = 3;
  const SHORT_BLOCK_MINUTES = 30;
  const LONG_BLOCK_HOURS = 24;

  const invitationCode = useWatch({ name: 'inviteCode', control });

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

  // Auto-validate when all 6 characters are entered
  useEffect(() => {
    if (invitationCode && invitationCode.every((c) => c) && invitationCode.length === 6) {
      validateCode(invitationCode);
    }
  }, [invitationCode]);

  const saveRateLimitData = (attempts: number, blockUntil: Date | null = null) => {
    try {
      localStorage.setItem(
        'nocena_invite_rate_limit',
        JSON.stringify({
          attempts,
          blockUntil: blockUntil ? blockUntil.toISOString() : null,
        }),
      );
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

      setLocalError(`Too many failed attempts. Please try again later.`);
    } else {
      saveRateLimitData(newAttempts);
      const remaining = MAX_ATTEMPTS - newAttempts;
      setLocalError(`Invalid invite code. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    }
  };

  const validateCode = async (codeArray: string[]) => {
    if (validationLoading || blocked || loading) return;

    setValidationLoading(true);
    setLocalError('');

    try {
      const codeString = codeArray.join('');

      // Call the new invite validation API
      const response = await fetch('/api/registration/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: codeString }),
      });

      const data = await response.json();

      if (data.valid) {
        // Reset rate limiting on success
        setAttempts(0);
        saveRateLimitData(0);

        // Call success callback with invite info
        onValidCode(codeString, data.invite.ownerUsername, data.invite.ownerId);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        reset({ inviteCode: Array(6).fill('') });

        applyRateLimit();

        if (!blocked && inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err) {
      console.error('Error validating invite code:', err);
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
      {blocked ? (
        <div className="text-center p-6 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg w-full mb-6">
          <p className="text-lg mb-2">Too many failed attempts</p>
          <p>Please try again in: {countdown}</p>
        </div>
      ) : (
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
        </>
      )}

      {/* Updated help text - removed Discord references */}
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
