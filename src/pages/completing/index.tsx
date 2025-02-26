// src/views/CompletingChallenge.tsx
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicImage from '../../components/ui/ThematicImage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { uploadToIPFS } from '../../utils/ipfs';
import { mintTokens } from '../../utils/blockchain';

interface ChallengeParams {
  type?: string;
  title?: string;
  description?: string;
  reward?: string;
}

const CompletingView = () => {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Type-safe query params
  const { type, title, description, reward } = router.query as ChallengeParams;

  // Media capture handlers
  const captureMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      
      const blob = await new Promise<Blob>(resolve => 
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      );
      
      track.stop();
      return blob;
    } catch (error) {
      console.error('Media capture error:', error);
      throw new Error('Failed to capture media. Please ensure camera access is allowed.');
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setMediaPreview(preview);
  };

  // Main completion handler
  const handleComplete = useCallback(async () => {
    if (!user || !type || !reward) return;

    setIsLoading(true);
    try {
      setStatusMessage('Capturing verification media...');
      const mediaBlob = await captureMedia();

      setStatusMessage('Uploading to decentralized storage...');
      const ipfsHash = await uploadToIPFS(mediaBlob);

      setStatusMessage('Minting your reward...');
      await mintTokens(user.wallet, parseInt(reward));

      setStatusMessage('Updating your profile...');
      await updateUser({
        completedChallenges: [
          ...user.completedChallenges,
          {
            type,
            title: title || 'Unknown Challenge',
            date: new Date().toISOString(),
            proofCID: ipfsHash
          }
        ]
      });

      router.push({
        pathname: '/completion-success',
        query: { reward }
      });
    } catch (error) {
      console.error('Completion error:', error);
      setStatusMessage(error.message || 'Failed to complete challenge');
    } finally {
      setIsLoading(false);
    }
  }, [user, type, reward, title, captureMedia, router, updateUser]);

  // Visual feedback components
  const renderStatusIndicator = () => (
    <div className="flex flex-col items-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-nocen-pink/80 animate-pulse">{statusMessage}</p>
    </div>
  );

  const renderMediaSection = () => (
    <div className="group relative w-full max-w-md aspect-square border-2 border-dashed border-nocen-gray/50 rounded-xl overflow-hidden transition-all hover:border-nocen-pink/30">
      <input
        type="file"
        accept="image/*,video/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />
      {mediaPreview ? (
        <img 
          src={mediaPreview} 
          alt="Challenge proof" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full space-y-2">
          <span className="i-ph-camera-bold text-4xl text-nocen-gray/50 group-hover:text-nocen-pink/50" />
          <p className="text-nocen-gray/50 group-hover:text-nocen-pink/50">
            Click to {mediaPreview ? 'replace' : 'upload'} media proof
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-nocen-dark min-h-screen p-4 flex flex-col items-center justify-center space-y-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Challenge Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-nocen-pink to-nocen-purple bg-clip-text text-transparent">
            {title || 'Complete Your Challenge'}
          </h1>
          <p className="text-nocen-gray/80 text-lg">
            {description || 'Show proof of your adventure to claim your reward'}
          </p>
        </div>

        {/* Progress Visualization */}
        {isLoading ? renderStatusIndicator() : renderMediaSection()}

        {/* Reward Summary */}
        <div className="flex items-center justify-center space-x-3 bg-nocen-dark-gray/30 p-4 rounded-xl">
          <span className="i-ph-coins-bold text-nocen-yellow text-2xl" />
          <span className="text-xl font-mono">
            +{reward || '0'} NOCENIX
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <PrimaryButton
            text="Go Back"
            onClick={() => router.back()}
            variant="outline"
            fullWidth
          />
          <PrimaryButton
            text={mediaPreview ? 'Claim Reward' : 'Capture Now'}
            onClick={handleComplete}
            disabled={isLoading}
            loading={isLoading}
            fullWidth
          />
        </div>

        {/* Security Assurance */}
        <p className="text-center text-sm text-nocen-gray/60">
          <span className="i-ph-lock-key-bold mr-2" />
          Your media is encrypted and stored permanently on IPFS
        </p>
      </div>
    </div>
  );
};

export default CompletingView;