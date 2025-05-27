import { useState, useEffect, useCallback } from 'react';
import { registerUser, generateInviteCode } from '../lib/api/dgraph';
import { createPolygonWallet } from '../lib/api/polygon';
import { verifyPhoneNumber } from '../lib/utils/verification';
import { formatPhoneToE164 } from '../lib/utils/phoneUtils';
import { hashPassword } from '../lib/utils/passwordUtils';
import { User, useAuth } from '../contexts/AuthContext';
import AuthenticationLayout from '../components/layout/AuthenticationLayout';
import RegisterPhoneVerificationStep from '@components/register/components/RegisterPhoneVerificationStep';
import RegisterFormStep from '@components/register/components/RegisterFormStep';
import RegisterInviteCodeStep from '@components/register/components/RegisterInviteCodeStep';
import RegisterWelcomeStep from '@components/register/components/RegisterWelcomeStep';
import RegisterWalletCreationStep from '@components/register/components/RegisterWalletCreationStep';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { schema } from '@components/register/schema';
import { FormValues } from '@components/register/types';

const STEP_INVITE_CODE = 0;
const STEP_WELCOME = 1;
const STEP_REGISTER_FORM = 2;
const STEP_PHONE_VERIFICATION = 3;
const STEP_WALLET_CREATION = 4;

