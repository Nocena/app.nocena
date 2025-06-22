// components/register/components/RegisterFormStep.tsx
import { Control, useWatch, useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { NocenaInput } from '@components/form';
import PrimaryButton from '../../ui/PrimaryButton';
import {
  useLensUsernameCheck,
  validateLensUsername,
  generateUsernameSuggestions,
} from '../../../hooks/useLensIntegration';

type FormValues = {
  username: string;
  inviteCode: string[];
};

interface Props {
  control: Control<FormValues>;
  loading?: boolean;
  setStep: () => void;
}

interface ExistingAccount {
  username: string;
  fullHandle: string;
  profileId: string;
}

const RegisterFormStep = ({ control, loading, setStep }: Props) => {
  const [localValidation, setLocalValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: true, errors: [] });

  const [existingAccount, setExistingAccount] = useState<ExistingAccount | null>(null);
  const [checkingExistingAccount, setCheckingExistingAccount] = useState(true);

  // Get form context for setValue
  const { setValue } = useFormContext<FormValues>();

  // Get connected wallet from previous step
  const account = useActiveAccount();

  // Use the existing Lens integration hook
  const { isChecking, lastCheckResult, debouncedCheckUsername, checkWalletAccount } = useLensUsernameCheck(500);

  // Watch the username field
  const username = useWatch({
    control,
    name: 'username',
    defaultValue: '',
  });

  // Check for existing Lens account when component loads
  useEffect(() => {
    if (account?.address && checkingExistingAccount) {
      console.log('🔍 RegisterFormStep: Checking for existing Lens account...');

      checkWalletAccount(account.address)
        .then((result) => {
          console.log('📊 RegisterFormStep: Wallet check result:', result);

          if (result.hasAccount && result.account) {
            // User has an existing account - extract username info
            const existingData: ExistingAccount = {
              username: result.account.handle?.localName || 'unknown',
              fullHandle: result.account.handle?.fullHandle || 'lens/unknown',
              profileId: result.account.id,
            };

            setExistingAccount(existingData);
            // Pre-fill the username field and make it readonly
            setValue('username', existingData.username);

            console.log('✅ RegisterFormStep: Found existing account, pre-filled username');
          } else {
            console.log('ℹ️ RegisterFormStep: No existing account found, proceed with creation flow');
          }

          setCheckingExistingAccount(false);
        })
        .catch((error) => {
          console.error('💥 RegisterFormStep: Error checking wallet:', error);
          setCheckingExistingAccount(false);
        });
    }
  }, [account?.address, checkingExistingAccount, checkWalletAccount, setValue]);

  // Validate username when it changes (only if no existing account)
  useEffect(() => {
    if (existingAccount) return; // Skip validation if user has existing account

    const trimmedUsername = username?.trim();

    if (!trimmedUsername) {
      setLocalValidation({ isValid: true, errors: [] });
      return;
    }

    // Local validation first
    const validation = validateLensUsername(trimmedUsername);
    setLocalValidation(validation);

    // If locally valid, check on Lens Protocol
    if (validation.isValid) {
      debouncedCheckUsername(trimmedUsername);
    }
  }, [username, debouncedCheckUsername, existingAccount]);

  // Check if form is valid
  const isFormValid = Boolean(
    username && username.trim().length >= 3 && localValidation.isValid && !isChecking && !checkingExistingAccount,
  );

  // Apply suggested username
  const applySuggestion = (suggestion: string) => {
    if (!existingAccount) {
      // Only allow if no existing account
      setValue('username', suggestion);
    }
  };

  // Simple continue function - just validate and move on
  const handleContinue = () => {
    if (isFormValid) {
      setStep();
    }
  };

  // If checking for existing account, show loading
  if (checkingExistingAccount) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-400 font-semibold">Checking for existing Lens account...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success indicator for invite code */}
      <div className="bg-green-500/20 border border-green-500 rounded-xl p-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-green-400 font-semibold">Invite code verified!</span>
        </div>
      </div>

      {/* Existing account welcome message */}
      {existingAccount && (
        <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-blue-400 font-semibold text-sm mb-1">Welcome back!</h4>
              <p className="text-blue-300 text-xs leading-relaxed">
                Using your existing Lens account: <span className="font-medium">{existingAccount.fullHandle}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Username input */}
      <div className="bg-gray-800/50 rounded-[2rem] overflow-hidden border border-gray-600">
        <NocenaInput
          control={control}
          name="username"
          placeholder={existingAccount ? existingAccount.username : 'Choose your username'}
          required
          disabled={!!existingAccount}
        />
      </div>

      {/* Username Status - only show if no existing account */}
      {!existingAccount && (
        <UsernameStatusDisplay
          username={username}
          localValidation={localValidation}
          isChecking={isChecking}
          lastCheckResult={lastCheckResult}
          onApplySuggestion={applySuggestion}
        />
      )}

      {/* Helper text */}
      <div className="text-center">
        {existingAccount ? (
          <p className="text-gray-300 text-sm font-light">
            Your Lens account is already set up and ready to use in Nocena challenges
          </p>
        ) : (
          <>
            <p className="text-gray-300 text-sm font-light">
              Choose the name by which you want to be known in challenges
            </p>
            <div className="text-gray-400 text-xs mt-2 space-y-1">
              <p>• 3-20 characters • Letters, numbers, and underscores only</p>
              <p>• Must start with a letter • Cannot be changed later</p>
              <p>• We'll set up Lens Protocol integration after account creation</p>
            </div>
          </>
        )}
      </div>

      {/* Simple Continue Button */}
      <PrimaryButton
        text={loading ? 'Processing...' : 'Continue'}
        onClick={handleContinue}
        disabled={loading || !isFormValid}
        className="w-full"
      />

      {/* Info Cards - simplified */}
      <div className="space-y-4">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-1">Web3 Ready</h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                Your account will be compatible with Lens Protocol and other decentralized social networks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified Username Status Component
interface UsernameStatusProps {
  username: string;
  localValidation: { isValid: boolean; errors: string[] };
  isChecking: boolean;
  lastCheckResult: any;
  onApplySuggestion: (suggestion: string) => void;
}

const UsernameStatusDisplay = ({
  username,
  localValidation,
  isChecking,
  lastCheckResult,
  onApplySuggestion,
}: UsernameStatusProps) => {
  const trimmedUsername = username?.trim();

  if (!trimmedUsername || trimmedUsername.length < 3) {
    return null;
  }

  // Show local validation errors
  if (!localValidation.isValid) {
    return (
      <div className="space-y-1">
        {localValidation.errors.map((error, index) => (
          <div key={index} className="flex items-center space-x-2 text-red-400 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{error}</span>
          </div>
        ))}
      </div>
    );
  }

  // Show checking state
  if (isChecking) {
    return (
      <div className="flex items-center space-x-2 text-blue-400 text-sm">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Checking availability on Lens Protocol...</span>
      </div>
    );
  }

  // Show Lens check results
  if (lastCheckResult?.available) {
    return (
      <div className="flex items-center space-x-2 text-green-400 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>✨ Available on Lens Protocol</span>
      </div>
    );
  }

  if (lastCheckResult?.account) {
    const suggestions = lastCheckResult.suggestions || generateUsernameSuggestions(trimmedUsername);

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-orange-400 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
          <span>Username taken on Lens Protocol</span>
        </div>

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-300 mb-2">Try these suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion: string, index: number) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onApplySuggestion(suggestion)}
                  className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded-full transition-all hover:scale-105"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default RegisterFormStep;
