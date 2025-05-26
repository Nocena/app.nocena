import { useState, useEffect, useCallback } from 'react';
import { registerUser, markDiscordInviteAsUsed } from '../lib/api/dgraph';
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
  console.log('errors', errors);

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
      // Securely hash the password - the salt will be generated automatically
      const securePasswordHash = await hashPassword(data.password);

      // Format phone number to E.164 format before storing
      const formattedPhone = formatPhoneToE164(data.phoneNumber);

      // Register user with properly formatted phone number and secure password hash
      const addedUser = await registerUser(
        data.username,
        formattedPhone,
        securePasswordHash, // Securely hashed password
        '/images/profile.png',
        walletData.address,
        '0'.repeat(365),
        '0'.repeat(52),
        '0'.repeat(12),
      );

      if (addedUser) {
        // Create user data object with formatted phoneNumber
        const userData: User = {
          id: addedUser.id,
          username: data.username,
          phoneNumber: formattedPhone,
          wallet: walletData.address,
          bio: '',
          profilePicture: '/images/profile.png',
          earnedTokens: 0,
          dailyChallenge: '0'.repeat(365),
          weeklyChallenge: '0'.repeat(52),
          monthlyChallenge: '0'.repeat(12),
          followers: [],
          following: [],
          passwordHash: securePasswordHash,
          notifications: [],
          completedChallenges: [],
          // Remove upcomingChallenges and add the new fields from our updated User type
          receivedPrivateChallenges: [],
          createdPrivateChallenges: [],
          createdPublicChallenges: [],
          participatingPublicChallenges: []
        };

        // Mark the invite code as used
        await markDiscordInviteAsUsed(data.inviteCode.join(''), addedUser.id);

        await login(userData);
      } else {
        setError('Failed to register. Please try again.');
      }
    } catch (err) {
      console.error(err);
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
        handleCompleteRegistration(data, newWallet);
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

  return (
    <AuthenticationLayout title={registerSteps[currentStep]?.title} subtitle={registerSteps[currentStep].subtitle}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
        {currentStep === STEP_INVITE_CODE ? (
          <RegisterInviteCodeStep control={control} onValidCode={setNextStep} reset={reset} />
        ) : null}
        {currentStep === STEP_WELCOME ? <RegisterWelcomeStep /> : null}
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
