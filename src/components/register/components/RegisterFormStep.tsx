// components/register/components/RegisterFormStep.tsx
import { Control, useWatch, useFormContext } from 'react-hook-form';
import { useEffect, useState, useCallback } from 'react';
import { NocenaInput } from '@components/form';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';

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
      errors,
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
  }, [username, checkUsernameInDatabase]);

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
    username && username.trim().length >= 3 && localValidation.isValid && !isCheckingDbUsername && !dbUsernameError,
  );

  // Simple continue function - just validate and move on
  const handleContinue = () => {
    if (isFormValid) {
      setStep();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <ThematicContainer color="nocenaBlue" glassmorphic={true} asButton={false} rounded="2xl" className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-gray-300 text-base">Choose your username</p>
        </div>

        {/* Username Input */}
        <div className="mb-6">
          <div className="bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/50">
            <NocenaInput control={control} name="username" placeholder="Choose your username" required />
          </div>
        </div>

        {/* Username Status */}
        <div className="mb-6">
          <UsernameStatusDisplay
            username={username}
            localValidation={localValidation}
            isCheckingDbUsername={isCheckingDbUsername}
            dbUsernameError={dbUsernameError}
          />
        </div>

        {/* Helper Text */}
        <div className="text-center mb-8">
          <div className="text-gray-400 text-xs space-y-1">
            <p>3-20 characters</p>
            <p>Letters, numbers and underscores only</p>
            <p>Must start with a letter</p>
            <p>Cannot be changed later</p>
          </div>
        </div>

        {/* Continue Button */}
        <PrimaryButton
          text={loading ? 'Processing...' : 'Continue'}
          onClick={handleContinue}
          disabled={loading || !isFormValid}
          className="w-full"
        />
      </ThematicContainer>
    </div>
  );
};

// Clean Username Status Component
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
      <div className="space-y-2">
        {localValidation.errors.map((error, index) => (
          <p key={index} className="text-red-400 text-sm text-center">
            {error}
          </p>
        ))}
      </div>
    );
  }

  // Show database username error
  if (dbUsernameError) {
    return <p className="text-red-400 text-sm text-center">{dbUsernameError}</p>;
  }

  // Show checking state
  if (isCheckingDbUsername) {
    return (
      <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-blue-400 text-sm">Checking username availability...</span>
      </div>
    );
  }

  // Show success when all checks pass
  if (!isCheckingDbUsername && !dbUsernameError) {
    return <p className="text-green-400 text-sm text-center">Username is available</p>;
  }

  return null;
};

export default RegisterFormStep;
