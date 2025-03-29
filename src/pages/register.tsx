import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { registerUser, markDiscordInviteAsUsed } from '../lib/api/dgraph';
import { createPolygonWallet } from '../lib/api/polygon';
import { verifyPhoneNumber } from '../lib/utils/verification';
import PrimaryButton from '../components/ui/PrimaryButton';
import { User, useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../lib/utils/security';
import { formatPhoneToE164 } from '../lib/utils/phoneUtils';
import InviteCodeInput from '../components/InviteCodeInput';
import PhoneVerification from '../components/PhoneVerification';
import PhoneInput from 'react-phone-input-2';
import ThematicText from '../components/ui/ThematicText';
import { hashPassword } from '../lib/utils/passwordUtils';
import Image from 'next/image';
import 'react-phone-input-2/lib/style.css';

// Import global styles for the phone input
import '../styles/phone-input.css';

const RegisterPage = () => {
  // Registration steps
  const STEP_INVITE_CODE = 0;
  const STEP_WELCOME = 1;
  const STEP_REGISTER_FORM = 2;
  const STEP_PHONE_VERIFICATION = 3;
  const STEP_WALLET_CREATION = 4;

  const [currentStep, setCurrentStep] = useState(STEP_INVITE_CODE);
  const [inviteCode, setInviteCode] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<{ address: string; privateKey: string } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  // Handle welcome animation
  useEffect(() => {
    if (currentStep === STEP_WELCOME) {
      const timer = setTimeout(() => {
        setCurrentStep(STEP_REGISTER_FORM);
      }, 4000); // 4 seconds for welcome animation

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleInviteCodeValid = (code: string) => {
    setInviteCode(code);
    setCurrentStep(STEP_WELCOME);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Sanitize user inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPhoneNumber = sanitizeInput(phoneNumber);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedUsername || !sanitizedPhoneNumber || !sanitizedPassword) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      // Format phone number to E.164 format before sending to Twilio
      const formattedPhone = formatPhoneToE164(sanitizedPhoneNumber);

      // Send verification code via Twilio
      const success = await verifyPhoneNumber(formattedPhone, 'SEND');

      if (success) {
        setCurrentStep(STEP_PHONE_VERIFICATION);
      } else {
        setError('Failed to send verification code. Please check the phone number and try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (code: string) => {
    setError('');
    setLoading(true);
    setVerificationCode(code);

    try {
      // Format phone number to E.164 format before verifying
      const formattedPhone = formatPhoneToE164(phoneNumber);

      // Verify the code using Twilio
      const isValid = await verifyPhoneNumber(formattedPhone, 'VERIFY', code);

      if (isValid) {
        // Create wallet
        const newWallet = createPolygonWallet();
        setWallet(newWallet);

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

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      // Format phone number to E.164 format before resending
      const formattedPhone = formatPhoneToE164(phoneNumber);

      // Resend verification code via Twilio
      const success = await verifyPhoneNumber(formattedPhone, 'SEND');

      if (success) {
        // Optionally show a success notification
      } else {
        setError('Failed to resend verification code. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    setError('');
    setLoading(true);

    if (!wallet) {
      setError('Wallet creation failed. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // Securely hash the password - the salt will be generated automatically
      const securePasswordHash = await hashPassword(password);

      // Format phone number to E.164 format before storing
      const formattedPhone = formatPhoneToE164(phoneNumber);

      // Register user with properly formatted phone number and secure password hash
      const addedUser = await registerUser(
        username,
        formattedPhone,
        securePasswordHash, // Securely hashed password
        '/images/profile.png',
        wallet.address,
        '0'.repeat(365),
        '0'.repeat(52),
        '0'.repeat(12),
      );

      if (addedUser) {
        // Mark the invite code as used
        await markDiscordInviteAsUsed(inviteCode, addedUser.id);

        // Login with our updated AuthContext
        await login(addedUser);
        router.push('/home');
      } else {
        setError('Failed to register. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'address' | 'privateKey') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedPrivateKey(true);
        setTimeout(() => setCopiedPrivateKey(false), 2000);
      }
    });
  };

  const renderWelcomeStep = () => (
    <div className="w-full max-w-md mx-auto text-center">
      <div className="flex flex-col items-center justify-center h-60">
        <div className="max-w-full h-auto mx-auto mb-10 relative">
          <Image src="/logo/eyes.png" alt="Nocena Logo" width={256} height={256} priority />
        </div>
        <h1 className="text-3xl font-semibold mb-4">
          <ThematicText text="Welcome" isActive />
          to the <ThematicText text="challenge" isActive />
        </h1>
        <p className="text-lg text-gray-300">Get ready to earn while exploring...</p>
      </div>
    </div>
  );

  const renderRegisterFormStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="max-w-full h-auto mx-auto mb-40 relative">
          <Image src="/logo/eyes.png" alt="Nocena Logo" width={256} height={256} priority />
        </div>
      </div>

      <form onSubmit={handleRegisterSubmit} className="space-y-4">
        <div className="mb-3">
          <label htmlFor="username" className="block mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="phoneNumber" className="block mb-1">
            Phone Number
          </label>
          <PhoneInput
            country={'us'}
            value={phoneNumber}
            onChange={setPhoneNumber}
            enableSearch={true}
            searchPlaceholder="Search"
            inputStyle={{
              width: '100%',
              backgroundColor: '#1f2937',
              color: 'white',
              border: 'none',
              borderRadius: '1rem',
              height: '42px',
              padding: '0.5rem 1rem 0.5rem 3.5rem',
            }}
            buttonStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '1rem 0 0 1rem',
            }}
            dropdownStyle={{
              backgroundColor: '#111827',
              color: 'white',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              margin: '0.25rem 0',
              maxHeight: '300px',
            }}
            searchStyle={{
              backgroundColor: '#1f2937',
              color: 'white',
              width: '100%',
              margin: '0',
              border: 'none',
              borderBottom: '1px solid #374151',
              borderRadius: '0',
            }}
            containerClass="w-full"
            dropdownClass="!bg-gray-900 !text-white"
            searchClass="!bg-gray-800 !text-white !border-gray-700"
            containerStyle={{
              width: '100%',
            }}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="block mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="mb-3">
          <PrimaryButton
            text={loading ? 'Processing...' : 'Continue'}
            onClick={handleRegisterSubmit}
            disabled={loading || !username || !phoneNumber || !password}
          />
        </div>
      </form>
    </div>
  );

  const renderWalletCreationStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="max-w-full h-auto mx-auto mb-40 relative">
          <Image src="/logo/eyes.png" alt="Nocena Logo" width={256} height={256} priority />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your Wallet Is Ready</h2>
        <p className="text-gray-400 mb-4">Save these details in a secure place</p>
      </div>

      <div className="space-y-4 mb-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400">Public Address</label>
            <button
              onClick={() => wallet && copyToClipboard(wallet.address, 'address')}
              className="text-xs text-nocenaBlue"
            >
              {copiedAddress ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-sm font-mono break-all bg-gray-900 p-2 rounded">{wallet?.address}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-400">Private Key</label>
            <button
              onClick={() => wallet && copyToClipboard(wallet.privateKey, 'privateKey')}
              className="text-xs text-nocenaBlue"
            >
              {copiedPrivateKey ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-sm font-mono break-all bg-gray-900 p-2 rounded">{wallet?.privateKey}</p>
        </div>

        <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 p-4 rounded-lg text-yellow-400 text-sm">
          <p className="font-bold mb-1">⚠️ Important</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>This information will only be shown once.</li>
            <li>Save your private key in a secure place.</li>
            <li>Never share your private key with anyone.</li>
            <li>Your wallet is where your earned tokens will be stored.</li>
          </ul>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="mb-3">
        <PrimaryButton
          text={loading ? 'Processing...' : 'I Have Saved My Wallet Information'}
          onClick={handleCompleteRegistration}
          disabled={loading}
        />
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-nocenaBg text-white">
      <div className="w-full max-w-md mx-4">
        {currentStep === STEP_INVITE_CODE && <InviteCodeInput onValidCode={handleInviteCodeValid} />}
        {currentStep === STEP_WELCOME && renderWelcomeStep()}
        {currentStep === STEP_REGISTER_FORM && renderRegisterFormStep()}
        {currentStep === STEP_PHONE_VERIFICATION && (
          <PhoneVerification
            phoneNumber={phoneNumber}
            onVerify={handleVerificationSubmit}
            onResend={handleResendCode}
          />
        )}
        {currentStep === STEP_WALLET_CREATION && renderWalletCreationStep()}
      </div>
    </div>
  );
};

export default RegisterPage;
