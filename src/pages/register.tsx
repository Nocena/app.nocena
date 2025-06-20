import { useEffect, useState } from 'react';
import { generateInviteCode, registerUser } from '../lib/api/dgraph';
import { useAuth, User } from '../contexts/AuthContext';
import AuthenticationLayout from '../components/layout/AuthenticationLayout';
import RegisterFormStep from '@components/register/components/RegisterFormStep';
import RegisterInviteCodeStep from '@components/register/components/RegisterInviteCodeStep';
import RegisterWelcomeStep from '@components/register/components/RegisterWelcomeStep';
import RegisterWalletCreationStep from '@components/register/components/RegisterWalletCreationStep';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { schema } from '@components/register/schema';
import { FormValues } from '@components/register/types';
import { useAccount } from 'wagmi';
import { fetchAccountByUserName } from '@utils/lensUtils';
import { useLensAuth } from '../contexts/LensAuthProvider';
import { account as accountMetadata } from '@lens-protocol/metadata';
import { uploadMetadataToGrove } from '@utils/groveUtils';
import { createAccountWithUsername } from '@lens-protocol/client/actions';
import { uri } from '@lens-protocol/types';

const STEP_INVITE_CODE = 0;
const STEP_WELCOME = 1;
const STEP_REGISTER_FORM = 2;
const STEP_WALLET_CREATION = 3;
// const STEP_PHONE_VERIFICATION = 3;
// const STEP_WALLET_CREATION = 4;

