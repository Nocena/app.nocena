import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Control, Controller, ControllerRenderProps, useWatch, UseFormReset } from 'react-hook-form';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';
import NocenaCodeInputs from '../../form/NocenaCodeInput';
import WaitlistButton from '../../ui/WaitlistButton';

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
          setBlocked(true);
          setBlockEndTime(new Date(data.blockUntil));
          setAttempts(data.attempts || 0);
        } else if (data.attempts) {
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
        setBlocked(false);
        setCountdown('');
        clearInterval(interval);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

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

      const previousBlock = localStorage.getItem('nocena_invite_previous_block');

      if (previousBlock) {
        blockUntil = new Date(now.getTime() + LONG_BLOCK_HOURS * 60 * 60 * 1000);
      } else {
        blockUntil = new Date(now.getTime() + SHORT_BLOCK_MINUTES * 60 * 1000);
        localStorage.setItem('nocena_invite_previous_block', 'true');
      }

      setBlocked(true);
      setBlockEndTime(blockUntil);
      saveRateLimitData(0, blockUntil);

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

      const response = await fetch('/api/registration/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: codeString }),
      });

      const data = await response.json();

      if (data.valid) {
        setAttempts(0);
        saveRateLimitData(0);
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

  const displayError = localError || error;
  const isCurrentlyLoading = loading || validationLoading;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {blocked ? (
        <ThematicContainer
          color="nocenaPink"
          glassmorphic={true}
          asButton={false}
          rounded="2xl"
          className="p-8 text-center"
        >
          <div className="w-16 h-16 bg-nocenaPink/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-nocenaPink/30">
            <div className="w-6 h-6 border-2 border-nocenaPink border-t-transparent rounded-full animate-spin" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Too Many Attempts</h3>
          <p className="text-sm text-gray-300 mb-4">Please wait before trying again</p>

          <div className="bg-black/30 rounded-xl p-4">
            <div className="text-lg font-bold text-nocenaPink">{countdown}</div>
            <div className="text-xs text-gray-400">remaining</div>
          </div>
        </ThematicContainer>
      ) : (
        <ThematicContainer color="nocenaBlue" glassmorphic={true} asButton={false} rounded="2xl" className="p-8">
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

          {/* Loading indicator */}
          {validationLoading && (
            <div className="flex justify-center items-center gap-2 mb-6">
              <div className="w-4 h-4 border-2 border-nocenaPink/50 border-t-nocenaPink rounded-full animate-spin" />
              <span className="text-sm text-gray-300">Validating...</span>
            </div>
          )}

          {/* Error message */}
          {displayError && (
            <div className="bg-nocenaPink/20 border border-nocenaPink/30 rounded-xl p-3 mb-6">
              <p className="text-nocenaPink text-sm text-center">{displayError}</p>
            </div>
          )}

          <PrimaryButton
            text={isCurrentlyLoading ? 'Verifying...' : 'Continue'}
            onClick={handleSubmit}
            disabled={!invitationCode || invitationCode.some((c) => !c) || isCurrentlyLoading}
            className="w-full"
            isActive={!isCurrentlyLoading && invitationCode && invitationCode.every((c) => c)}
          />
        </ThematicContainer>
      )}

      {/* X Button for getting invite code */}
      <div className="text-center">
        <WaitlistButton />
      </div>

      {/* Login link */}
      <div className="text-center">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-nocenaPink hover:text-nocenaPink/80 font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterInviteCodeStep;
