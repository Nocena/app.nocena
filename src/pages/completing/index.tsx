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

const CompletingView: React.FC<CompletingViewProps> = ({ onBack }) => {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<
    'intro' | 'recording' | 'review' | 'selfie' | 'verification' | 'success'
  >('intro');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  useEffect(() => {
    const { type, frequency, title, description, reward, challengeId, creatorId } = router.query;

    if (title && description && reward) {
      let challengeData: Challenge;

      if (type === 'AI') {
        challengeData = {
          title: title as string,
          description: description as string,
          challengerName: 'Nocena GPT',
          challengerProfile: '/images/ai.png',
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
          challengerProfile: '/images/ai.png',
          reward: parseInt(reward as string),
          color: 'nocenaPink',
          type: 'AI',
        };
      }

      setChallenge(challengeData);
      setIsLoading(false);
    }
  }, [router.query]);

  // Custom back handler for different steps
  const handleStepBack = () => {
    switch (currentStep) {
      case 'intro':
        // Go back to previous page (home, map, etc.)
        if (onBack) {
          onBack();
        } else {
          router.back();
        }
        break;
      case 'recording':
        // Go back to intro
        setCurrentStep('intro');
        break;
      case 'review':
        // Go back to recording
        setCurrentStep('recording');
        break;
      case 'selfie':
        // Go back to review
        setCurrentStep('review');
        break;
      case 'verification':
        // Go back to selfie
        setCurrentStep('selfie');
        break;
      case 'success':
        // Go back to home or wherever appropriate
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

  // Communicate the custom back handler to AppLayout
  useEffect(() => {
    // Create a custom event to tell AppLayout to use our back handler
    const handleCustomBack = (event: CustomEvent) => {
      event.preventDefault();
      handleStepBack();
    };

    // Listen for the custom back event
    window.addEventListener('nocena_custom_back', handleCustomBack as EventListener);

    // Dispatch event to tell AppLayout we want custom back handling
    window.dispatchEvent(
      new CustomEvent('nocena_register_custom_back', {
        detail: { hasCustomBack: true },
      }),
    );

    return () => {
      window.removeEventListener('nocena_custom_back', handleCustomBack as EventListener);
      // Tell AppLayout we no longer need custom back handling
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
    setVideoBlob(blob);
    setVideoDuration(duration);
    setCurrentStep('review');
  };

  const handleApproveVideo = () => {
    setCurrentStep('selfie');
  };

  const handleRetakeVideo = () => {
    setVideoBlob(null);
    setVideoDuration(0);
    setCurrentStep('recording');
  };

  const handleSelfieCompleted = (blob: Blob) => {
    setPhotoBlob(blob);
    setCurrentStep('verification');
  };

  const handleVerificationComplete = (result: any) => {
    setVerificationResult(result);
    setCurrentStep('success');
  };

  const handleComplete = () => {
    router.push('/home'); // Or wherever you want to redirect after completion
  };

  if (isLoading || !challenge) {
    return (
      <div className="flex flex-col items-center justify-center text-white h-screen pt-20">
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
        onVideoRecorded={handleVideoRecorded} // This now expects (blob, duration)
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
      />
    );
  }

  // Step 4: Selfie Screen
  if (currentStep === 'selfie' && videoBlob) {
    return <SelfieScreen challenge={challenge} onSelfieCompleted={handleSelfieCompleted} onBack={handleStepBack} />;
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
      />
    );
  }

  // Step 1: Challenge Intro
  const typeInfo = getChallengeTypeInfo(challenge.type);

  return (
    <div className="text-white h-screen overflow-hidden pt-20 -mt-20">
      {/* Content */}
      <div className="h-full flex flex-col px-6">
        {/* Challenge Type Badge */}
        <div className="flex justify-center mb-6 mt-4">
          <ThematicContainer asButton={false} color={challenge.color as any} className="px-6 py-2" rounded="xl">
            <span className="text-sm font-medium tracking-wider uppercase">{typeInfo.badge}</span>
          </ThematicContainer>
        </div>

        {/* Subtitle - Clean and Mysterious */}
        <div className="text-center mb-8">
          <div className="text-xl font-light text-nocenaPink tracking-wide opacity-90">{typeInfo.subtitle}</div>
        </div>

        {/* Main Challenge Card */}
        <div className="flex-1 flex flex-col mb-6">
          <ThematicContainer
            asButton={false}
            glassmorphic={true}
            color={challenge.color as any}
            rounded="xl"
            className="flex-1 px-6 py-6 relative overflow-hidden"
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
                      className="w-10 h-10 object-cover"
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
              <div className="bg-black/30 rounded-xl p-5 mb-4 border border-gray-700/50">
                <div className="text-center text-base font-medium mb-4 text-gray-300 tracking-wider uppercase">
                  Verification Protocol
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
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
              </div>

              {/* Requirements - Minimal */}
              <div className="text-center text-xs text-gray-400 opacity-70">
                Optimal lighting • 3+ second duration • Clear facial recognition
              </div>
            </div>
          </ThematicContainer>
        </div>

        {/* Action Button - Clean and Futuristic */}
        <PrimaryButton className="w-full mb-4" onClick={handleStartChallenge} text={typeInfo.action} />
      </div>
    </div>
  );
};

export default CompletingView;