enum RegisterStep {
  INVITE_CODE,
  WELCOME,
  REGISTER_FORM,
  // PHONE_VERIFICATION,
  WALLET_CREATION,
}

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(STEP_INVITE_CODE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [validatedInviteCode, setValidatedInviteCode] = useState('');
  const [inviteOwner, setInviteOwner] = useState('');
  const [invitedById, setInvitedById] = useState('');
  const [formData, setFormData] = useState<FormValues | null>(null);
  const { login } = useAuth();
  const { address: walletAddress } = useAccount();
  const { onboard, refreshCurrentAccount } = useLensAuth();

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
      fields: ['username' /*, 'phoneNumber', 'password'*/],
    },
    /*
    {
      step: RegisterStep.PHONE_VERIFICATION,
      title: 'Verify Your Phone',
      subtitle: 'We sent a verification code to {phoneNumber}',
    },
*/
    {
      step: RegisterStep.WALLET_CREATION,
      title: 'Complete Your Setup',
      subtitle: 'Almost there',
    },
  ];

  /*
  // Handle welcome animation
  useEffect(() => {
    if (currentStep === STEP_WELCOME) {
      const timer = setTimeout(() => {
        setCurrentStep(STEP_REGISTER_FORM);
      }, 4000); // 4 seconds for welcome animation

      return () => clearTimeout(timer);
    }
  }, [currentStep]);
*/

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
      // verificationCode: [],
    },
  });

  useEffect(() => {
    const currentValues = watch('inviteCode');
    if (!currentValues || currentValues.length !== 6) {
      reset((prev) => ({
        ...prev,
        inviteCode: Array(6).fill(''),
        // verificationCode: Array(6).fill(''),
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

    /*
    if (currentStep === STEP_REGISTER_FORM) {
      handleResendCode();
    }
*/

    if (currentStep < registerSteps.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  // NEW: Handle push subscription ready - this creates the user with push subscription
  const handlePushSubscriptionReady = async (pushSubscription: string) => {
    if (!formData) {
      setError('Missing form data or wallet. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔧 Creating user with push subscription:', pushSubscription);
      /*
      // Securely hash the password
      const securePasswordHash = await hashPassword(formData.password);

      // Format phone number to E.164 format before storing
      const formattedPhone = formatPhoneToE164(formData.phoneNumber);
*/

      const existingAccount = await fetchAccountByUserName(null, formData.username);
      if (existingAccount) {
        throw new Error('duplicated username');
      }

      const newClient = await onboard(walletAddress!);
      if (!newClient) throw new Error(`Can't onboard user`);

      const metadata = accountMetadata({
        name: formData.username,
        bio: '',
      });
      const metadataURI = await uploadMetadataToGrove(metadata);
      const result = await createAccountWithUsername(newClient, {
        username: { localName: formData.username },
        metadataUri: uri(metadataURI.uri),
      });
      console.log('Account created successfully', result);
      await refreshCurrentAccount();
      // Register user with push subscription from the start
      const addedUser = await registerUser(
        formData.username,
        '', // formattedPhone,
        '', // securePasswordHash,
        '/images/profile.png',
        walletAddress!,
        '0'.repeat(365),
        '0'.repeat(52),
        '0'.repeat(12),
        validatedInviteCode,
        invitedById,
        pushSubscription, // NOW we have the push subscription
      );

      if (addedUser) {
        // Create user data object
        const userData: User = {
          id: addedUser.id,
          username: formData.username,
          phoneNumber: '',
          wallet: walletAddress!,
          bio: '',
          profilePicture: '/images/profile.png',
          earnedTokens: 50,
          dailyChallenge: '0'.repeat(365),
          weeklyChallenge: '0'.repeat(52),
          monthlyChallenge: '0'.repeat(12),
          followers: [],
          following: [],
          passwordHash: '',
          notifications: [],
          completedChallenges: [],
          receivedPrivateChallenges: [],
          createdPrivateChallenges: [],
          createdPublicChallenges: [],
          participatingPublicChallenges: [],
          pushSubscription: pushSubscription,
        };

        // Mark the invite code as used and award tokens
        /*
        await fetch('/api/registration/use-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode: validatedInviteCode,
            newUserId: addedUser.id,
          }),
        });
*/

        // Generate initial invite codes for the new user
        try {
          await generateInviteCode(addedUser.id, 'initial');
          await generateInviteCode(addedUser.id, 'initial');
        } catch (inviteError) {
          console.error('Error generating initial invite codes:', inviteError);
          // Don't fail registration if invite generation fails
        }

        // Log the user in immediately
        await login(userData);

        // Navigate to home
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

  /*
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError('');

    try {
      const code = data.verificationCode.join('');
      const formattedPhone = formatPhoneToE164(data.phoneNumber);

      // Verify the code using Twilio
      const isValid = await verifyPhoneNumber(formattedPhone, 'VERIFY', code);

      if (isValid) {
        // Create wallet and store form data
        const newWallet = createPolygonWallet();
        setWallet(newWallet);
        setFormData(data); // Store form data for later use

        // Move to wallet creation step where push notifications will be handled
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
*/

  const formValues = watch();
  /*
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
*/

  // Update subtitle for welcome step to show invite owner
  const getStepSubtitle = (step: RegisterStep) => {
    if (step === RegisterStep.WELCOME && inviteOwner) {
      return `Welcome! You were invited by ${inviteOwner}`;
    }
    /*
    if (step === RegisterStep.PHONE_VERIFICATION) {
      return registerSteps[currentStep].subtitle?.replace('{phoneNumber}', formValues.phoneNumber);
    }
*/
    return registerSteps[currentStep]?.subtitle;
  };

  return (
    <AuthenticationLayout
      title={registerSteps[currentStep]?.title}
      subtitle={getStepSubtitle(registerSteps[currentStep].step)}
    >
      <form className="w-full space-y-4">
        {currentStep === STEP_INVITE_CODE ? (
          <RegisterInviteCodeStep
            control={control}
            onValidCode={handleValidInviteCode}
            reset={reset}
            loading={loading}
            error={error}
          />
        ) : null}

        {currentStep === STEP_WELCOME ? (
          <RegisterWelcomeStep setStep={() => setCurrentStep(STEP_REGISTER_FORM)} inviteOwner={inviteOwner} />
        ) : null}

        {currentStep === STEP_REGISTER_FORM ? <RegisterFormStep setStep={setNextStep} control={control} /> : null}

        {/*
        {currentStep === STEP_PHONE_VERIFICATION ? (
          <RegisterPhoneVerificationStep
            control={control}
            onResend={handleResendCode}
            loading={loading}
            customError={error}
          />
        ) : null}
*/}

        {currentStep === STEP_WALLET_CREATION ? (
          <RegisterWalletCreationStep onPushSubscriptionReady={handlePushSubscriptionReady} />
        ) : null}

        {/* Show loading overlay during final registration */}
        {loading && currentStep === STEP_WALLET_CREATION && (
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
