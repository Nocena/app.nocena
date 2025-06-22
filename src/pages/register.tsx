// pages/register.tsx (Enhanced with video preloading)
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

  // Video preloading states
  const [videoPreloaded, setVideoPreloaded] = useState(false);
  const [videoPreloadError, setVideoPreloadError] = useState(false);
  const preloadedVideoRef = useRef<HTMLVideoElement | null>(null);

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

  // Video preloading effect - starts as soon as component mounts
  useEffect(() => {
    console.log('🎬 Starting welcome video preload...');
    
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.loop = false;
    
    // Add multiple formats for better compatibility
    const formats = [
      { src: '/intro.MP4', type: 'video/mp4' },
    ];
    
    formats.forEach(format => {
      const source = document.createElement('source');
      source.src = format.src;
      source.type = format.type;
      video.appendChild(source);
    });
    
    // Event listeners for preload status
    const handleCanPlayThrough = () => {
      console.log('✅ Welcome video fully preloaded and ready');
      setVideoPreloaded(true);
      setVideoPreloadError(false);
    };
    
    const handleLoadedData = () => {
      console.log('📼 Welcome video metadata loaded');
    };
    
    const handleError = (e: Event) => {
      console.warn('⚠️ Welcome video preload failed:', e);
      setVideoPreloadError(true);
      setVideoPreloaded(false); // Still allow progression
    };
    
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(0);
        const duration = video.duration;
        if (duration > 0) {
          const percentLoaded = (buffered / duration) * 100;
          console.log(`📊 Video preload progress: ${percentLoaded.toFixed(1)}%`);
        }
      }
    };
    
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('progress', handleProgress);
    
    // Start loading
    video.load();
    preloadedVideoRef.current = video;
    
    // Cleanup
    return () => {
      if (preloadedVideoRef.current) {
        preloadedVideoRef.current.removeEventListener('canplaythrough', handleCanPlayThrough);
        preloadedVideoRef.current.removeEventListener('loadeddata', handleLoadedData);
        preloadedVideoRef.current.removeEventListener('error', handleError);
        preloadedVideoRef.current.removeEventListener('progress', handleProgress);
        preloadedVideoRef.current.remove();
        preloadedVideoRef.current = null;
      }
    };
  }, []);

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
      // STEP 1: Check Lens username availability and create Lens account
      console.log('🌿 Checking Lens username availability...');
      let lensData: {
        handle: string;
        accountId: string;
        txHash: string;
        metadataUri: string;
      } | null = null;
  
      try {
        const lensCheckResponse = await fetch('/api/lens/checkUsername', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: registrationData.username }),
        });
  
        const lensCheck = await lensCheckResponse.json();
  
        if (!lensCheck.available) {
          throw new Error(`Username "${registrationData.username}" is not available on Lens Protocol`);
        }
  
        console.log('🌿 Username available on Lens, creating account...');
        
        // Try to create Lens account
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
  
        if (!createResult.success) {
          throw new Error(`Failed to create Lens account: ${createResult.error}`);
        }
  
        // Validate that we have all required Lens data
        if (!createResult.txHash) {
          throw new Error('Lens account creation did not return a transaction hash');
        }
  
        lensData = {
          handle: `${registrationData.username}.lens`,
          accountId: createResult.accountId || `lens-account-${Date.now()}`, // Fallback if not provided
          txHash: createResult.txHash,
          metadataUri: `lens://nocena.app/metadata/lens-${registrationData.username}-${Date.now()}`,
        };
  
        console.log('✅ Lens account created successfully:', {
          handle: lensData.handle,
          txHash: lensData.txHash,
          accountId: lensData.accountId,
        });
  
      } catch (lensError) {
        console.error('💥 Error with Lens integration:', lensError);
        throw new Error(`Lens Protocol integration failed: ${lensError instanceof Error ? lensError.message : 'Unknown error'}. Registration cannot continue.`);
      }
  
      // STEP 2: Register the user in Dgraph with Lens data (only if Lens was successful)
      console.log('🗄️ Creating user in Dgraph with Lens data...');
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
        // Lens data (guaranteed to be valid strings at this point)
        lensData.handle,
        lensData.accountId,
        lensData.txHash,
        lensData.metadataUri,
      );
  
      if (!addedUser) {
        throw new Error('Failed to create user in database');
      }
  
      console.log('✅ User created in Dgraph with Lens data:', {
        userId: addedUser.id,
        username: addedUser.username,
        lensHandle: addedUser.lensHandle,
        lensAccountId: addedUser.lensAccountId,
      });
  
      // STEP 3: Mark invite code as used
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
  
        pushSubscription: pushSubscription,
        dailyChallenge: '0'.repeat(365),
        weeklyChallenge: '0'.repeat(52),
        monthlyChallenge: '0'.repeat(12),
        
        // Include Lens data in user context (guaranteed to exist)
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
  
      console.log('🎉 Registration complete!', {
        userId: addedUser.id,
        username: registrationData.username,
        lensHandle: lensData.handle,
        lensAccountId: lensData.accountId,
        lensTransactionHash: lensData.txHash,
        videoPreloaded: videoPreloaded,
      });
  
      setCurrentStep(RegisterStep.WELCOME);
    } catch (err) {
      console.error('💥 Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register. Please try again.');
      setCurrentStep(RegisterStep.USER_INFO);
    } finally {
      setLoading(false);
    }
  };

  // Handle welcome screen completion - longer duration if video is ready
  useEffect(() => {
    if (currentStep === RegisterStep.WELCOME) {
      // Determine timing based on video readiness
      const welcomeDuration = videoPreloaded ? 7000 : 5000; // 7s if video ready, 5s fallback
      
      console.log(`⏱️ Welcome screen will show for ${welcomeDuration}ms (video preloaded: ${videoPreloaded})`);
      
      const timer = setTimeout(() => {
        console.log('🏠 Navigating to home...');
        router.push('/home');
      }, welcomeDuration);

      return () => clearTimeout(timer);
    }
  }, [currentStep, router, videoPreloaded]);

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
        return (
          <div className="space-y-4">
            <RegisterNotificationsStep onNotificationsReady={handleNotificationsReady} />
            
            {/* Optional: Show video preload status */}
            {!videoPreloaded && !videoPreloadError && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-purple-300 text-sm">Preparing welcome experience...</p>
                </div>
              </div>
            )}
            
            {videoPreloaded && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                  <p className="text-green-300 text-sm">Welcome experience ready!</p>
                </div>
              </div>
            )}
          </div>
        );

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