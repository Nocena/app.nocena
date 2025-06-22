// pages/register.tsx (Fixed with proper data flow)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useActiveAccount } from 'thirdweb/react';
import { registerUser, generateInviteCode } from '../lib/api/dgraph';
import PrimaryButton from '../components/ui/PrimaryButton';
import { User, useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../lib/utils/security';
import AuthenticationLayout from '../components/layout/AuthenticationLayout';
import RegisterWelcomeStep from '../components/register/components/RegisterWelcomeStep';
import RegisterInviteCodeStep from '../components/register/components/RegisterInviteCodeStep';
import RegisterWalletConnectStep from '../components/register/components/RegisterWalletConnectStep';
import RegisterFormStep from '../components/register/components/RegisterFormStep';
import RegisterNotificationsStep from '../components/register/components/RegisterNotificationsStep';

type FormValues = {
  username: string;
  inviteCode: string[];
};

// Temporary registration data that doesn't get committed until success
interface RegistrationData {
  username: string;
  inviteCode: string;
  inviteOwner: string;
  invitedById: string;
  walletAddress: string;
  pushSubscription?: string;
  isRecoveryMode: boolean;
}

enum RegisterStep {
  INVITE_CODE = 0,
  WALLET_CONNECT = 1,
  USER_INFO = 2,
  NOTIFICATIONS = 3,
  WELCOME = 4,
}

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(RegisterStep.INVITE_CODE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Temporary registration data - not committed to context until success
  const [registrationData, setRegistrationData] = useState<Partial<RegistrationData>>({});

  const router = useRouter();
  const { login } = useAuth();
  const account = useActiveAccount();

  const schema = yup.object().shape({
    username: yup
      .string()
      .transform((value) => sanitizeInput(value))
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .required('Username is required'),
    inviteCode: yup
      .array()
      .of(yup.string().required())
      .min(6, 'Invite code must be 6 characters')
      .max(6, 'Invite code must be 6 characters')
      .required('Invite code is required'),
  });

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      username: '',
      inviteCode: Array(6).fill(''),
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = methods;

  // Skip invite code step if coming from login (wallet already connected)
  useEffect(() => {
    if (router.query.skip_wallet === 'true' && account?.address) {
      // Set up recovery mode data temporarily
      setRegistrationData((prev) => ({
        ...prev,
        inviteCode: 'RECOVERY',
        inviteOwner: 'System',
        invitedById: 'system',
        walletAddress: account.address,
        isRecoveryMode: true,
      }));
      setCurrentStep(RegisterStep.USER_INFO);
    }
  }, [router.query.skip_wallet, account?.address]);

  const handleValidInviteCode = async (code: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/registration/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await response.json();

      if (data.valid) {
        // Store invite data temporarily
        setRegistrationData((prev) => ({
          ...prev,
          inviteCode: code,
          inviteOwner: data.invite.ownerUsername || 'Someone',
          invitedById: data.invite.ownerId || '',
        }));

        if (router.query.skip_wallet === 'true' && account?.address) {
          setRegistrationData((prev) => ({
            ...prev,
            walletAddress: account.address,
          }));
          setCurrentStep(RegisterStep.USER_INFO);
        } else {
          setCurrentStep(RegisterStep.WALLET_CONNECT);
        }
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

  const handleWalletConnected = () => {
    if (account?.address) {
      // Store wallet address temporarily
      setRegistrationData((prev) => ({
        ...prev,
        walletAddress: account.address,
      }));
      setCurrentStep(RegisterStep.USER_INFO);
    }
  };

  const handleFormComplete = async () => {
    const currentFormData = watch();

    // Store username temporarily
    setRegistrationData((prev) => ({
      ...prev,
      username: currentFormData.username,
    }));

    setCurrentStep(RegisterStep.NOTIFICATIONS);
  };

  const handleNotificationsReady = async (pushSubscription: string) => {
    // Validate we have all required data
    if (!registrationData.username || !registrationData.walletAddress || !registrationData.inviteCode) {
      setError('Missing registration data. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // STEP 1: Register the user in Dgraph first
      console.log('🗄️ Creating user in Dgraph...');
      const addedUser = await registerUser(
        registrationData.username,
        '', // bio (empty for new users)
        '/images/profile.png', // profilePicture
        '/images/cover.jpg', // coverPhoto
        '/trailer.mp4', // trailerVideo
        registrationData.walletAddress,
        50, // earnedTokens
        0, // earnedTokensToday
        0, // earnedTokensThisWeek
        0, // earnedTokensThisMonth
        '', // personalField1Type
        '', // personalField1Value
        '', // personalField1Metadata
        '', // personalField2Type
        '', // personalField2Value
        '', // personalField2Metadata
        '', // personalField3Type
        '', // personalField3Value
        '', // personalField3Metadata
        '0'.repeat(365), // dailyChallenge
        '0'.repeat(52), // weeklyChallenge
        '0'.repeat(12), // monthlyChallenge
        registrationData.inviteCode,
        registrationData.invitedById || '',
        pushSubscription,
      );

      if (!addedUser) {
        throw new Error('Failed to create user in database');
      }

      console.log('✅ User created in Dgraph:', addedUser.id);

      // STEP 2: Mark invite code as used
      if (registrationData.inviteCode !== 'RECOVERY') {
        await fetch('/api/registration/use-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: registrationData.inviteCode,
            newUserId: addedUser.id,
          }),
        });
      }

      // STEP 3: Generate initial invite codes
      try {
        await generateInviteCode(addedUser.id, 'initial');
        await generateInviteCode(addedUser.id, 'initial');
        console.log('✅ Initial invite codes generated');
      } catch (inviteError) {
        console.error('Error generating initial invite codes:', inviteError);
        // Don't fail registration for this
      }

      // STEP 4: Create Lens username if it was available during registration
      console.log('🌿 Attempting to create Lens username...');
      let lensCreated = false;

      try {
        // Check if username is still available on Lens
        const response = await fetch('/api/lens/checkUsername', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: registrationData.username }),
        });

        const lensCheck = await response.json();

        if (lensCheck.available) {
          console.log('🌿 Username still available on Lens, creating account...');

          const createResponse = await fetch('/api/lens/createAccount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: registrationData.username,
              walletAddress: registrationData.walletAddress,
              bio: `Nocena challenge enthusiast: ${registrationData.username}`,
            }),
          });

          const createResult = await createResponse.json();

          if (createResult.success) {
            console.log('✅ Lens username created successfully:', createResult.txHash);
            lensCreated = true;
          } else {
            console.warn('⚠️ Lens username creation failed:', createResult.error);
          }
        } else {
          console.log('ℹ️ Username no longer available on Lens, proceeding without');
        }
      } catch (lensError) {
        console.error('💥 Error creating Lens username:', lensError);
        // Don't fail the whole registration if Lens fails
      }

      // STEP 5: Create user data and commit to AuthContext
      console.log('👤 Creating user data for AuthContext...');
      const userData: User = {
        id: addedUser.id,
        username: registrationData.username,
        bio: '', // Empty bio for new users
        wallet: registrationData.walletAddress,
        profilePicture: '/images/profile.png',
        coverPhoto: '/images/cover.jpg',
        trailerVideo: '/trailer.mp4',
        earnedTokens: 50,
        earnedTokensDay: 0, // Maps to earnedTokensToday in Dgraph
        earnedTokensWeek: 0, // Maps to earnedTokensThisWeek in Dgraph
        earnedTokensMonth: 0, // Maps to earnedTokensThisMonth in Dgraph

        // Personal Expression Fields (matching Dgraph schema)
        personalField1Type: '',
        personalField1Value: '',
        personalField1Metadata: '',
        personalField2Type: '',
        personalField2Value: '',
        personalField2Metadata: '',
        personalField3Type: '',
        personalField3Value: '',
        personalField3Metadata: '',

        pushSubscription: pushSubscription,
        dailyChallenge: '0'.repeat(365),
        weeklyChallenge: '0'.repeat(52),
        monthlyChallenge: '0'.repeat(12),
        followers: [],
        following: [],
        notifications: [],
        completedChallenges: [],
        receivedPrivateChallenges: [],
        createdPrivateChallenges: [],
        createdPublicChallenges: [],
        participatingPublicChallenges: [],
      };

      // STEP 6: Commit to AuthContext only after everything is successful
      console.log('🔐 Logging in user...');
      await login(userData);

      console.log('🎉 Registration complete!', {
        userId: addedUser.id,
        username: registrationData.username,
        lensCreated: lensCreated,
      });

      setCurrentStep(RegisterStep.WELCOME);
    } catch (err) {
      console.error('💥 Registration error:', err);
      setError('Failed to register. Please try again.');
      setCurrentStep(RegisterStep.USER_INFO);
    } finally {
      setLoading(false);
    }
  };

  // Handle welcome screen completion
  useEffect(() => {
    if (currentStep === RegisterStep.WELCOME) {
      const timer = setTimeout(() => {
        router.push('/home');
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, router]);

  const onSubmit = async (values: FormValues) => {
    console.log('Form submitted:', values);
  };

  const getStepContent = () => {
    switch (currentStep) {
      case RegisterStep.INVITE_CODE:
        return (
          <RegisterInviteCodeStep
            control={control}
            onValidCode={handleValidInviteCode}
            reset={reset}
            loading={loading}
            error={error}
          />
        );

      case RegisterStep.WALLET_CONNECT:
        return <RegisterWalletConnectStep onWalletConnected={handleWalletConnected} />;

      case RegisterStep.USER_INFO:
        return (
          <div className="space-y-4">
            {registrationData.isRecoveryMode && (
              <div className="bg-blue-500/20 border border-blue-500 rounded-xl p-4">
                <p className="text-blue-400 text-sm text-center">Completing your profile setup...</p>
              </div>
            )}
            <RegisterFormStep control={control} loading={loading} setStep={handleFormComplete} />
          </div>
        );

      case RegisterStep.NOTIFICATIONS:
        return <RegisterNotificationsStep onNotificationsReady={handleNotificationsReady} />;

      default:
        return null;
    }
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case RegisterStep.INVITE_CODE:
        if (router.query.skip_wallet === 'true') {
          return {
            title: 'Almost Done!',
            subtitle: 'Just need your invite code to continue',
          };
        }
        return {
          title: 'Join the Challenge',
          subtitle: 'Enter your invite code to create your account',
        };
      case RegisterStep.WALLET_CONNECT:
        return {
          title: 'Connect Wallet',
          subtitle: 'Connect your wallet to start your Nocena journey',
        };
      case RegisterStep.USER_INFO:
        return {
          title: registrationData.isRecoveryMode ? 'Complete Your Profile' : 'Create Your Account',
          subtitle: registrationData.isRecoveryMode ? 'Finish setting up your account' : 'Choose your username',
        };
      case RegisterStep.NOTIFICATIONS:
        return {
          title: 'Stay Connected',
          subtitle: 'Enable notifications for challenges and rewards',
        };
      default:
        return {
          title: '',
          subtitle: '',
        };
    }
  };

  if (currentStep === RegisterStep.WELCOME) {
    return <RegisterWelcomeStep inviteOwner={registrationData.inviteOwner || 'Someone'} />;
  }

  const stepInfo = getStepInfo();

  return (
    <AuthenticationLayout title={stepInfo.title} subtitle={stepInfo.subtitle}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          {getStepContent()}

          {error && currentStep !== RegisterStep.INVITE_CODE && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </form>
      </FormProvider>
    </AuthenticationLayout>
  );
};

export default RegisterPage;