enum RegisterStep {
  INVITE_CODE,
  WELCOME,
  REGISTER_FORM,
  PHONE_VERIFICATION,
  WALLET_CREATION,
}

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(STEP_INVITE_CODE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [validatedInviteCode, setValidatedInviteCode] = useState('');
  const [inviteOwner, setInviteOwner] = useState('');
  const [invitedById, setInvitedById] = useState('');
  const { login } = useAuth();

  const registerSteps: { step: RegisterStep; title?: string; subtitle?: string; fields?: (keyof FormValues)[] }[] = [
    {
      step: RegisterStep.INVITE_CODE,
      title: 'Join the Challenge',
      subtitle: 'Enter your invite code to create your account',
      fields: ['inviteCode'],
    },
    {
      step: RegisterStep.WELCOME,
    },
    {
      step: RegisterStep.REGISTER_FORM,
      fields: ['username', 'phoneNumber', 'password'],
    },
    {
      step: RegisterStep.PHONE_VERIFICATION,
      title: 'Verify Your Phone',
      subtitle: 'We sent a verification code to {phoneNumber}',
    },
    {
      step: RegisterStep.WALLET_CREATION,
      title: 'Your Wallet Is Ready',
      subtitle: 'Save these details in a secure place',
    },
  ];

  // Handle welcome animation
  useEffect(() => {
    if (currentStep === STEP_WELCOME) {
      const timer = setTimeout(() => {
        setCurrentStep(STEP_REGISTER_FORM);
      }, 4000); // 4 seconds for welcome animation

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    trigger,
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      inviteCode: [],
      verificationCode: [],
    },
  });

  useEffect(() => {
    const currentValues = watch('inviteCode');
    if (!currentValues || currentValues.length !== 6) {
      reset((prev) => ({
        ...prev,
        inviteCode: Array(6).fill(''),
        verificationCode: Array(6).fill(''),
      }));
    }
  }, [reset, watch]);

  // Updated invite validation handler
  const handleValidInviteCode = async (code: string, ownerUsername?: string, ownerId?: string) => {
    try {
      setLoading(true);
      setError('');

      // Validate the invite code with the backend
      const response = await fetch('/api/registration/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await response.json();

      if (data.valid) {
        // Store invite information
        setValidatedInviteCode(code);
        setInviteOwner(data.invite.ownerUsername || 'Someone');
        setInvitedById(data.invite.ownerId || '');

        // Proceed to welcome step
        setCurrentStep(STEP_WELCOME);
      } else {
        setError(data.error || 'Invalid invite code');
      }
    } catch (err) {
      console.error('Error validating invite:', err);
      setError('Failed to validate invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setNextStep = async () => {
    const fields = registerSteps[currentStep].fields;
    if (fields) {
      const output = await trigger(fields, { shouldFocus: true });
      if (!output) return;
    }

    if (currentStep === STEP_REGISTER_FORM) {
      handleResendCode();
    }

    if (currentStep < registerSteps.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  const handleCompleteRegistration = async (
    data: FormValues,
    walletData?: {
      address: string;
      privateKey: string;
    },
  ) => {
    if (!walletData) {
      setError('Wallet creation failed. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // Securely hash the password
      const securePasswordHash = await hashPassword(data.password);

      // Format phone number to E.164 format before storing
      const formattedPhone = formatPhoneToE164(data.phoneNumber);

      // Register user with invite information
      const addedUser = await registerUser(
        data.username,
        formattedPhone,
        securePasswordHash,
        '/images/profile.png',
        walletData.address,
        '0'.repeat(365),
        '0'.repeat(52),
        '0'.repeat(12),
        validatedInviteCode, // Pass the validated invite code
        invitedById, // Pass the inviter's ID
      );

      if (addedUser) {
        // Create user data object
        const userData: User = {
          id: addedUser.id,
          username: data.username,
          phoneNumber: formattedPhone,
          wallet: walletData.address,
          bio: '',
          profilePicture: '/images/profile.png',
          earnedTokens: 50, // New users get 50 tokens
          dailyChallenge: '0'.repeat(365),
          weeklyChallenge: '0'.repeat(52),
          monthlyChallenge: '0'.repeat(12),
          followers: [],
          following: [],
          passwordHash: securePasswordHash,
          notifications: [],
          completedChallenges: [],
          receivedPrivateChallenges: [],
          createdPrivateChallenges: [],
          createdPublicChallenges: [],
          participatingPublicChallenges: [],
        };

        // Mark the invite code as used and award tokens
        await fetch('/api/registration/use-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: validatedInviteCode,
            newUserId: addedUser.id,
          }),
        });

        // Generate initial invite codes for the new user
        try {
          await generateInviteCode(addedUser.id, 'initial');
          await generateInviteCode(addedUser.id, 'initial');
        } catch (inviteError) {
          console.error('Error generating initial invite codes:', inviteError);
          // Don't fail registration if invite generation fails
        }

        await login(userData);
      } else {
        setError('Failed to register. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to register. Please try again.');
    }
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError('');

    try {
      const code = data.verificationCode.join('');
      const formattedPhone = formatPhoneToE164(data.phoneNumber);

      // Verify the code using Twilio
      const isValid = await verifyPhoneNumber(formattedPhone, 'VERIFY', code);

      if (isValid) {
        // Create wallet
        const newWallet = createPolygonWallet();
        setWallet(newWallet);
        await handleCompleteRegistration(data, newWallet);
        setCurrentStep(STEP_WALLET_CREATION);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formValues = watch();
  const handleResendCode = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhoneToE164(formValues.phoneNumber);

      // Resend verification code via Twilio
      const success = await verifyPhoneNumber(formattedPhone, 'SEND');

      if (!success) {
        setError('Failed to resend verification code. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formValues.phoneNumber]);

  // Update subtitle for welcome step to show invite owner
  const getStepSubtitle = (step: RegisterStep) => {
    if (step === RegisterStep.WELCOME && inviteOwner) {
      return `Welcome! You were invited by ${inviteOwner}`;
    }
    if (step === RegisterStep.PHONE_VERIFICATION) {
      return registerSteps[currentStep].subtitle?.replace('{phoneNumber}', formValues.phoneNumber);
    }
    return registerSteps[currentStep]?.subtitle;
  };

  return (
    <AuthenticationLayout
      title={registerSteps[currentStep]?.title}
      subtitle={getStepSubtitle(registerSteps[currentStep].step)}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
        {currentStep === STEP_INVITE_CODE ? (
          <RegisterInviteCodeStep
            control={control}
            onValidCode={handleValidInviteCode}
            reset={reset}
            loading={loading}
            error={error}
          />
        ) : null}

        {currentStep === STEP_WELCOME ? <RegisterWelcomeStep inviteOwner={inviteOwner} /> : null}

        {currentStep === STEP_REGISTER_FORM ? <RegisterFormStep setStep={setNextStep} control={control} /> : null}

        {currentStep === STEP_PHONE_VERIFICATION ? (
          <RegisterPhoneVerificationStep
            control={control}
            onResend={handleResendCode}
            loading={loading}
            customError={error}
          />
        ) : null}

        {currentStep === STEP_WALLET_CREATION && wallet ? <RegisterWalletCreationStep wallet={wallet} /> : null}
      </form>
    </AuthenticationLayout>
  );
};

export default RegisterPage;
