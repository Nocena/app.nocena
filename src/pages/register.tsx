import { useState, useEffect } from 'react';
import { registerUser, generateInviteCode } from '../lib/api/dgraph';
import { createPolygonWallet } from '../lib/api/polygon';
import { hashPassword } from '../lib/utils/passwordUtils';
import { User, useAuth } from '../contexts/AuthContext';
import AuthenticationLayout from '../components/layout/AuthenticationLayout';
import RegisterFormStep from '@components/register/components/RegisterFormStep';
import RegisterInviteCodeStep from '@components/register/components/RegisterInviteCodeStep';
import RegisterWelcomeStep from '@components/register/components/RegisterWelcomeStep';
import RegisterRewardsExplanationStep from '@components/register/components/RegisterRewardsExplanationStep';
import RegisterWalletSetupChoiceStep from '@components/register/components/RegisterWalletSetupChoiceStep';
import RegisterWalletCreationStep from '@components/register/components/RegisterWalletCreationStep';
import RegisterExistingWalletStep from '@components/register/components/RegisterExistingWalletStep';
import RegisterLensProfileStep from '@components/register/components/RegisterLensProfileStep';
import RegisterNotificationsStep from '@components/register/components/RegisterNotificationsStep';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { schema } from '@components/register/schema';
import { FormValues } from '@components/register/types';

enum RegisterStep {
  INVITE_CODE,
  WELCOME,
  REGISTER_FORM,
  REWARDS_EXPLANATION,
  WALLET_CHOICE,
  WALLET_CREATION,
  EXISTING_WALLET,
  LENS_PROFILE,
  NOTIFICATIONS,
}

