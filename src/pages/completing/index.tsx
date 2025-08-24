'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicContainer from '../../components/ui/ThematicContainer';
import ThematicImage from '../../components/ui/ThematicImage';
import VideoRecordingScreen from './components/VideoRecordingScreen';
import VideoReviewScreen from './components/VideoReviewScreen';
import SelfieScreen from './components/SelfieScreen';
import VerificationScreen from './components/VerificationScreen';
import ClaimingScreen from './components/ClaimingScreen';
import { BackgroundTaskProvider, useBackgroundTasks } from '../../contexts/BackgroundTaskContext';
import { useAuth } from '../../contexts/AuthContext';

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
  type: 'AI' | 'PRIVATE' | 'PUBLIC';
  frequency?: 'daily' | 'weekly' | 'monthly';
  challengeId?: string;
  creatorId?: string;
}

interface CompletingViewProps {
  onBack?: () => void;
}

// Background task IDs for tracking
interface BackgroundTasks {
  videoAnalysisId?: string;
  nftGenerationId?: string;
  verificationPrepId?: string;
  faceMatchingId?: string;
}

const CompletingViewContent: React.FC<CompletingViewProps> = ({ onBack }) => {
  const router = useRouter();
  const backgroundTasks = useBackgroundTasks();
  const { user } = useAuth(); // Get user for NFT generation
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<
    'intro' | 'recording' | 'review' | 'selfie' | 'verification' | 'claiming' | 'success'
  >('intro');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [backgroundTaskIds, setBackgroundTaskIds] = useState<BackgroundTasks>({});

  useEffect(() => {
    const { type, frequency, title, description, reward, challengeId, creatorId } = router.query;

    if (title && description && reward) {
      let challengeData: Challenge;

      if (type === 'AI') {
        challengeData = {
          title: title as string,
          description: description as string,
          challengerName: 'Nocena GPT',
          challengerProfile: '/images/AI.jpg',
          reward: parseInt(reward as string),
          color: 'nocenaPink',
          type: 'AI',
          frequency: frequency as 'daily' | 'weekly' | 'monthly',
        };
      } else if (type === 'PRIVATE') {
        challengeData = {
          title: title as string,
          description: description as string,
          challengerName: 'Friend Challenge',
          challengerProfile: '/images/profile.png',
          reward: parseInt(reward as string),
          color: 'nocenaBlue',
          type: 'PRIVATE',
          challengeId: challengeId as string,
          creatorId: creatorId as string,
        };
      } else if (type === 'PUBLIC') {
        challengeData = {
          title: title as string,
          description: description as string,
          challengerName: 'Business Challenge',
          challengerProfile: '/images/profile.png',
          reward: parseInt(reward as string),
          color: 'nocenaPurple',
          type: 'PUBLIC',
          challengeId: challengeId as string,
        };
      } else {
        challengeData = {
          title: title as string,
          description: description as string,
          challengerName: 'Nocena',
          challengerProfile: '/images/AI.jpg',
          reward: parseInt(reward as string),
          color: 'nocenaPink',
          type: 'AI',
        };
      }

      setChallenge(challengeData);
      setIsLoading(false);
    }
  }, [router.query]);

  // Clean up background tasks when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up background tasks on unmount');
      Object.values(backgroundTaskIds).forEach(taskId => {
        if (taskId) {
          console.log('🚫 Cancelling task:', taskId);
          backgroundTasks.cancelTask(taskId);
        }
      });
    };
  }, [backgroundTaskIds, backgroundTasks]);

  // Debug: Log background task status changes
  useEffect(() => {
    console.log('📊 Background task IDs updated:', backgroundTaskIds);
    
    // Log status of each task
    Object.entries(backgroundTaskIds).forEach(([key, taskId]) => {
      if (taskId) {
        const task = backgroundTasks.getTask(taskId);
        if (task) {
          console.log(`📋 ${key}: ${task.status} (${task.progress}%)`, task.result ? 'HAS RESULT' : 'NO RESULT');
        }
      }
    });
  }, [backgroundTaskIds, backgroundTasks]);

  // Custom back handler for different steps
  const handleStepBack = () => {
    switch (currentStep) {
      case 'intro':
        backgroundTasks.clearAllTasks();
        if (onBack) {
          onBack();
        } else {
          router.back();
        }
        break;
      case 'recording':
        setCurrentStep('intro');
        break;
      case 'review':
        setCurrentStep('recording');
        break;
      case 'selfie':
        setCurrentStep('review');
        break;
      case 'verification':
        setCurrentStep('selfie');
        break;
      case 'claiming':
        setCurrentStep('verification');
        break;
      case 'success':
        router.push('/home');
        break;
      default:
        if (onBack) {
          onBack();
        } else {
          router.back();
        }
    }
  };

  // Cancel handler - always exits the entire completing flow
  const handleCancel = () => {
    console.log('🚫 Cancelling all background tasks');
    backgroundTasks.clearAllTasks();
    
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Communicate the custom back handler to AppLayout
  useEffect(() => {
    const handleCustomBack = (event: CustomEvent) => {
      event.preventDefault();
      handleStepBack();
    };

    window.addEventListener('nocena_custom_back', handleCustomBack as EventListener);

    window.dispatchEvent(
      new CustomEvent('nocena_register_custom_back', {
        detail: { hasCustomBack: true },
      }),
    );

    return () => {
      window.removeEventListener('nocena_custom_back', handleCustomBack as EventListener);
      window.dispatchEvent(
        new CustomEvent('nocena_register_custom_back', {
          detail: { hasCustomBack: false },
        }),
      );
    };
  }, [currentStep]);

  const getChallengeTypeInfo = (challengeType: 'AI' | 'PRIVATE' | 'PUBLIC') => {
    switch (challengeType) {
      case 'AI':
        return {
          badge: 'AI Challenge',
          subtitle: 'AI verified human protocol engaging',
          action: 'Initialize Challenge',
        };
      case 'PRIVATE':
        return {
          badge: 'Private Challenge',
          subtitle: 'Secure peer-to-peer verification',
          action: 'Accept Mission',
        };
      case 'PUBLIC':
        return {
          badge: 'Public Challenge',
          subtitle: 'Location-based verification required',
          action: 'Begin Protocol',
        };
    }
  };

  const handleStartChallenge = () => {
    setCurrentStep('recording');
  };

  const handleVideoRecorded = (blob: Blob, duration: number) => {
    console.log('📹 Video recorded:', blob.size, 'bytes,', duration, 'seconds');
    
    setVideoBlob(blob);
    setVideoDuration(duration);
    
    // 🚀 START BACKGROUND PROCESSING IMMEDIATELY
    if (challenge && user?.id) {
      console.log('🔄 Starting background tasks after video recording...');
      console.log('👤 User ID:', user.id);
      console.log('🎬 Challenge:', challenge.title);
      
      try {
        // Start video analysis immediately
        console.log('📹 Starting video analysis...');
        const videoAnalysisId = backgroundTasks.startVideoAnalysis(blob, challenge);
        console.log('✅ Video analysis started with ID:', videoAnalysisId);
        
        // Start NFT generation with proper user ID
        console.log('🎨 Starting NFT generation...');
        const nftGenerationId = backgroundTasks.startNFTGeneration(user.id);
        console.log('✅ NFT generation started with ID:', nftGenerationId);
        
        // Update state with task IDs
        setBackgroundTaskIds(prev => {
          const newIds = {
            ...prev,
            videoAnalysisId,
            nftGenerationId,
          };
          console.log('📊 Updated background task IDs:', newIds);
          return newIds;
        });
        
        console.log('🎯 Background processing initiated successfully!');
        
      } catch (error) {
        console.error('❌ Error starting background tasks:', error);
      }
    } else {
      console.warn('⚠️ Cannot start background tasks - missing requirements:', {
        hasChallenge: !!challenge,
        hasUser: !!user?.id,
        userId: user?.id,
      });
    }
    
    setCurrentStep('review');
  };

  const handleApproveVideo = () => {
    console.log('✅ Video approved, starting verification prep...');
    
    // 🚀 START VERIFICATION PREP - Since video is approved, start verification prep
    if (videoBlob && challenge) {
      console.log('🔍 Starting verification prep after video approval...');
      
      try {
        const verificationPrepId = backgroundTasks.startVerificationPrep(videoBlob, challenge);
        console.log('✅ Verification prep started with ID:', verificationPrepId);
        
        setBackgroundTaskIds(prev => {
          const newIds = {
            ...prev,
            verificationPrepId,
          };
          console.log('📊 Updated background task IDs after approval:', newIds);
          return newIds;
        });
      } catch (error) {
        console.error('❌ Error starting verification prep:', error);
      }
    } else {
      console.warn('⚠️ Cannot start verification prep - missing video or challenge');
    }
    
    setCurrentStep('selfie');
  };

  const handleRetakeVideo = () => {
    console.log('🔄 Retaking video, cancelling background tasks...');
    
    // Cancel any running background tasks for the old video
    if (backgroundTaskIds.videoAnalysisId) {
      console.log('🚫 Cancelling video analysis:', backgroundTaskIds.videoAnalysisId);
      backgroundTasks.cancelTask(backgroundTaskIds.videoAnalysisId);
    }
    if (backgroundTaskIds.nftGenerationId) {
      console.log('🚫 Cancelling NFT generation:', backgroundTaskIds.nftGenerationId);
      backgroundTasks.cancelTask(backgroundTaskIds.nftGenerationId);
    }
    if (backgroundTaskIds.verificationPrepId) {
      console.log('🚫 Cancelling verification prep:', backgroundTaskIds.verificationPrepId);
      backgroundTasks.cancelTask(backgroundTaskIds.verificationPrepId);
    }
    
    setBackgroundTaskIds({});
    setVideoBlob(null);
    setVideoDuration(0);
    setCurrentStep('recording');
  };

  const handleSelfieCompleted = (blob: Blob) => {
    console.log('🤳 Selfie completed:', blob.size, 'bytes');
    
    setPhotoBlob(blob);
    
    // 🚀 START FACE MATCHING - Now we have both video and selfie
    if (videoBlob) {
      console.log('👥 Starting face matching after selfie...');
      
      try {
        const faceMatchingId = backgroundTasks.startFaceMatching(videoBlob, blob);
        console.log('✅ Face matching started with ID:', faceMatchingId);
        
        setBackgroundTaskIds(prev => {
          const newIds = {
            ...prev,
            faceMatchingId,
          };
          console.log('📊 Updated background task IDs after selfie:', newIds);
          return newIds;
        });
      } catch (error) {
        console.error('❌ Error starting face matching:', error);
      }
    } else {
      console.warn('⚠️ Cannot start face matching - missing video blob');
    }
    
    setCurrentStep('verification');
  };

  const handleVerificationComplete = (result: {
    verificationResult: any;
    challenge: Challenge;
    videoBlob: Blob;
    photoBlob: Blob;
  }) => {
    console.log('✅ Verification completed, proceeding to claiming:', result);
    setVerificationResult(result.verificationResult);
    setCurrentStep('claiming');
  };

  const handleClaimingComplete = (result: any) => {
    console.log('🎉 Claiming completed:', result);
    setCurrentStep('success');
  };

  const handleComplete = () => {
    console.log('🏁 Challenge completion flow finished');
    backgroundTasks.clearAllTasks();
    router.push('/home');
  };

  if (isLoading || !challenge) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white px-6">
        <div className="w-16 h-16 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mb-6" />
        <div className="text-3xl font-bold animate-pulse mb-2">LOADING CHALLENGE...</div>
        <div className="text-lg text-nocenaPink animate-bounce">Preparing your mission</div>
      </div>
    );
  }

  // Step 2: Video Recording
  if (currentStep === 'recording') {
    return (
      <VideoRecordingScreen 
        challenge={challenge} 
        onVideoRecorded={handleVideoRecorded} 
        onBack={handleStepBack} 
      />
    );
  }

  // Step 3: Video Review
  if (currentStep === 'review' && videoBlob) {
    return (
      <VideoReviewScreen
        challenge={challenge}
        videoBlob={videoBlob}
        videoDuration={videoDuration}
        onApproveVideo={handleApproveVideo}
        onRetakeVideo={handleRetakeVideo}
        onBack={handleStepBack}
        onCancel={handleCancel}
        backgroundTaskIds={backgroundTaskIds}
      />
    );
  }

  // Step 4: Selfie Screen
  if (currentStep === 'selfie' && videoBlob) {
    return (
      <SelfieScreen
        challenge={challenge}
        onSelfieCompleted={handleSelfieCompleted}
        onBack={handleStepBack}
        onCancel={handleCancel}
      />
    );
  }

  // Step 5: Verification Screen
  if (currentStep === 'verification' && videoBlob && photoBlob) {
    return (
      <VerificationScreen
        challenge={challenge}
        videoBlob={videoBlob}
        photoBlob={photoBlob}
        onVerificationComplete={handleVerificationComplete}
        onBack={handleStepBack}
        onCancel={handleCancel}
        backgroundTaskIds={backgroundTaskIds}
      />
    );
  }

  // Step 6: Claiming Screen
  if (currentStep === 'claiming' && videoBlob && photoBlob && verificationResult) {
    return (
      <ClaimingScreen
        challenge={challenge}
        videoBlob={videoBlob}
        photoBlob={photoBlob}
        verificationResult={verificationResult}
        onClaimComplete={handleClaimingComplete}
        onBack={handleStepBack}
        onCancel={handleCancel}
        backgroundTaskIds={backgroundTaskIds}
      />
    );
  }

  // Step 7: Success Screen
  if (currentStep === 'success') {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white px-6">
        <div
          className="flex flex-col items-center justify-center flex-1"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 2rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)',
          }}
        >
          <div className="w-20 h-20 bg-nocenaPurple rounded-full flex items-center justify-center mb-6">
            <Image src="/nocenix.ico" alt="Success" width={40} height={40} />
          </div>
          <h2 className="text-2xl font-bold text-nocenaPurple mb-3">Challenge Complete!</h2>
          <p className="text-lg mb-1">+{challenge.reward} Nocenix earned</p>
          <p className="text-sm text-gray-400 mb-8">Tokens have been added to your wallet</p>
          <PrimaryButton onClick={handleComplete} text="Continue" className="w-full max-w-sm" />
        </div>
      </div>
    );
  }

  // Step 1: Challenge Intro with Background Task Status
  const typeInfo = getChallengeTypeInfo(challenge.type);

  return (
    <div
      className="h-screen bg-black text-white flex flex-col"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      {/* Back Button - Fixed Position */}
      <div
        className="absolute left-4 z-20"
        style={{
          top: 'calc(env(safe-area-inset-top) + 16px)',
        }}
      >
        <button onClick={handleStepBack} className="focus:outline-none" aria-label="Back">
          <ThematicContainer
            color="nocenaBlue"
            glassmorphic={true}
            asButton={false}
            rounded="full"
            className="w-12 h-12 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </ThematicContainer>
        </button>
      </div>

      {/* Main Content - Scrollable */}
      <div
        className="flex-1 flex flex-col px-6 overflow-y-auto"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 80px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)',
        }}
      >
        {/* Challenge Type Badge */}
        <div className="flex justify-center mb-6">
          <ThematicContainer asButton={false} color={challenge.color as any} className="px-6 py-2" rounded="xl">
            <span className="text-sm font-medium tracking-wider uppercase">{typeInfo.badge}</span>
          </ThematicContainer>
        </div>

        {/* Subtitle - Clean and Mysterious */}
        <div className="text-center mb-8">
          <div className="text-xl font-light text-nocenaPink tracking-wide opacity-90">{typeInfo.subtitle}</div>
        </div>

        {/* Main Challenge Card - Flexible height */}
        <div className="flex-1 mb-6">
          <ThematicContainer
            asButton={false}
            glassmorphic={true}
            color={challenge.color as any}
            rounded="xl"
            className="h-full px-6 py-6 relative overflow-hidden"
          >
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col">
              {/* Challenge Title - Clean and Bold */}
              <div className="text-2xl font-light mb-4 text-center leading-tight tracking-wide">{challenge.title}</div>

              {/* Challenge Description */}
              <div className="text-base text-gray-200 mb-6 text-center leading-relaxed font-light opacity-90">
                {challenge.description}
              </div>

              {/* User and Reward - Clean Layout */}
              <div className="flex items-center justify-between mb-6 bg-black/20 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <ThematicImage className="rounded-full">
                    <Image
                      src={challenge.challengerProfile}
                      alt="Challenger Profile"
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  </ThematicImage>
                  <span className="text-base font-medium">{challenge.challengerName}</span>
                </div>

                <ThematicContainer asButton={false} color="nocenaPink" className="px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">{challenge.reward}</span>
                    <Image src="/nocenix.ico" alt="Nocenix" width={20} height={20} />
                  </div>
                </ThematicContainer>
              </div>

              {/* Verification Process - Futuristic */}
              <div className="bg-black/30 rounded-xl p-5 border border-gray-700/50 flex-1 flex flex-col justify-center">
                <div className="text-center text-base font-medium mb-4 text-gray-300 tracking-wider uppercase">
                  Verification Protocol
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <div className="w-2 h-2 bg-nocenaPink rounded-full opacity-80"></div>
                    <span className="font-light">Record Challenge</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <div className="w-2 h-2 bg-nocenaPink rounded-full opacity-80"></div>
                    <span className="font-light">Identity Scan</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <div className="w-2 h-2 bg-nocenaPink rounded-full opacity-80"></div>
                    <span className="font-light">AI Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <div className="w-2 h-2 bg-nocenaPink rounded-full opacity-80"></div>
                    <span className="font-light">Token Transfer</span>
                  </div>
                </div>

                {/* Requirements - Minimal */}
                <div className="text-center text-xs text-gray-400 opacity-70">
                  Optimal lighting • 3+ second duration • Clear facial recognition
                </div>
              </div>
            </div>
          </ThematicContainer>
        </div>

        {/* Action Button - Always visible at bottom */}
        <div className="flex-shrink-0 mt-6">
          <PrimaryButton className="w-full" onClick={handleStartChallenge} text={typeInfo.action} />
        </div>
      </div>
    </div>
  );
};

// Main wrapper component with BackgroundTaskProvider
const CompletingView: React.FC<CompletingViewProps> = (props) => {
  return (
    <BackgroundTaskProvider>
      <CompletingViewContent {...props} />
    </BackgroundTaskProvider>
  );
};

export default CompletingView;