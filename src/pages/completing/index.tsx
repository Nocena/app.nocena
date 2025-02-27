import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicImage from '../../components/ui/ThematicImage';
import ThematicText from '../../components/ui/ThematicText';

interface ChallengeParams {
  type?: string;
  title?: string;
  description?: string;
  reward?: string;
}

interface CompletedChallenge {
  type: string;
  title: string;
  date: string;
  proofCID: string;
}

const nocenixIcon = '/nocenix.ico';

const CompletingView = () => {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Type-safe query params
  const { type, title, description, reward } = router.query as ChallengeParams;

  // Helper function to upload to IPFS
  const uploadToIPFS = async (blob: Blob): Promise<string> => {
    // Implement your IPFS upload logic here
    // This is a placeholder function
    return new Promise((resolve) => {
      // Simulate upload delay
      setTimeout(() => {
        resolve(`ipfs-${Date.now()}`);
      }, 1500);
    });
  };

  // Helper function to mint tokens
  const mintTokens = async (wallet: string, amount: number): Promise<void> => {
    // Implement your token minting logic here
    // This is a placeholder function
    return new Promise((resolve) => {
      // Simulate minting delay
      setTimeout(() => {
        resolve();
      }, 1500);
    });
  };

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
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(bitmap, 0, 0);
      
      const blob = await new Promise<Blob>(resolve => 
        canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.8)
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
    setMediaBlob(file);
  };

  // Main completion handler
  const handleComplete = useCallback(async () => {
    if (!user || !type || !reward) return;

    setIsLoading(true);
    setIsFinishing(true);
    try {
      if (!mediaBlob) {
        setStatusMessage('Capturing verification media...');
        const capturedBlob = await captureMedia();
        setMediaBlob(capturedBlob);
        const preview = URL.createObjectURL(capturedBlob);
        setMediaPreview(preview);
      }

      setStatusMessage('Uploading to decentralized storage...');
      const ipfsHash = await uploadToIPFS(mediaBlob!);

      setStatusMessage('Minting your reward...');
      await mintTokens(user.wallet || '', parseInt(reward));

      setStatusMessage('Updating your profile...');
      const completedChallenge: CompletedChallenge = {
        type,
        title: title || 'Unknown Challenge',
        date: new Date().toISOString(),
        proofCID: ipfsHash
      };
      
      await updateUser({
        completedChallenges: [
          ...(user.completedChallenges || []),
          completedChallenge
        ]
      });

      router.push({
        pathname: '/completion-success',
        query: { reward }
      });
    } catch (error: any) {
      console.error('Completion error:', error);
      setStatusMessage(error.message || 'Failed to complete challenge');
      setIsFinishing(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, type, reward, title, captureMedia, router, updateUser, mediaBlob]);

  const handleFileUploadClick = () => {
    document.getElementById('file-upload')?.click();
  };
  
  const handleCameraClick = () => {
    captureMedia().then(blob => {
      setMediaBlob(blob);
      const preview = URL.createObjectURL(blob);
      setMediaPreview(preview);
    }).catch(error => {
      console.error('Error capturing media:', error);
      alert('Failed to access camera. Please ensure camera access is allowed.');
    });
  };

  return (
    <div className="flex flex-col items-center justify-start px-4 py-8 w-full max-w-md mx-auto overflow-y-auto pb-28">
      {/* Challenge Circle Image with AI Icon */}
      <ThematicImage className="rounded-full mb-6">
        <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
          <Image
            src="/ai.png"
            alt="Challenge"
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        </div>
      </ThematicImage>

      {/* Challenge Title */}
      <ThematicText text={title || ''} isActive={true} className="text-xl mb-4" />

      {/* Token Reward Display */}
      <div className="flex items-center justify-center mb-6 py-2 px-6 rounded-full bg-[#2A3B4D]">
        <Image 
          src={nocenixIcon} 
          alt="Nocenix" 
          width={24} 
          height={24}
          className="mr-2"
        />
        <span className="font-bold text-white">{reward || "1"} NOCENIX</span>
      </div>

      {/* Challenge Description */}
      <p className="text-center text-gray-400 mb-8 max-w-xs">
        {description}
      </p>

      {/* Preview Area (if media selected) */}
      {mediaPreview && !isLoading && (
        <div className="w-full mb-6">
          <div className="rounded-lg overflow-hidden">
            <img 
              src={mediaPreview} 
              alt="Preview" 
              className="w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Status Message (if loading) */}
      {isLoading && (
        <div className="w-full mb-6 text-center">
          <p className="text-blue-400">{statusMessage}</p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        id="file-upload"
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        capture="environment"
      />

      {/* Action Buttons */}
      <div className="w-full space-y-4 mt-auto mb-10">
        <PrimaryButton
          text="Upload file"
          onClick={handleFileUploadClick}
          isActive={false}
          disabled={isLoading}
        />
        
        <PrimaryButton
          text="Take photo"
          onClick={handleCameraClick}
          isActive={false}
          disabled={isLoading}
        />
        
        <PrimaryButton
          text="Finish now"
          onClick={handleComplete}
          isActive={isFinishing}
          disabled={isLoading || !mediaBlob}
        />
      </div>
    </div>
  );
};

export default CompletingView;