interface LensProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  picture: string;
}

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(RegisterStep.INVITE_CODE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [validatedInviteCode, setValidatedInviteCode] = useState('');
  const [inviteOwner, setInviteOwner] = useState('');
  const [invitedById, setInvitedById] = useState('');
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [lensProfiles, setLensProfiles] = useState<LensProfile[]>([]);
  const [selectedLensProfile, setSelectedLensProfile] = useState<LensProfile | null>(null);
  const { login } = useAuth();

  // Handle welcome animation
  useEffect(() => {
    if (currentStep === RegisterStep.WELCOME) {
      const timer = setTimeout(() => {
        setCurrentStep(RegisterStep.REGISTER_FORM);
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
    },
  });

  useEffect(() => {
    const currentValues = watch('inviteCode');
    if (!currentValues || currentValues.length !== 6) {
      reset((prev) => ({
        ...prev,
        inviteCode: Array(6).fill(''),
      }));
    }
  }, [reset, watch]);

  // Updated invite validation handler
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
        setValidatedInviteCode(code);
        setInviteOwner(data.invite.ownerUsername || 'Someone');
        setInvitedById(data.invite.ownerId || '');
        setCurrentStep(RegisterStep.WELCOME);
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

  const handleFormComplete = async () => {
    const currentFormData = watch();
    setFormData(currentFormData);
    setCurrentStep(RegisterStep.REWARDS_EXPLANATION);
  };

  // Simplified: automatically create wallet and go to notifications
  const handleAutomaticSetup = () => {
    const newWallet = createPolygonWallet();
    setWallet(newWallet);
    setCurrentStep(RegisterStep.NOTIFICATIONS);
  };

  // Advanced: show wallet choice for crypto users
  const handleAdvancedSetup = () => {
    setCurrentStep(RegisterStep.WALLET_CHOICE);
  };

  const handleWalletChoice = (choice: 'new' | 'existing') => {
    if (choice === 'new') {
      const newWallet = createPolygonWallet();
      setWallet(newWallet);
      setCurrentStep(RegisterStep.WALLET_CREATION);
    } else {
      setCurrentStep(RegisterStep.EXISTING_WALLET);
    }
  };

  const handleWalletConnected = (walletAddress: string, profiles: LensProfile[] = []) => {
    setWallet({ address: walletAddress, privateKey: '' }); // No private key for existing wallets
    setLensProfiles(profiles);

    if (profiles.length > 0) {
      setCurrentStep(RegisterStep.LENS_PROFILE);
    } else {
      setCurrentStep(RegisterStep.NOTIFICATIONS);
    }
  };

  const handleWalletCreationComplete = () => {
    setCurrentStep(RegisterStep.NOTIFICATIONS);
  };

  const handleLensProfileSelected = (profile: LensProfile | null) => {
    setSelectedLensProfile(profile);
    setCurrentStep(RegisterStep.NOTIFICATIONS);
  };

  const handleNotificationsReady = async (pushSubscription: string) => {
    if (!formData || !wallet) {
      setError('Missing form data or wallet. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔧 Creating user with push subscription:', pushSubscription);

      const securePasswordHash = await hashPassword(formData.password);

      const addedUser = await registerUser(
        formData.username,
        '',
        securePasswordHash,
        '/images/profile.png',
        wallet.address,
        '0'.repeat(365),
        '0'.repeat(52),
        '0'.repeat(12),
        validatedInviteCode,
        invitedById,
        pushSubscription,
      );

      if (addedUser) {
        const userData: User = {
          id: addedUser.id,
          username: formData.username,
          phoneNumber: '',
          wallet: wallet.address,
          bio: '',
          profilePicture: '/images/profile.png',
          earnedTokens: 50,
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
          pushSubscription: pushSubscription,
        };

        await fetch('/api/registration/use-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: validatedInviteCode,
            newUserId: addedUser.id,
          }),
        });

        try {
          await generateInviteCode(addedUser.id, 'initial');
          await generateInviteCode(addedUser.id, 'initial');
        } catch (inviteError) {
          console.error('Error generating initial invite codes:', inviteError);
        }

        await login(userData);
        window.location.href = '/home';
      } else {
        setError('Failed to register. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    console.log('Form submitted:', data);
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case RegisterStep.INVITE_CODE:
        return {
          title: 'Join the Challenge',
          subtitle: 'Enter your invite code to create your account',
        };
      case RegisterStep.REGISTER_FORM:
        return {
          title: 'Create Your Account',
          subtitle: 'Choose your username and secure password',
        };
      case RegisterStep.REWARDS_EXPLANATION:
        return {
          title: 'Challenge2Earn',
          subtitle:
            'You will get a challenge each day to share with your friends. If you succesfully complete it you will earn a reward that will be securely stored in your wallet that we create for you. You can later withdraw any of the rewards into a curency of your choice - just make sure to remember the password for the wallet.',
        };
      case RegisterStep.WALLET_CHOICE:
        return {
          title: 'Reward Setup',
          subtitle: 'Choose how to set up your reward system',
        };
      case RegisterStep.WALLET_CREATION:
        return {
          title: 'Wallet Created',
          subtitle: 'Your secure reward wallet has been generated',
        };
      case RegisterStep.EXISTING_WALLET:
        return {
          title: 'Connect Wallet',
          subtitle: 'Link your existing wallet address',
        };
      case RegisterStep.LENS_PROFILE:
        return {
          title: 'Import Profile',
          subtitle: 'Choose a Lens Protocol profile to import',
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

  // SPECIAL HANDLING: Render welcome step outside of layout
  if (currentStep === RegisterStep.WELCOME) {
    return <RegisterWelcomeStep inviteOwner={inviteOwner} />;
  }

  const stepInfo = getStepInfo();

  return (
    <AuthenticationLayout title={stepInfo.title} subtitle={stepInfo.subtitle}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
        {currentStep === RegisterStep.INVITE_CODE && (
          <RegisterInviteCodeStep
            control={control}
            onValidCode={handleValidInviteCode}
            reset={reset}
            loading={loading}
            error={error}
          />
        )}

        {currentStep === RegisterStep.REGISTER_FORM && (
          <RegisterFormStep setStep={handleFormComplete} control={control} />
        )}

        {currentStep === RegisterStep.REWARDS_EXPLANATION && (
          <RegisterRewardsExplanationStep onNext={handleAutomaticSetup} onAdvancedSetup={handleAdvancedSetup} />
        )}

        {currentStep === RegisterStep.WALLET_CHOICE && <RegisterWalletSetupChoiceStep onChoice={handleWalletChoice} />}

        {currentStep === RegisterStep.WALLET_CREATION && wallet && (
          <RegisterWalletCreationStep wallet={wallet} onNext={handleWalletCreationComplete} />
        )}

        {currentStep === RegisterStep.EXISTING_WALLET && (
          <RegisterExistingWalletStep onWalletConnected={handleWalletConnected} />
        )}

        {currentStep === RegisterStep.LENS_PROFILE && (
          <RegisterLensProfileStep lensProfiles={lensProfiles} onProfileSelected={handleLensProfileSelected} />
        )}

        {currentStep === RegisterStep.NOTIFICATIONS && (
          <RegisterNotificationsStep onNotificationsReady={handleNotificationsReady} />
        )}

        {/* Show loading overlay during final registration */}
        {loading && currentStep === RegisterStep.NOTIFICATIONS && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-nocenaBlue to-nocenaPink p-6 rounded-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <h3 className="text-white font-bold text-lg mb-2">Creating Your Account</h3>
              <p className="text-white text-sm opacity-80">Setting up your profile...</p>
            </div>
          </div>
        )}
      </form>
    </AuthenticationLayout>
  );
};

export default RegisterPage;
