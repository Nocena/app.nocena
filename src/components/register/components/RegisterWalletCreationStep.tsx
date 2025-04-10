import { useState } from 'react';
import { useRouter } from 'next/router';
import PrimaryButton from '../../ui/PrimaryButton';

interface Props {
  wallet: {
    address: string;
    privateKey: string;
  };
}

const RegisterWalletCreationStep = ({ wallet }: Props) => {
  const router = useRouter();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);

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

  return (
    <>
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

      <div className="mb-3">
        <PrimaryButton text="I Have Saved My Wallet Information" onClick={() => router.push('/home')} />
      </div>
    </>
  );
};

export default RegisterWalletCreationStep;
