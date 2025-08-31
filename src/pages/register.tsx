// pages/register.tsx - Updated for development with hardcoded invite code
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useActiveAccount } from 'thirdweb/react';
import { registerUser, generateInviteCode } from '../lib/api/dgraph';
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
  pushSubscription?: string | null; // Updated to allow null
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

  // Video preloading states
  const [videoPreloaded, setVideoPreloaded] = useState(false);
  const [videoPreloadError, setVideoPreloadError] = useState(false);
  const preloadedVideoRef = useRef<HTMLVideoElement | null>(null);

  // Temporary registration data - not committed to context until success
  const [registrationData, setRegistrationData] = useState<Partial<RegistrationData>>({});

  // CRITICAL: Registration state management to prevent duplicate registrations
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);
  const registrationAttemptRef = useRef<string | null>(null);

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

  // Video preloading effect - starts as soon as component mounts
  useEffect(() => {
    console.log('🎬 Starting welcome video preload...');

    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.loop = false;
    video.crossOrigin = 'anonymous';

    // Use the exact filename we can see in your public folder
    video.src = '/intro.MP4';

    // Event listeners for preload status
    const handleCanPlayThrough = () => {
      console.log('✅ Welcome video fully preloaded and ready for instant playback');
      setVideoPreloaded(true);
      setVideoPreloadError(false);
    };

    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('error', () => {
      console.error('⚠️ Welcome video preload failed');
      setVideoPreloadError(true);
      setVideoPreloaded(false);
    });

    // Start loading immediately
    video.load();
    preloadedVideoRef.current = video;

    // Fallback timeout - don't wait forever for preload
    const fallbackTimeout = setTimeout(() => {
      if (!videoPreloaded && !videoPreloadError) {
        console.log('⏰ Video preload taking too long, will continue without it');
        setVideoPreloadError(true);
      }
    }, 15000); // 15 second timeout

    // Cleanup
    return () => {
      clearTimeout(fallbackTimeout);
      if (preloadedVideoRef.current) {
        preloadedVideoRef.current.removeEventListener('canplaythrough', handleCanPlayThrough);
        preloadedVideoRef.current.remove();
        preloadedVideoRef.current = null;
      }
    };
  }, []);

  const handleValidInviteCode = async (code: string, ownerUsername?: string, ownerId?: string) => {
    try {
      setLoading(true);
      setError('');

      // DEVELOPMENT MODE: Accept hardcoded code without API call
      if (code === "123456") {
        console.log('Development mode: Accepting hardcoded invite code 123456');
        
        // Store invite data temporarily
        setRegistrationData((prev) => ({
          ...prev,
          inviteCode: code,
          inviteOwner: ownerUsername || 'DevTeam',
          invitedById: ownerId || 'dev_team_id',
        }));

        // Proceed to wallet connect step
        setCurrentStep(RegisterStep.WALLET_CONNECT);
        setLoading(false);
        return;
      }

      // For all other codes, try the API call (this will likely fail in dev if API is not available)
      try {
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

          // Always proceed to wallet connect step after valid invite code
          setCurrentStep(RegisterStep.WALLET_CONNECT);
        } else {
          setError(data.error || 'Invalid invite code');
        }
      } catch (err) {
        console.error('Error validating invite:', err);
        
        // DEVELOPMENT FALLBACK: If API fails but code is our development code, accept it anyway
        if (code === "123456") {
          console.log('Development fallback: API failed but accepting hardcoded code 123456');
          
          setRegistrationData((prev) => ({
            ...prev,
            inviteCode: code,
            inviteOwner: 'DevTeam',
            invitedById: 'dev_team_id',
          }));
          
          setCurrentStep(RegisterStep.WALLET_CONNECT);
        } else {
          setError('Failed to validate invite code. Please try again.');
        }
      }
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

  // Updated to accept string | null for optional notifications
  const handleNotificationsReady = async (pushSubscription: string | null) => {
    // CRITICAL: Prevent duplicate registrations - check immediately
    if (registrationInProgress) {
      console.log('⚠️ Registration already in progress, ignoring duplicate attempt');
      return;
    }

    if (registrationCompleted) {
      console.log('⚠️ Registration already completed, ignoring duplicate attempt');
      return;
    }

    // Create a unique attempt ID to track this specific registration attempt
    const attemptId = `${registrationData.walletAddress}-${registrationData.username}-${Date.now()}`;

    // Check if this exact attempt was already processed
    if (registrationAttemptRef.current) {
      console.log('⚠️ Registration attempt already in process, ignoring duplicate');
      return;
    }

    // Validate we have all required data
    if (!registrationData.username || !registrationData.walletAddress || !registrationData.inviteCode) {
      setError('Missing registration data. Please try again.');
      return;
    }

    // Mark registration as in progress and store attempt ID
    setRegistrationInProgress(true);
    registrationAttemptRef.current = attemptId;
    setLoading(true);
    setError('');

    try {
      // STEP 1: Generate mock Lens data (no API calls, just local generation)
      console.log('🌿 Generating mock Lens data locally...');

      // Generate completely local mock data - no API calls at all
      const mockTimestamp = Date.now().toString(36);
      const mockRandomSuffix = Math.random().toString(36).substr(2, 8);

      const lensData = {
        handle: `${registrationData.username}.lens`,
        accountId: `mock-lens-${registrationData.username}-${mockTimestamp}`,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        metadataUri: `https://mock-lens.nocena.app/metadata/${registrationData.username}-${mockRandomSuffix}`,
      };

      // STEP 2: Register the user in Dgraph with mock Lens data
      console.log('🗄️ Creating user in Dgraph with mock Lens data...');
      
      // DEVELOPMENT MODE: Mock the Dgraph API call
      let addedUser;
      
      try {
        addedUser = await registerUser(
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
          // Mock Lens data
          lensData.handle,
          lensData.accountId,
          lensData.txHash,
          lensData.metadataUri,
          // Optional parameters
          registrationData.invitedById || '',
          pushSubscription || '', // Convert null to empty string for the API
        );
      } catch (dbError) {
        console.error('DEVELOPMENT MODE: Dgraph API error:', dbError);
        
        // In development mode, create a mock user if the DB call fails
        addedUser = {
          id: `dev-user-${Date.now()}`,
          username: registrationData.username,
          wallet: registrationData.walletAddress,
          lensHandle: lensData.handle,
          lensAccountId: lensData.accountId,
          lensTransactionHash: lensData.txHash,
          lensMetadataUri: lensData.metadataUri,
        };
        
        console.log('DEVELOPMENT MODE: Created mock user:', addedUser);
      }

      if (!addedUser) {
        throw new Error('Failed to create user in database');
      }

      // STEP 3: Mark invite code as used (skip API call in development mode)
      try {
        await fetch('/api/registration/use-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: registrationData.inviteCode,
            newUserId: addedUser.id,
          }),
        });
      } catch (inviteError) {
        console.log('DEVELOPMENT MODE: Skipping invite code marking as used');
      }

      // STEP 4: Generate initial invite codes (skip API call in development mode)
      try {
        await generateInviteCode(addedUser.id, 'initial');
        await generateInviteCode(addedUser.id, 'initial');
      } catch (inviteError) {
        console.log('DEVELOPMENT MODE: Skipping invite code generation');
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
        earnedTokensDay: 0,
        earnedTokensWeek: 0,
        earnedTokensMonth: 0,

        // Personal Expression Fields
        personalField1Type: '',
        personalField1Value: '',
        personalField1Metadata: '',
        personalField2Type: '',
        personalField2Value: '',
        personalField2Metadata: '',
        personalField3Type: '',
        personalField3Value: '',
        personalField3Metadata: '',

        pushSubscription: pushSubscription || '', // Store actual value or empty string
        dailyChallenge: '0'.repeat(365),
        weeklyChallenge: '0'.repeat(52),
        monthlyChallenge: '0'.repeat(12),

        // Include mock Lens data in user context
        lensHandle: addedUser.lensHandle || lensData.handle,
        lensAccountId: addedUser.lensAccountId || lensData.accountId,
        lensTransactionHash: addedUser.lensTransactionHash || lensData.txHash,
        lensMetadataUri: addedUser.lensMetadataUri || lensData.metadataUri,

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

      // Mark registration as completed
      setRegistrationCompleted(true);

      console.log('🎉 Registration complete with optional notifications!');

      setCurrentStep(RegisterStep.WELCOME);
    } catch (err) {
      console.error('💥 Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register. Please try again.');
      setCurrentStep(RegisterStep.USER_INFO);

      // Reset registration state on error so user can try again
      setRegistrationInProgress(false);
      registrationAttemptRef.current = null;
    } finally {
      setLoading(false);
      // Don't reset registrationInProgress here if successful, keep it locked
      if (!registrationCompleted) {
        setRegistrationInProgress(false);
      }
    }
  };

  // Handle welcome screen completion - adjust timing based on video availability
  useEffect(() => {
    if (currentStep === RegisterStep.WELCOME) {
      // Determine timing: longer if video loads, shorter if no video (fallback experience)
      const welcomeDuration = videoPreloaded ? 7000 : 3000; // 7s with video, 3s without

      console.log(
        `⏱️ Welcome screen will show for ${welcomeDuration}ms (video preloaded: ${videoPreloaded}, error: ${videoPreloadError})`,
      );

      const timer = setTimeout(() => {
        console.log('🏠 Navigating to home...');
        router.push('/home');
      }, welcomeDuration);

      return () => clearTimeout(timer);
    }
  }, [currentStep, router, videoPreloaded, videoPreloadError]);

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
        return <RegisterFormStep control={control} loading={loading} setStep={handleFormComplete} />;

      case RegisterStep.NOTIFICATIONS:
        return (
          <div className="space-y-4">
            <RegisterNotificationsStep
              onNotificationsReady={handleNotificationsReady}
              disabled={registrationInProgress || registrationCompleted}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case RegisterStep.INVITE_CODE:
        return {
          title: 'Join the Challenge',
          subtitle: 'Enter your invite code to create your account',
        };
      case RegisterStep.WALLET_CONNECT:
        return {
          title: 'Welcome challenger',
          subtitle: 'Connect your account to start',
        };
      case RegisterStep.USER_INFO:
        return {
          title: 'Create Your Account',
          subtitle: 'Choose your username',
        };
      case RegisterStep.NOTIFICATIONS:
        return {
          title: 'Last step - you know the deal',
          subtitle: registrationInProgress
            ? 'Creating your account...'
            : registrationCompleted
              ? 'Account created!'
              : 'Enable notifications for challenges and rewards and read our legal documents',
        };
      default:
        return {
          title: '',
          subtitle: '',
        };
    }
  };

  if (currentStep === RegisterStep.WELCOME) {
    return (
      <RegisterWelcomeStep
        inviteOwner={registrationData.inviteOwner || 'Someone'}
        videoPreloaded={videoPreloaded}
        preloadedVideo={preloadedVideoRef.current}
      />
    );
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