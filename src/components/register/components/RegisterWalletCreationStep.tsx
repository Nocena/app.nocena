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
      <div className="mb-4 space-y-4">
        <div className="rounded-lg bg-gray-800 p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-gray-400">Public Address</label>
            <button
              onClick={() => wallet && copyToClipboard(wallet.address, 'address')}
              className="text-nocena-blue text-xs"
            >
              {copiedAddress ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="rounded-sm bg-gray-900 p-2 font-mono text-sm break-all">{wallet?.address}</p>
        </div>

        <div className="rounded-lg bg-gray-800 p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-gray-400">Private Key</label>
            <button
              onClick={() => wallet && copyToClipboard(wallet.privateKey, 'privateKey')}
              className="text-nocena-blue text-xs"
            >
              {copiedPrivateKey ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="rounded-sm bg-gray-900 p-2 font-mono text-sm break-all">{wallet?.privateKey}</p>
        </div>

        <div className="rounded-lg border border-yellow-600 bg-yellow-900/30 p-4 text-sm text-yellow-400">
          <p className="mb-1 font-bold">⚠️ Important</p>
          <ul className="list-disc space-y-1 pl-5">
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
