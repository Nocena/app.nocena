// pages/test-claiming.tsx - Development claiming test page
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ClaimingScreen from './completing/components/ClaimingScreen';

const TestClaimingPage = () => {
  const router = useRouter();
  const [claimingData, setClaimingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only allow this page in development
    if (process.env.NODE_ENV !== 'development') {
      router.push('/home');
      return;
    }

    // Get the data from sessionStorage
    const savedData = sessionStorage.getItem('dev-claiming-data');
    if (!savedData) {
      alert('No test data found. Please use the dev button from home page.');
      router.push('/home');
      return;
    }

    try {
      const data = JSON.parse(savedData);

      // Create mock blobs since they can't be stored in sessionStorage
      const createMockVideoBlob = (): Blob => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Mock Video', canvas.width / 2, canvas.height / 2);
          ctx.font = '24px Arial';
          ctx.fillText(data.challenge?.title || 'Test Challenge', canvas.width / 2, canvas.height / 2 + 60);
        }

        // Convert canvas to blob
        return new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve(blob || new Blob(['mock video'], { type: 'video/mp4' }));
            },
            'image/jpeg',
            0.8,
          );
        }) as any;
      };

      const createMockPhotoBlob = (): Blob => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f0f23';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw a simple face
          ctx.fillStyle = '#ffdbac';
          ctx.beginPath();
          ctx.arc(150, 180, 80, 0, 2 * Math.PI);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(130, 160, 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(170, 160, 8, 0, 2 * Math.PI);
          ctx.fill();

          // Smile
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(150, 180, 40, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.stroke();

          // Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '18px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Mock Selfie', 150, 320);
          ctx.font = '14px Arial';
          ctx.fillText('Dev Mode', 150, 345);
        }

        return new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve(blob || new Blob(['mock photo'], { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.8,
          );
        }) as any;
      };

      // Create the blobs and set up the claiming data
      Promise.all([createMockVideoBlob(), createMockPhotoBlob()]).then(([videoBlob, photoBlob]) => {
        setClaimingData({
          ...data,
          videoBlob,
          photoBlob,
        });
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error parsing claiming test data:', error);
      alert('Invalid test data. Please try again from home page.');
      router.push('/home');
    }
  }, [router]);

  const handleClaimComplete = (result: any) => {
    console.log('🎉 Dev claiming completed:', result);

    // Show success message
    alert(
      `Development claiming test completed!\nTokens: ${result.tokensEarned}\nCompletion ID: ${result.completionId}`,
    );

    // Clean up
    sessionStorage.removeItem('dev-claiming-data');

    // Return to home
    router.push('/home');
  };

  const handleBack = () => {
    // Clean up and return to home
    sessionStorage.removeItem('dev-claiming-data');
    router.push('/home');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Setting up claiming test...</p>
        </div>
      </div>
    );
  }

  if (!claimingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p>No test data available</p>
          <button onClick={() => router.push('/home')} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Development Mode Indicator */}
      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="bg-yellow-900/90 border border-yellow-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-medium">🧪 Development Claiming Test</span>
            <span className="text-yellow-300 text-sm">Challenge: {claimingData.challenge?.title}</span>
          </div>
        </div>
      </div>

      {/* Claiming Screen */}
      <div className="pt-20">
        <ClaimingScreen
          challenge={claimingData.challenge}
          videoBlob={claimingData.videoBlob}
          photoBlob={claimingData.photoBlob}
          verificationResult={claimingData.verificationResult}
          onClaimComplete={handleClaimComplete}
          onBack={handleBack}
        />
      </div>
    </div>
  );
};

export default TestClaimingPage;
