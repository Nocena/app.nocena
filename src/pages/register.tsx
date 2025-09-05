// pages/register.tsx - Fixed to prevent duplicate registrations with optional notifications
import React, { useState, useEffect, useRef } from 'react';
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
    video.crossOrigin = 'anonymous'; // Help with CORS if needed

    // Use the exact filename we can see in your public folder
    video.src = '/intro.MP4';

    // Event listeners for preload status
    const handleCanPlayThrough = () => {
      console.log('✅ Welcome video fully preloaded and ready for instant playback');
      setVideoPreloaded(true);
      setVideoPreloadError(false);
    };

    const handleLoadedData = () => {
      console.log('📼 Welcome video metadata loaded');
    };

    const handleLoadStart = () => {
      console.log('🎬 Video preload started...');
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(0);
        const duration = video.duration;
        if (duration > 0) {
          const percentLoaded = (buffered / duration) * 100;
          console.log(
            `📊 Video preload progress: ${percentLoaded.toFixed(1)}% (${buffered.toFixed(1)}s of ${duration.toFixed(1)}s)`,
          );

          // Consider it "ready enough" if we have at least 50% buffered
          if (percentLoaded >= 50 && !videoPreloaded) {
            console.log('🎯 Video 50% preloaded - should be ready for smooth playback');
            setVideoPreloaded(true);
            setVideoPreloadError(false);
          }
        }
      }
    };

    const handleLoadedMetadata = () => {
      console.log('📋 Video metadata loaded:', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
      });
    };

    const handleError = (e: Event) => {
      console.error('⚠️ Welcome video preload failed:', e);
      console.log('🔍 Checking if video file exists by trying direct fetch...');

      // Try to fetch the video file directly to debug
      fetch('/intro.MP4')
        .then((response) => {
          if (response.ok) {
            console.log('✅ Video file exists and is accessible via fetch');
            console.log('📁 Video details:', {
              size: response.headers.get('content-length'),
              type: response.headers.get('content-type'),
            });
          } else {
            console.error(`❌ Video file returned status: ${response.status}`);
          }
        })
        .catch((fetchError) => {
          console.error('❌ Video file not accessible:', fetchError);
        });

      setVideoPreloadError(true);
      setVideoPreloaded(false); // Will use fallback experience
    };

    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('error', handleError);
    video.addEventListener('progress', handleProgress);

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
        preloadedVideoRef.current.removeEventListener('loadeddata', handleLoadedData);
        preloadedVideoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        preloadedVideoRef.current.removeEventListener('loadstart', handleLoadStart);
        preloadedVideoRef.current.removeEventListener('error', handleError);
        preloadedVideoRef.current.removeEventListener('progress', handleProgress);
        preloadedVideoRef.current.remove();
        preloadedVideoRef.current = null;
      }
    };
  }, []);

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

        // Always proceed to wallet connect step after valid invite code
        setCurrentStep(RegisterStep.WALLET_CONNECT);
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

    console.log('🚀 REGISTRATION ATTEMPT:', {
      attemptId,
      registrationInProgress,
      registrationCompleted,
      currentAttempt: registrationAttemptRef.current,
      username: registrationData.username,
      wallet: registrationData.walletAddress,
      pushSubscription: pushSubscription ? 'Enabled' : 'Skipped/Failed',
    });

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

    console.log('🔒 REGISTRATION LOCKED:', {
      attemptId,
      inProgress: true,
      timestamp: new Date().toISOString(),
      notificationsEnabled: !!pushSubscription,
    });

    try {
      // STEP 1: Generate mock Lens data (no API calls, just local generation)
      console.log('🌿 [NO-LENS] Generating mock Lens data locally...');

      // Generate completely local mock data - no API calls at all
      const mockTimestamp = Date.now().toString(36);
      const mockRandomSuffix = Math.random().toString(36).substr(2, 8);

      const lensData = {
        handle: `${registrationData.username}.lens`,
        accountId: `mock-lens-${registrationData.username}-${mockTimestamp}`,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        metadataUri: `https://mock-lens.nocena.app/metadata/${registrationData.username}-${mockRandomSuffix}`,
      };

      console.log('✅ [NO-LENS] Mock Lens data generated locally:', {
        handle: lensData.handle,
        txHash: lensData.txHash,
        accountId: lensData.accountId,
        metadataUri: lensData.metadataUri,
      });

      // STEP 2: Register the user in Dgraph with mock Lens data
      console.log('🗄️ Creating user in Dgraph with mock Lens data...');
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
        // Mock Lens data (these come BEFORE invitedById and pushSubscription according to function signature)
        lensData.handle,
        lensData.accountId,
        lensData.txHash,
        lensData.metadataUri,
        // These are the optional parameters at the end
        registrationData.invitedById || '',
        pushSubscription || '', // Convert null to empty string for the API
      );

      if (!addedUser) {
        throw new Error('Failed to create user in database');
      }

      console.log('✅ User created in Dgraph with mock Lens data:', {
        userId: addedUser.id,
        username: addedUser.username,
        lensHandle: addedUser.lensHandle,
        lensAccountId: addedUser.lensAccountId,
        notificationsEnabled: !!pushSubscription,
      });

      // STEP 3: Mark invite code as used (no recovery mode exception)
      await fetch('/api/registration/use-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: registrationData.inviteCode,
          newUserId: addedUser.id,
        }),
      });

      // STEP 4: Generate initial invite codes
      try {
        await generateInviteCode(addedUser.id, 'initial');
        await generateInviteCode(addedUser.id, 'initial');
        console.log('✅ Initial invite codes generated');
      } catch (inviteError) {
        console.error('Error generating initial invite codes:', inviteError);
        // Don't fail registration for this
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
        lensHandle: addedUser.lensHandle!,
        lensAccountId: addedUser.lensAccountId!,
        lensTransactionHash: addedUser.lensTransactionHash!,
        lensMetadataUri: addedUser.lensMetadataUri!,

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

      console.log('🎉 Registration complete with optional notifications!', {
        attemptId,
        userId: addedUser.id,
        username: registrationData.username,
        lensHandle: lensData.handle,
        lensAccountId: lensData.accountId,
        lensTransactionHash: lensData.txHash,
        videoPreloaded: videoPreloaded,
        registrationCompleted: true,
        notificationsEnabled: !!pushSubscription,
      });

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
          title: 'Create your profile',
          subtitle: 'Connect some of your accounts to start your Nocena journey',
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
