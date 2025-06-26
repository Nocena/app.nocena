// components/register/components/RegisterFormStep.tsx
import { Control, useWatch, useFormContext } from 'react-hook-form';
import { useEffect, useState, useCallback } from 'react';
import { NocenaInput } from '@components/form';
import PrimaryButton from '../../ui/PrimaryButton';

type FormValues = {
  username: string;
  inviteCode: string[];
};

interface Props {
  control: Control<FormValues>;
  loading?: boolean;
  setStep: () => void;
}

const RegisterFormStep = ({ control, loading, setStep }: Props) => {
  const [localValidation, setLocalValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: true, errors: [] });

  // Database username checking state
  const [isCheckingDbUsername, setIsCheckingDbUsername] = useState(false);
  const [dbUsernameError, setDbUsernameError] = useState<string | null>(null);
  const [dbCheckTimeout, setDbCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get form context for setValue
  const { setValue } = useFormContext<FormValues>();

  // Watch the username field
  const username = useWatch({
    control,
    name: 'username',
    defaultValue: '',
  });

  // Simple local username validation
  const validateUsername = (username: string) => {
    const errors: string[] = [];
    
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (username.length > 20) {
      errors.push('Username must be 20 characters or less');
    }
    
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
      errors.push('Username must start with a letter and contain only letters, numbers, and underscores');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Function to check username in database
  const checkUsernameInDatabase = useCallback(async (usernameToCheck: string): Promise<boolean> => {
    try {
      console.log('🔍 [FRONTEND] Checking username in database:', usernameToCheck);
      
      const response = await fetch('/api/registration/checkUsername', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameToCheck }),
      });

      console.log('🔍 [FRONTEND] Username check response:', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 [FRONTEND] Username check failed:', errorText);
        throw new Error(`Failed to check username: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 [FRONTEND] Username check result:', data);
      return data.exists;
    } catch (error) {
      console.error('🔍 [FRONTEND] Error checking username:', error);
      throw error;
    }
  }, []);

  // Validate username when it changes
  useEffect(() => {
    const trimmedUsername = username?.trim();

    if (!trimmedUsername) {
      setLocalValidation({ isValid: true, errors: [] });
      setDbUsernameError(null);
      // Clear any pending database check
      if (dbCheckTimeout) {
        clearTimeout(dbCheckTimeout);
        setDbCheckTimeout(null);
      }
      return;
    }

    // Local validation first
    const validation = validateUsername(trimmedUsername);
    setLocalValidation(validation);

    // If locally valid, check database with debouncing
    if (validation.isValid) {
      // Clear previous timeout
      if (dbCheckTimeout) {
        clearTimeout(dbCheckTimeout);
      }

      const newTimeout = setTimeout(async () => {
        if (trimmedUsername.length >= 3) {
          setIsCheckingDbUsername(true);
          setDbUsernameError(null);

          try {
            const exists = await checkUsernameInDatabase(trimmedUsername);
            if (exists) {
              setDbUsernameError(`Username "${trimmedUsername}" is already taken. Please choose a different name.`);
            } else {
              setDbUsernameError(null);
            }
          } catch (error) {
            console.error('Error checking username in database:', error);
            setDbUsernameError('Failed to verify username availability. Please try again.');
          } finally {
            setIsCheckingDbUsername(false);
          }
        }
      }, 800);

      setDbCheckTimeout(newTimeout);
    } else {
      // Clear database check if local validation fails
      setDbUsernameError(null);
      if (dbCheckTimeout) {
        clearTimeout(dbCheckTimeout);
        setDbCheckTimeout(null);
      }
    }
  }, [username, checkUsernameInDatabase]); // Removed dbCheckTimeout from dependencies

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dbCheckTimeout) {
        clearTimeout(dbCheckTimeout);
      }
    };
  }, [dbCheckTimeout]);

  // Check if form is valid
  const isFormValid = Boolean(
    username && 
    username.trim().length >= 3 && 
    localValidation.isValid && 
    !isCheckingDbUsername &&
    !dbUsernameError
  );

  // Simple continue function - just validate and move on
  const handleContinue = () => {
    if (isFormValid) {
      setStep();
    }
  };

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

      {/* Username input */}
      <div className="bg-gray-800/50 rounded-[2rem] overflow-hidden border border-gray-600">
        <NocenaInput
          control={control}
          name="username"
          placeholder="Choose your username"
          required
        />
      </div>

      {/* Username Status */}
      <UsernameStatusDisplay
        username={username}
        localValidation={localValidation}
        isCheckingDbUsername={isCheckingDbUsername}
        dbUsernameError={dbUsernameError}
      />

      {/* Helper text */}
      <div className="text-center">
        <p className="text-gray-300 text-sm font-light">
          Choose the name by which you want to be known in challenges
        </p>
        <div className="text-gray-400 text-xs mt-2 space-y-1">
          <p>• 3-20 characters • Letters, numbers, and underscores only</p>
          <p>• Must start with a letter • Cannot be changed later</p>
        </div>
      </div>

      {/* Continue Button */}
      <PrimaryButton
        text={loading ? 'Processing...' : 'Continue'}
        onClick={handleContinue}
        disabled={loading || !isFormValid}
        className="w-full"
      />

      {/* Info Cards */}
      <div className="space-y-4">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
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
              <h4 className="text-white font-semibold text-sm mb-1">Unique Identity</h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                Your username will be unique across the entire Nocena platform.
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
  isCheckingDbUsername: boolean;
  dbUsernameError: string | null;
}

const UsernameStatusDisplay = ({
  username,
  localValidation,
  isCheckingDbUsername,
  dbUsernameError,
}: UsernameStatusProps) => {
  const trimmedUsername = username?.trim();

  if (!trimmedUsername || trimmedUsername.length < 3) {
    return null;
  }

  // Show local validation errors first
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

  // Show database username error
  if (dbUsernameError) {
    return (
      <div className="flex items-start space-x-2 text-red-400 text-sm">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>{dbUsernameError}</span>
      </div>
    );
  }

  // Show checking state
  if (isCheckingDbUsername) {
    return (
      <div className="flex items-center space-x-2 text-blue-400 text-sm">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Checking username availability...</span>
      </div>
    );
  }

  // Show success when all checks pass
  if (!isCheckingDbUsername && !dbUsernameError) {
    return (
      <div className="flex items-center space-x-2 text-green-400 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>✨ Username is available</span>
      </div>
    );
  }

  return null;
};

export default RegisterFormStep;
