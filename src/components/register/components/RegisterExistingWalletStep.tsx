import { useState } from 'react';
import PrimaryButton from '../../ui/PrimaryButton';
import ThematicContainer from '../../ui/ThematicContainer';

interface Props {
  onWalletConnected: (walletAddress: string, lensProfiles?: any[]) => void;
}

interface LensProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  picture: string;
}

const RegisterExistingWalletStep = ({ onWalletConnected }: Props) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock function to fetch Lens profiles - replace with actual Lens Protocol integration
  const fetchLensProfiles = async (address: string): Promise<LensProfile[]> => {
    try {
      setLoading(true);
      // Replace this with actual Lens Protocol API call
      const response = await fetch(`/api/lens/profiles?wallet=${address}`);
      if (response.ok) {
        const profiles = await response.json();
        return profiles;
      }
      return [];
    } catch (error) {
      console.error('Error fetching Lens profiles:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!walletAddress || walletAddress.length < 40) {
      setError('Please enter a valid wallet address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Fetch Lens profiles for this wallet
      const profiles = await fetchLensProfiles(walletAddress);
      onWalletConnected(walletAddress, profiles);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col px-6 py-8">
      <div className="text-center mb-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-nocenaPink via-purple-500 to-nocenaBlue rounded-2xl animate-pulse opacity-20"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-nocenaPink to-purple-600 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white border-opacity-10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Connect Your Wallet</h2>
        <p className="text-gray-400 text-sm font-light">Enter your existing wallet address to link your identity</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300 tracking-wide">WALLET ADDRESS</label>
          <div className="relative">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-4 bg-black bg-opacity-40 border border-gray-600 border-opacity-50 rounded-xl text-white placeholder-gray-500 focus:border-nocenaPink focus:outline-none focus:ring-1 focus:ring-nocenaPink transition-all font-mono text-sm backdrop-blur-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              </svg>
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-xs font-light">{error}</p>
          )}
        </div>

        <ThematicContainer color="nocenaBlue" asButton={false} glassmorphic={true} rounded="xl" className="p-4 border border-blue-500 border-opacity-20">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="text-xs text-blue-200 font-light leading-relaxed">
              <p className="font-medium mb-1 text-blue-100">Identity Sync</p>
              <p>We'll automatically detect any Lens Protocol profiles and social connections associated with your wallet address.</p>
            </div>
          </div>
        </ThematicContainer>

        <PrimaryButton 
          text={loading ? "CONNECTING..." : "CONNECT WALLET"} 
          onClick={handleConnect}
          className="w-full"
          disabled={!walletAddress || walletAddress.length < 40 || loading}
        />
      </div>
    </div>
  );
};

export default RegisterExistingWalletStep;