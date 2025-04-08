// components/RegisterInviteCodeStep.tsx

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Control, Controller, ControllerRenderProps, useWatch } from 'react-hook-form';
import { validateDiscordInviteCode } from '../../../lib/api/dgraph';
import PrimaryButton from '../../ui/PrimaryButton';
import DiscordLinkButton from '../../ui/DiscordLinkButton';
import NocenaCodeInputs from '../../form/NocenaCodeInput';
import { FormValues } from '../types';

interface Props {
  control: Control<FormValues, any>;
  reset: () => void;
  onValidCode: (code: string) => void;
}

const RegisterInviteCodeStep = ({ control, reset, onValidCode }: Props) => {
  const [shake, setShake] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const MAX_ATTEMPTS = 3;
  const SHORT_BLOCK_MINUTES = 30;
  const LONG_BLOCK_HOURS = 24;

  const invitationCode = useWatch({ name: `inviteCode`, control })

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

  useEffect(() => {
    if (invitationCode.every((c) => c) && invitationCode.length === 6) {
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

      setError(`Too many failed attempts. Please try again later.`);
    } else {
      saveRateLimitData(newAttempts);
      const remaining = MAX_ATTEMPTS - newAttempts;
      setError(`Invalid invite code. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    }
  };

  const validateCode = async (codeArray: string[]) => {
    if (loading || blocked) return;

    setLoading(true);
    setError('');

    try {
      const codeString = codeArray.join('');
      const isValid = await validateDiscordInviteCode(codeString);
      console.log('isValid', isValid);
      if (isValid) {
        // Reset rate limiting on success
        setAttempts(0);
        saveRateLimitData(0);

        onValidCode(codeString);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        reset();

        applyRateLimit();

        if (!blocked && inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to validate code. Please try again.');
      reset();

      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invitationCode.every((c) => c) && invitationCode.length === 6) {
      validateCode(invitationCode);
    }
  };

  return (
    <>
      {blocked ? (
        <div className="text-center p-6 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg w-full mb-6">
          <p className="text-lg mb-2">Too many failed attempts</p>
          <p>Please try again in {countdown}</p>
        </div>
      ) : (
        <>
          <div className={`flex justify-center mb-6 ${shake ? 'animate-shake' : ''}`}>
            <Controller
              name="inviteCode"
              control={control}
              render={({ field }: { field: ControllerRenderProps<FormValues, "inviteCode">; }) => (
                <NocenaCodeInputs field={field} />
              )}
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          <div className="mb-6">
            <PrimaryButton
              text={loading ? 'Verifying...' : 'Continue'}
              onClick={handleSubmit}
              disabled={invitationCode.some((c) => !c) || loading}
              className="w-full"
            />
          </div>
        </>
      )}

      <div className="mt-4 flex items-center flex-col text-center">
        <p className="text-gray-400 mb-3">
          Don't have an invite code? You can get one on our Discord server after completing short quiz in our
          invite-codes channel.
        </p>
        <DiscordLinkButton href="https://discord.gg/4xwXAB2zhp" text="Join our Discord" />
      </div>

      <div className="mt-6 text-center">
        Already have an account?
        <Link href="/login" className="ml-1 text-nocenaBlue cursor-pointer">
          Login
        </Link>
      </div>
    </>
  );
};

export default RegisterInviteCodeStep;
