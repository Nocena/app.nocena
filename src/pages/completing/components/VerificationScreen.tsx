'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import { SimpleVerificationService, VerificationStep } from '../../../lib/verification/simpleVerificationService';

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
  type: 'AI' | 'PRIVATE' | 'PUBLIC';
}

interface VerificationScreenProps {
  challenge: Challenge;
  videoBlob: Blob;
  photoBlob: Blob;
  onVerificationComplete: (result: any) => void;
  onBack: () => void;
}

const VerificationScreen: React.FC<VerificationScreenProps> = ({
  challenge,
  videoBlob,
  photoBlob,
  onVerificationComplete,
  onBack,
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [verificationStage, setVerificationStage] = useState<
    'ready' | 'verifying' | 'complete' | 'claiming' | 'success' | 'failed'
  >('ready');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [currentStepMessage, setCurrentStepMessage] = useState('Ready to verify submission');
  const [challengeDescription, setChallengeDescription] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Create object URLs for media
  useEffect(() => {
    const vUrl = URL.createObjectURL(videoBlob);
    const pUrl = URL.createObjectURL(photoBlob);

    setVideoUrl(vUrl);
    setPhotoUrl(pUrl);

    return () => {
      URL.revokeObjectURL(vUrl);
      URL.revokeObjectURL(pUrl);
    };
  }, [videoBlob, photoBlob]);

  const handleVideoClick = async () => {
    if (videoRef.current) {
      try {
        if (isVideoPlaying) {
          videoRef.current.pause();
          setIsVideoPlaying(false);
        } else {
          await videoRef.current.play();
          setIsVideoPlaying(true);
        }
      } catch (error) {
        console.error('Video play error:', error);
        setTimeout(async () => {
          try {
            await videoRef.current?.play();
            setIsVideoPlaying(true);
          } catch (retryError) {
            console.error('Video retry error:', retryError);
          }
        }, 100);
      }
    }
  };

  const startVerification = async () => {
    setVerificationStage('verifying');

    console.group('🔍 NOCENA VERIFICATION PROCESS STARTED');
    console.log('Challenge:', challenge.title);
    console.log('Video:', { size: `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`, type: videoBlob.type });
    console.log('Photo:', { size: `${(photoBlob.size / 1024).toFixed(2)} KB`, type: photoBlob.type });
    console.groupEnd();

    try {
      const verificationService = new SimpleVerificationService((steps) => {
        // Update UI with step progress
        setVerificationSteps(steps);

        // Update current step message
        const runningStep = steps.find((s) => s.status === 'running');
        if (runningStep) {
          setCurrentStepMessage(runningStep.message);
        }

        // Log step completions
        const completedStep = steps.find((s) => s.status === 'completed' && !s.id.includes('logged'));
        if (completedStep) {
          console.log(`✅ ${completedStep.name} COMPLETED:`, {
            confidence: `${Math.round((completedStep.confidence || 0) * 100)}%`,
            message: completedStep.message,
          });
          // Mark as logged to prevent duplicate logs
          completedStep.id += '-logged';
        }

        const failedStep = steps.find((s) => s.status === 'failed' && !s.id.includes('logged'));
        if (failedStep) {
          console.error(`❌ ${failedStep.name} FAILED:`, failedStep.message);
          // Mark as logged to prevent duplicate logs
          failedStep.id += '-logged';
        }
      });

      console.log('🚀 Starting real verification process...');

      const result = await verificationService.runFullVerification(videoBlob, photoBlob, challenge.description);

      console.group('📊 NOCENA VERIFICATION RESULTS');
      console.log('Overall result:', result.passed ? '✅ PASSED' : '❌ FAILED');
      console.log('Overall confidence:', `${Math.round(result.overallConfidence * 100)}%`);
      console.groupEnd();

      setVerificationResult(result);

      if (result.passed) {
        setVerificationStage('complete');
        setCurrentStepMessage('All verification checks passed!');
      } else {
        setVerificationStage('failed');
        setCurrentStepMessage('Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('💥 NOCENA VERIFICATION ERROR:', error);
      setVerificationStage('failed');
      setCurrentStepMessage('Verification process encountered an error.');
    }
  };

  const handleClaimTokens = async () => {
    if (!challengeDescription.trim()) {
      alert('Please add a description of your challenge completion.');
      return;
    }

    setVerificationStage('claiming');

    try {
      // Here you would integrate with your IPFS/Pinata and blockchain logic
      // For now, simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setVerificationStage('success');

      // Call the completion handler with real verification data
      onVerificationComplete({
        video: videoBlob,
        photo: photoBlob,
        verificationResult,
        description: challengeDescription,
        challenge: challenge,
      });

      // Redirect to home after success
      setTimeout(() => {
        window.location.href = '/home';
      }, 2000);
    } catch (error) {
      console.error('Error claiming tokens:', error);
      alert('Failed to claim tokens. Please try again.');
      setVerificationStage('complete');
    }
  };

  const getVerificationTitle = () => {
    switch (verificationStage) {
      case 'ready':
        return 'AI Verification';
      case 'verifying':
        return 'Neural Analysis Active';
      case 'complete':
        return 'Verification Complete';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'AI Verification';
    }
  };

  const getVerificationSubtitle = () => {
    switch (verificationStage) {
      case 'ready':
        return 'Ready to analyze your submission';
      case 'verifying':
        return currentStepMessage;
      case 'complete':
        return 'Identity confirmed • Proceeding to rewards';
      case 'failed':
        return 'Verification unsuccessful • Please retry';
      default:
        return 'Analyzing your submission';
    }
  };

  const getStepStatusIcon = (step: VerificationStep) => {
    switch (step.status) {
      case 'completed':
        return (
          <div className="w-3 h-3 bg-nocenaPurple rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case 'running':
        return <div className="w-3 h-3 border-2 border-nocenaPink border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      default:
        return <div className="w-3 h-3 bg-gray-500 rounded-full" />;
    }
  };

  const getOverallProgress = () => {
    if (verificationSteps.length === 0) return 0;

    const totalSteps = verificationSteps.length;
    const completedSteps = verificationSteps.filter((s) => s.status === 'completed').length;
    const runningStep = verificationSteps.find((s) => s.status === 'running');

    let progress = (completedSteps / totalSteps) * 100;

    // Add progress from currently running step
    if (runningStep) {
      progress += (runningStep.progress / 100) * (1 / totalSteps) * 100;
    }

    return Math.min(progress, 100);
  };

  return (
    <div className="text-white h-screen overflow-hidden pt-20 -mt-20">
      <div className="h-full flex flex-col p-6">
        {/* Header */}
        <div className="text-center mb-4 mt-4">
          <ThematicContainer asButton={false} color="nocenaPink" className="px-6 py-2 mb-2" rounded="xl">
            <span className="text-sm font-medium tracking-wider uppercase">{getVerificationTitle()}</span>
          </ThematicContainer>

          <div className="text-base font-light text-nocenaPink tracking-wide opacity-90">
            {getVerificationSubtitle()}
          </div>
        </div>

        {/* BeReal-style Media Layout */}
        <div className="relative mb-4">
          <ThematicContainer
            asButton={false}
            glassmorphic={true}
            color={challenge.color as any}
            rounded="xl"
            className="relative overflow-hidden"
          >
            {/* Main Video - Mobile horizontal format */}
            <div className="relative h-48 rounded-xl overflow-hidden bg-black mb-3">
              <video
                ref={videoRef}
                src={videoUrl}
                preload="metadata"
                className="w-full h-full object-cover cursor-pointer"
                muted
                loop
                playsInline
                onClick={handleVideoClick}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onLoadedData={() => {
                  console.log('Video loaded and ready');
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                }}
              />

              {/* Play/Pause Overlay */}
              {!isVideoPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                  onClick={handleVideoClick}
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Selfie Overlay (Top Right) */}
              <div className="absolute top-3 right-3 w-16 h-20 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <img src={photoUrl} alt="Verification selfie" className="w-full h-full object-cover" />
              </div>

              {/* Challenge Badge */}
              <div className="absolute bottom-3 left-3 right-20">
                <ThematicContainer
                  asButton={false}
                  glassmorphic={true}
                  color="nocenaPink"
                  rounded="xl"
                  className="px-2 py-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Image
                        src={challenge.challengerProfile}
                        alt="Challenger"
                        width={16}
                        height={16}
                        className="w-4 h-4 object-cover rounded-full"
                      />
                      <span className="text-xs font-medium">{challenge.title}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-semibold">{challenge.reward}</span>
                      <Image src="/nocenix.ico" alt="Nocenix" width={12} height={12} />
                    </div>
                  </div>
                </ThematicContainer>
              </div>
            </div>

            {verificationStage === 'ready' && (
              <div className="px-4 py-3">
                <div className="text-center text-sm font-medium mb-3 text-gray-300 tracking-wider uppercase">
                  Submission Analysis
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Challenge:</span>
                    <span className="text-white font-medium">{challenge.title}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Video Size:</span>
                    <span className="text-white">{(videoBlob.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Photo Size:</span>
                    <span className="text-white">{(photoBlob.size / 1024).toFixed(1)} KB</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span className="text-gray-400 text-xs font-medium">Ready</span>
                  </div>
                </div>

                <div className="p-2 bg-nocenaBlue/20 rounded-full border border-nocenaBlue/30">
                  <p className="text-xs text-white text-center">
                    AI + TensorFlow verification will analyze your completion
                  </p>
                </div>
              </div>
            )}

            {verificationStage === 'verifying' && (
              <div className="px-4 py-3">
                <div className="text-center text-sm font-medium mb-3 text-nocenaPink tracking-wider uppercase">
                  Neural Processing Active
                </div>

                {/* Overall Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-nocenaPink to-nocenaPurple"
                    style={{ width: `${getOverallProgress()}%` }}
                  />
                </div>

                {/* Individual Verification Steps */}
                <div className="space-y-2 mb-3">
                  {verificationSteps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        {getStepStatusIcon(step)}
                        <span
                          className={`font-medium ${
                            step.status === 'completed'
                              ? 'text-nocenaPurple'
                              : step.status === 'running'
                                ? 'text-nocenaPink'
                                : step.status === 'failed'
                                  ? 'text-red-400'
                                  : 'text-gray-500'
                          }`}
                        >
                          {step.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {step.confidence && step.status === 'completed' && (
                          <span className="text-nocenaPurple font-bold">{Math.round(step.confidence * 100)}%</span>
                        )}
                        {step.status === 'running' && (
                          <span className="text-nocenaPink font-bold">{step.progress}%</span>
                        )}
                        {step.status === 'pending' && <span className="text-gray-500">--</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-nocenaPink border-t-transparent rounded-full animate-spin mr-2" />
                  <span className="text-nocenaPink font-medium text-xs">{currentStepMessage}</span>
                </div>
              </div>
            )}

            {verificationStage === 'complete' && (
              <div className="px-4 py-3">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-nocenaPurple rounded-full flex items-center justify-center mx-auto mb-2 relative">
                    <svg
                      className="w-6 h-6 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-nocenaPurple mb-1">VERIFICATION COMPLETE</h2>
                  <p className="text-gray-300 text-xs mb-3">AI analysis passed</p>

                  {/* Verification Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-nocenaPurple/20 rounded-lg p-2 border border-nocenaPurple">
                      <div className="text-nocenaPurple text-sm font-bold">
                        {verificationResult ? Math.round(verificationResult.overallConfidence * 100) : 94}%
                      </div>
                      <div className="text-xs text-white">Confidence</div>
                    </div>
                    <div className="bg-nocenaBlue/20 rounded-lg p-2 border border-nocenaBlue/30">
                      <div className="text-white text-sm font-bold">
                        {verificationSteps.filter((s) => s.status === 'completed').length}/{verificationSteps.length}
                      </div>
                      <div className="text-xs text-white">Checks</div>
                    </div>
                  </div>
                </div>

                {/* Token Claim Section */}
                <div className="bg-black/40 rounded-xl p-3 mb-3 border border-nocenaPink/30">
                  <div className="text-center mb-3">
                    <h3 className="text-sm font-bold text-nocenaPink mb-2">REWARD UNLOCKED</h3>
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <span className="text-xl font-black text-white">{challenge.reward}</span>
                      <img src="/nocenix.ico" alt="Nocenix" className="w-5 h-5" />
                      <span className="text-xs text-gray-300">AUTHORIZED</span>
                    </div>
                  </div>

                  {/* Challenge Description Input */}
                  <div className="mb-3">
                    <textarea
                      value={challengeDescription}
                      onChange={(e) => setChallengeDescription(e.target.value)}
                      placeholder="Describe your completion..."
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-nocenaPink transition-colors resize-none text-sm"
                    />
                  </div>

                  {/* Claim Button */}
                  <PrimaryButton
                    text="CLAIM TOKENS"
                    onClick={handleClaimTokens}
                    disabled={!challengeDescription.trim()}
                  />
                </div>
              </div>
            )}

            {verificationStage === 'claiming' && (
              <div className="px-4 py-6">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">PROCESSING</h3>
                  <p className="text-gray-300 text-center mb-1 text-sm">Uploading to decentralized storage...</p>
                  <p className="text-gray-400 text-center text-xs">Executing blockchain protocol</p>
                </div>
              </div>
            )}

            {verificationStage === 'success' && (
              <div className="px-4 py-6">
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-nocenaPurple to-nocenaPurple rounded-full flex items-center justify-center mx-auto">
                      <img src="/nocenix.ico" alt="Nocenix" className="w-6 h-6" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-nocenaPurple rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-nocenaPurple mb-1">TOKENS CLAIMED!</h3>
                  <p className="text-lg text-white mb-1">+{challenge.reward} Nocenix</p>
                  <p className="text-sm text-gray-300 text-center mb-4">Transfer successful</p>

                  <div className="bg-gray-800/50 rounded-lg px-3 py-2 mb-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-gray-400">Network:</span>
                      <span className="text-blue-400">Polygon</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-nocenaPurple">Confirmed</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center">Returning to home...</p>
                </div>
              </div>
            )}

            {verificationStage === 'failed' && (
              <div className="px-4 py-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-red-400 mb-2">VERIFICATION FAILED</h2>
                  <p className="text-gray-300 text-sm text-center mb-4">{currentStepMessage}</p>

                  {/* Show failed steps */}
                  {verificationSteps.length > 0 && (
                    <div className="text-left bg-red-900/20 rounded-lg p-3 mb-4">
                      <p className="text-xs text-red-300 mb-2">Failed checks:</p>
                      {verificationSteps
                        .filter((s) => s.status === 'failed')
                        .map((step) => (
                          <p key={step.id} className="text-xs text-red-400">
                            • {step.name}: {step.message}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ThematicContainer>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {verificationStage === 'ready' && (
            <PrimaryButton onClick={startVerification} text="Start Verification" className="flex-1" />
          )}

          {verificationStage === 'verifying' && (
            <PrimaryButton text="Processing..." className="flex-1" disabled={true} />
          )}

          {verificationStage === 'failed' && (
            <PrimaryButton onClick={startVerification} text="Retry Verification" className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationScreen;
