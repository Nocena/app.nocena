'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import ThematicContainer from '../../../components/ui/ThematicContainer';
import { SimpleVerificationService } from '../../../lib/verification/simpleVerificationService';
import { useAuth } from '../../../contexts/AuthContext';
import { useBackgroundTasks } from '../../../contexts/BackgroundTaskContext';

interface VerificationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  confidence?: number;
}

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

// UPDATED: New background task structure (only 3 tasks)
interface BackgroundTasks {
  nftGenerationId?: string;
  modelPreloadId?: string;
  verificationId?: string;
}

interface VerificationScreenProps {
  challenge: Challenge;
  videoBlob: Blob;
  photoBlob: Blob;
  onVerificationComplete: (result: {
    verificationResult: any;
    challenge: Challenge;
    videoBlob: Blob;
    photoBlob: Blob;
  }) => void;
  onBack: () => void;
  onCancel: () => void;
  backgroundTaskIds: BackgroundTasks;
}

const VerificationScreen: React.FC<VerificationScreenProps> = ({
  challenge,
  videoBlob,
  photoBlob,
  onVerificationComplete,
  onBack,
  onCancel,
  backgroundTaskIds,
}) => {
  const { user } = useAuth();
  const backgroundTasks = useBackgroundTasks();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [verificationStage, setVerificationStage] = useState<'ready' | 'verifying' | 'complete' | 'failed'>('ready');
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [currentStepMessage, setCurrentStepMessage] = useState('Ready to verify submission');
  const [errorMessage, setErrorMessage] = useState('');
  const [backgroundVerificationUsed, setBackgroundVerificationUsed] = useState(false);

  // Development mode configuration
  const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
  const [useMockVerification, setUseMockVerification] = useState(false); // CHANGED: Default to false

  const videoRef = useRef<HTMLVideoElement>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const vUrl = URL.createObjectURL(videoBlob);
    const pUrl = URL.createObjectURL(photoBlob);

    setVideoUrl(vUrl);
    setPhotoUrl(pUrl);

    generateThumbnail(vUrl);

    return () => {
      URL.revokeObjectURL(vUrl);
      URL.revokeObjectURL(pUrl);
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [videoBlob, photoBlob]);

  // UPDATED: Monitor background verification task
  useEffect(() => {
    if (backgroundTaskIds.verificationId) {
      console.log('[Verification Screen] Monitoring background verification:', backgroundTaskIds.verificationId);
      
      const monitorTask = () => {
        const task = backgroundTasks.getTask(backgroundTaskIds.verificationId!);
        if (!task) return;

        console.log('[Verification Screen] Background task status:', task.status, task.progress + '%');

        if (task.status === 'running') {
          setVerificationStage('verifying');
          setCurrentStepMessage('Using background verification analysis...');
          setBackgroundVerificationUsed(true);

          // Map background task progress to verification steps
          const steps = mapBackgroundProgressToSteps(task.progress);
          setVerificationSteps(steps);
        } else if (task.status === 'completed' && task.result) {
          console.log('[Verification Screen] Background verification completed:', task.result);
          setVerificationStage('complete');
          setVerificationResult({
            ...task.result,
            backgroundOptimized: true,
            timestamp: new Date().toISOString(),
          });
          setCurrentStepMessage('Background verification completed successfully!');
          
          // Set final completed steps
          const completedSteps = mapBackgroundProgressToSteps(100);
          setVerificationSteps(completedSteps);
        } else if (task.status === 'failed') {
          console.log('[Verification Screen] Background verification failed:', task.error);
          setVerificationStage('failed');
          setErrorMessage(task.error || 'Background verification failed');
        }
      };

      // Monitor immediately and then every 500ms
      monitorTask();
      monitorIntervalRef.current = setInterval(monitorTask, 500);

      return () => {
        if (monitorIntervalRef.current) {
          clearInterval(monitorIntervalRef.current);
        }
      };
    }
  }, [backgroundTaskIds.verificationId, backgroundTasks]);

  // Helper function to map background task progress to verification steps
  const mapBackgroundProgressToSteps = (progress: number): VerificationStep[] => {
    return [
      {
        id: 'basic-check',
        name: 'Basic File Check',
        status: progress >= 20 ? 'completed' : progress > 0 ? 'running' : 'pending',
        progress: Math.min(progress, 20) * 5, // Scale to 0-100
        message: progress >= 20 ? 'Files validated successfully' : 'Checking video and photo files...',
        confidence: progress >= 20 ? 0.95 : undefined,
      },
      {
        id: 'human-selfie-check',
        name: 'Face Detection',
        status: progress >= 60 ? 'completed' : progress >= 20 ? 'running' : 'pending',
        progress: progress >= 20 ? Math.min((progress - 20) * 2.5, 100) : 0, // Scale 20-60 to 0-100
        message: progress >= 60 ? 'Face detected and validated' : progress >= 20 ? 'Analyzing facial features...' : 'Waiting for file check...',
        confidence: progress >= 60 ? 0.92 : undefined,
      },
      {
        id: 'ai-challenge-check',
        name: 'AI Challenge Verification',
        status: progress >= 100 ? 'completed' : progress >= 60 ? 'running' : 'pending',
        progress: progress >= 60 ? Math.min((progress - 60) * 2.5, 100) : 0, // Scale 60-100 to 0-100
        message: progress >= 100 ? 'Challenge completion verified' : progress >= 60 ? 'Analyzing challenge performance...' : 'Waiting for face detection...',
        confidence: progress >= 100 ? 0.88 : undefined,
      },
    ];
  };

  const generateThumbnail = (videoUrl: string) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const extractFrame = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const thumbUrl = URL.createObjectURL(blob);
                setThumbnailUrl(thumbUrl);
              }
            },
            'image/jpeg',
            0.9,
          );
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    };

    video.onloadedmetadata = () => {
      video.currentTime = 0.05;
    };

    video.onseeked = () => {
      extractFrame();
    };

    video.oncanplay = () => {
      if (!thumbnailUrl) {
        extractFrame();
      }
    };

    video.onerror = (e) => {
      console.error('Error loading video for thumbnail:', e);
    };
  };

  // UPDATED: Check background task status for UI hints
  const getBackgroundTaskStatus = () => {
    const status = {
      nftGeneration: { progress: 0, status: 'pending' as any },
      modelPreload: { progress: 0, status: 'pending' as any },
      verification: { progress: 0, status: 'pending' as any },
    };

    if (backgroundTaskIds.nftGenerationId) {
      const task = backgroundTasks.getTask(backgroundTaskIds.nftGenerationId);
      if (task) {
        status.nftGeneration = { progress: task.progress, status: task.status };
      }
    }

    if (backgroundTaskIds.modelPreloadId) {
      const task = backgroundTasks.getTask(backgroundTaskIds.modelPreloadId);
      if (task) {
        status.modelPreload = { progress: task.progress, status: task.status };
      }
    }

    if (backgroundTaskIds.verificationId) {
      const task = backgroundTasks.getTask(backgroundTaskIds.verificationId);
      if (task) {
        status.verification = { progress: task.progress, status: task.status };
      }
    }

    return status;
  };

  // UPDATED: Start new verification (fallback or retry)
  const startFreshVerification = async () => {
    setVerificationStage('verifying');
    setErrorMessage('');
    setBackgroundVerificationUsed(false);

    try {
      console.log('[Verification Screen] Starting fresh verification...');

      const verificationService = new SimpleVerificationService((steps) => {
        setVerificationSteps(steps);
        const runningStep = steps.find((s) => s.status === 'running');
        if (runningStep) {
          setCurrentStepMessage(runningStep.message);
        }
      });

      const result = await verificationService.runFullVerification(videoBlob, photoBlob, challenge.description);

      if (result.success && result.passed) {
        setVerificationResult({
          ...result,
          backgroundOptimized: false,
          timestamp: new Date().toISOString(),
        });
        setVerificationStage('complete');
        setCurrentStepMessage('All verification checks passed!');
      } else {
        setVerificationStage('failed');
        setCurrentStepMessage('Verification failed. Please check the issues below.');
        setErrorMessage('One or more verification checks did not pass.');
      }
    } catch (error) {
      console.error('[Verification Screen] Fresh verification error:', error);
      setVerificationStage('failed');
      setCurrentStepMessage('Verification process encountered an error.');
      setErrorMessage('Verification failed. Please try again.');
    }
  };

  // FAKE Verification Function (Development Mode)
  const startFakeVerification = async () => {
    setVerificationStage('verifying');
    setErrorMessage('');

    try {
      console.log('🎭 Starting FAKE verification (Development Mode)...');

      const fakeSteps: VerificationStep[] = [
        {
          id: 'file-check',
          name: 'File Validation',
          status: 'running',
          progress: 0,
          message: 'Checking video and photo files...',
          confidence: 0,
        },
        {
          id: 'face-match',
          name: 'Face Matching',
          status: 'pending',
          progress: 0,
          message: 'Comparing faces between video and selfie...',
          confidence: 0,
        },
        {
          id: 'activity-check',
          name: 'Activity Analysis',
          status: 'pending',
          progress: 0,
          message: 'Analyzing challenge completion...',
          confidence: 0,
        },
        {
          id: 'final-review',
          name: 'Final Review',
          status: 'pending',
          progress: 0,
          message: 'Conducting final verification...',
          confidence: 0,
        },
      ];

      for (let i = 0; i < fakeSteps.length; i++) {
        const step = fakeSteps[i];

        step.status = 'running';
        step.message = `Processing ${step.name.toLowerCase()}...`;
        setVerificationSteps([...fakeSteps]);
        setCurrentStepMessage(step.message);

        for (let progress = 0; progress <= 100; progress += 25) {
          step.progress = progress;
          setVerificationSteps([...fakeSteps]);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        step.status = 'completed';
        step.confidence = 0.85 + Math.random() * 0.14;
        step.progress = 100;

        switch (step.id) {
          case 'file-check':
            step.message = 'Video and photo files are valid and high quality';
            break;
          case 'face-match':
            step.message = 'Face successfully matched between video and selfie';
            break;
          case 'activity-check':
            step.message = 'Challenge activity detected and verified as authentic';
            break;
          case 'final-review':
            step.message = 'All verification checks passed successfully';
            break;
        }

        setVerificationSteps([...fakeSteps]);
        setCurrentStepMessage(step.message);

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const fakeResult = {
        passed: true,
        overallConfidence: 0.92,
        details: 'All verification checks completed successfully. Challenge completion confirmed with high confidence.',
        steps: fakeSteps,
        timestamp: new Date().toISOString(),
      };

      setVerificationResult(fakeResult);
      setVerificationStage('complete');
      setCurrentStepMessage('All verification checks passed!');
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStage('failed');
      setCurrentStepMessage('Verification process encountered an error.');
      setErrorMessage('Verification failed. Please try again.');
    }
  };

  const handleProceedToClaiming = () => {
    onVerificationComplete({
      verificationResult,
      challenge,
      videoBlob,
      photoBlob,
    });
  };

  const getStageInfo = () => {
    const backgroundStatus = getBackgroundTaskStatus();
    const hasBackgroundVerification = backgroundTaskIds.verificationId && backgroundStatus.verification.status !== 'pending';
    const modelsLoaded = backgroundStatus.modelPreload.status === 'completed';

    let subtitle = '';
    if (isDevelopmentEnvironment && useMockVerification) {
      subtitle = 'Mock verification mode';
    } else if (hasBackgroundVerification) {
      subtitle = 'Verification processing in background - instant results available';
    } else if (modelsLoaded) {
      subtitle = 'Models preloaded - faster verification available';
    } else {
      subtitle = 'Ready to analyze your submission';
    }

    switch (verificationStage) {
      case 'ready':
        if (hasBackgroundVerification) {
          return {
            title: 'Background Analysis Ready',
            subtitle,
            color: 'nocenaPurple',
          };
        } else if (modelsLoaded) {
          return {
            title: 'AI Verification Ready',
            subtitle,
            color: 'nocenaPink',
          };
        } else {
          return {
            title: isDevelopmentEnvironment && useMockVerification ? 'Mock AI Verification' : 'AI Verification',
            subtitle,
            color: 'nocenaPink',
          };
        }
      case 'verifying':
        return {
          title: backgroundVerificationUsed ? 'Using Background Analysis' : 'Analyzing...',
          subtitle: currentStepMessage,
          color: 'nocenaPink',
        };
      case 'complete':
        return {
          title: 'Verified ✓',
          subtitle: backgroundVerificationUsed ? 'Background analysis completed' : 'Ready to claim your reward',
          color: 'nocenaPurple',
        };
      case 'failed':
        return {
          title: 'Analysis Incomplete',
          subtitle: 'Neural network requires clearer input data',
          color: 'blue',
        };
      default:
        return {
          title: 'AI Verification',
          subtitle: 'Analyzing your submission',
          color: 'nocenaPink',
        };
    }
  };

  const getOverallProgress = () => {
    if (verificationSteps.length === 0) return 0;
    const totalSteps = verificationSteps.length;
    const completedSteps = verificationSteps.filter((s) => s.status === 'completed').length;
    return Math.min((completedSteps / totalSteps) * 100, 100);
  };

  const stageInfo = getStageInfo();
  const backgroundStatus = getBackgroundTaskStatus();

  return (
    <div className="fixed inset-0 bg-black text-white z-50">
      {/* Navigation Buttons */}
      <div
        className="flex justify-between items-center px-4 fixed top-0 left-0 right-0 z-50 pointer-events-none mt-4"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: '0.5rem',
        }}
      >
        {/* Back Button - Left */}
        <button onClick={onBack} className="focus:outline-none pointer-events-auto" aria-label="Back">
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

        {/* Cancel Button - Right */}
        <button onClick={onCancel} className="focus:outline-none pointer-events-auto" aria-label="Cancel">
          <ThematicContainer
            color="nocenaBlue"
            glassmorphic={true}
            asButton={false}
            rounded="full"
            className="w-12 h-12 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ThematicContainer>
        </button>
      </div>

      <div
        className="text-white h-full flex flex-col px-6 py-4 overflow-y-auto"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 80px)' }}
      >
        <div className="text-center mb-6">
          <h2 className="text-xl font-light mb-1">{stageInfo.title}</h2>
          <div className="text-sm text-gray-400">
            {challenge.title} • {stageInfo.subtitle}
          </div>

          {/* Development Mode Controls */}
          {isDevelopmentEnvironment && (
            <div className="mt-4 px-4 py-3 bg-yellow-900/20 border border-yellow-700/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-yellow-400 font-medium">🛠️ Development Mode</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-yellow-400">Mock</span>
                  <button
                    onClick={() => setUseMockVerification(!useMockVerification)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      useMockVerification ? 'bg-yellow-600' : 'bg-nocenaPink'
                    }`}
                    disabled={verificationStage !== 'ready'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useMockVerification ? 'translate-x-1' : 'translate-x-6'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-yellow-400">Real</span>
                </div>
              </div>
              <div className="text-xs text-yellow-300">
                {useMockVerification
                  ? 'Using simulated AI verification for testing'
                  : 'Using actual AI verification service'}
              </div>
            </div>
          )}

          {/* Background Task Status Indicator */}
          {(backgroundStatus.verification.status !== 'pending' || backgroundStatus.modelPreload.status === 'completed') && (
            <div className="mt-4 px-4 py-3 bg-green-900/20 border border-green-700/50 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-green-400 font-medium">Background Processing Active</span>
              </div>
              <div className="text-xs text-green-300">
                {backgroundStatus.verification.status !== 'pending' ? 
                  `Verification: ${backgroundStatus.verification.progress}% complete` :
                  backgroundStatus.modelPreload.status === 'completed' ? 
                  'Models preloaded - faster verification available' :
                  'Background optimization ready'
                }
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 bg-red-900/20 border border-red-800/30 rounded-xl p-3">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
            <div className="relative h-64 w-full">
              <video
                ref={videoRef}
                src={videoUrl || undefined}
                poster={thumbnailUrl || undefined}
                className="w-full h-full object-cover"
                preload="metadata"
                playsInline
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                onClick={(e) => {
                  const video = e.target as HTMLVideoElement;
                  if (video.paused) {
                    video.play();
                  } else {
                    video.pause();
                  }
                }}
                style={
                  {
                    WebkitPlaysinline: true,
                  } as React.CSSProperties
                }
              />

              <div className="absolute top-4 right-4 w-20 h-24 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                <img src={photoUrl || undefined} alt="Verification selfie" className="w-full h-full object-cover" />
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src={challenge.challengerProfile}
                        alt="Challenger"
                        width={20}
                        height={20}
                        className="w-5 h-5 object-cover rounded-full"
                      />
                      <span className="text-sm font-medium">{challenge.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold">{challenge.reward}</span>
                      <Image src="/nocenix.ico" alt="Nocenix" width={16} height={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex-1">
          {verificationStage === 'ready' && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/20 rounded-2xl p-6">
                <div className="w-16 h-16 bg-nocenaPink/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {backgroundStatus.verification.status !== 'pending' ? (
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-nocenaPink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>

                <h3 className="text-lg font-medium mb-2">
                  {backgroundStatus.verification.status !== 'pending' ? 'Background Analysis Ready' : 
                   isDevelopmentEnvironment && useMockVerification ? 'Mock AI Analysis Ready' : 
                   backgroundStatus.modelPreload.status === 'completed' ? 'Optimized AI Analysis Ready' :
                   'AI Analysis Ready'}
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  {backgroundStatus.verification.status !== 'pending' ? 
                    'Verification already running in background - instant results available' :
                    isDevelopmentEnvironment && useMockVerification ?
                    'Mock verification will simulate AI analysis for testing' :
                    backgroundStatus.modelPreload.status === 'completed' ? 
                    'Models preloaded for faster verification' :
                    'Our AI will verify your challenge completion using advanced computer vision'
                  }
                </p>

                <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                  <div>
                    <span className="text-gray-400">Video:</span>
                    <span className="text-white ml-2">{(videoBlob.size / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Photo:</span>
                    <span className="text-white ml-2">{(photoBlob.size / 1024).toFixed(1)}KB</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {verificationStage === 'verifying' && (
            <div>
              <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-800/20 rounded-2xl p-6 mb-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-nocenaPink">
                    {backgroundVerificationUsed ? 'Background Analysis Active' :
                     isDevelopmentEnvironment && useMockVerification ? 'Mock Analysis Active' :
                     'Neural Analysis Active'}
                  </h3>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-nocenaPink to-nocenaPurple"
                    style={{ width: `${getOverallProgress()}%` }}
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-300">{currentStepMessage}</p>
                  {backgroundVerificationUsed && (
                    <p className="text-xs text-green-400 mt-1">Using background-processed optimization</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {verificationSteps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          step.status === 'completed'
                            ? 'bg-nocenaPurple'
                            : step.status === 'running'
                              ? 'bg-nocenaPink animate-pulse'
                              : step.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-gray-600'
                        }`}
                      />
                      <span className="text-sm">{step.name}</span>
                    </div>
                    {step.confidence && step.status === 'completed' && (
                      <span className="text-xs text-nocenaPurple font-medium">
                        {Math.round(step.confidence * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {verificationStage === 'complete' && (
            <div>
              <div className="bg-gradient-to-r from-green-900/20 to-purple-900/20 border border-green-800/20 rounded-2xl p-6 mb-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-nocenaPurple rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-nocenaPurple mb-2">
                    {backgroundVerificationUsed ? 'Background Verification Complete!' : 'Verification Complete!'}
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    {isDevelopmentEnvironment && useMockVerification ? 'Mock analysis' : 'AI analysis'} passed with {verificationResult ? Math.round(verificationResult.overallConfidence * 100) : 95}%
                    confidence
                  </p>

                  <div className="bg-black/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-2xl font-bold">{challenge.reward}</span>
                      <Image src="/nocenix.ico" alt="Nocenix" width={24} height={24} />
                      <span className="text-sm text-gray-300">NOCENIX</span>
                    </div>
                    <p className="text-xs text-gray-400">Ready to be claimed</p>
                  </div>
                </div>
              </div>

              {/* Show completed steps */}
              <div className="space-y-2">
                {verificationSteps.map((step) => (
                  <div key={step.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-nocenaPurple" />
                      <span className="text-sm">{step.name}</span>
                    </div>
                    {step.confidence && (
                      <span className="text-xs text-nocenaPurple font-medium">
                        {Math.round(step.confidence * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {verificationStage === 'failed' && (
            <div>
              <div className="bg-gradient-to-br from-slate-900/40 to-red-900/20 border border-red-700/50 rounded-2xl p-6 mb-4 backdrop-blur-sm">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden border border-red-400/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-orange-400/10 animate-pulse" />
                    <svg
                      className="w-8 h-8 text-red-400 relative z-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 18.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-red-400 mb-2">MISSION FAILED</h3>
                  <p className="text-sm text-slate-300">Neural scan detected insufficient challenge completion</p>
                </div>

                {/* AI Analysis Results */}
                {verificationResult && (() => {
                  // Look for AI challenge check result in verification result
                  let aiResult = null;
                  
                  // Check if we have steps with AI challenge result
                  if (verificationResult.steps) {
                    const aiStep = verificationResult.steps.find((s: any) => s.id === 'ai-challenge-check');
                    if (aiStep && aiStep.result) {
                      aiResult = aiStep.result;
                    }
                  }
                  
                  // Also check direct result structure from console logs
                  if (!aiResult && verificationResult.score !== undefined) {
                    aiResult = verificationResult;
                  }
                  
                  if (aiResult && aiResult.explanation) {
                    // Parse ratings from explanation - looking for pattern like "Creativity: 0/10, Authenticity: 2/10, Effort: 1/10"
                    const creativityMatch = aiResult.explanation.match(/[Cc]reativity:\s*(\d+)\/10/);
                    const authenticityMatch = aiResult.explanation.match(/[Aa]uthenticity:\s*(\d+)\/10/);
                    const effortMatch = aiResult.explanation.match(/[Ee]ffort:\s*(\d+)\/10/);
                    
                    const creativity = creativityMatch ? parseInt(creativityMatch[1]) : 0;
                    const authenticity = authenticityMatch ? parseInt(authenticityMatch[1]) : 0;
                    const effort = effortMatch ? parseInt(effortMatch[1]) : 0;
                    
                    // Extract main explanation (before the ratings in parentheses)
                    const mainExplanation = aiResult.explanation.split('(')[0].trim();
                    
                    return (
                      <div className="mb-6">
                        <div className="bg-black/30 rounded-xl p-4 mb-4">
                          <h4 className="text-lg font-bold text-orange-400 mb-3">PERFORMANCE ANALYSIS</h4>
                          
                          {/* Score Bars */}
                          <div className="space-y-3 mb-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-300">CREATIVITY</span>
                                <span className="text-sm font-bold text-orange-400">{creativity}/10</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${creativity * 10}%` }}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-300">AUTHENTICITY</span>
                                <span className="text-sm font-bold text-orange-400">{authenticity}/10</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${authenticity * 10}%` }}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-300">EFFORT</span>
                                <span className="text-sm font-bold text-orange-400">{effort}/10</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-1000"
                                  style={{ width: `${effort * 10}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Overall Score */}
                          <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-3 mb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-200">OVERALL SCORE</span>
                              <span className="text-lg font-bold text-red-400">{aiResult.score || 0}/100</span>
                            </div>
                            <div className="text-xs text-red-300 mt-1">
                              Confidence: {Math.round((aiResult.confidence || 0) * 100)}% • Frames: {aiResult.framesAnalyzed || 'N/A'}
                            </div>
                          </div>

                          {/* AI Feedback */}
                          <div className="bg-slate-800/40 rounded-lg p-3">
                            <h5 className="text-xs font-bold text-slate-300 mb-2">NEURAL ANALYSIS:</h5>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {mainExplanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Fallback if no AI result found
                  return (
                    <div className="mb-6">
                      <div className="bg-black/30 rounded-xl p-4 mb-4">
                        <h4 className="text-lg font-bold text-orange-400 mb-3">ANALYSIS UNAVAILABLE</h4>
                        <p className="text-sm text-slate-400">Detailed AI analysis not available for this verification result.</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Challenge-specific feedback */}
                <div className="bg-gradient-to-r from-slate-800/40 to-red-900/20 border border-red-600/40 rounded-xl p-4 backdrop-blur-sm mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-red-400/30">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-300 mb-2">MISSION REQUIREMENTS</h4>
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>• Demonstrate clear "{challenge.title}" sequence</div>
                        <div>• Show visible challenge activity throughout video</div>
                        <div>• Maintain consistent lighting and visibility</div>
                        <div>• Complete full challenge demonstration</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retry Section */}
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-purple-400/30">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-purple-300 mb-1">RETRY MISSION</h4>
                    <p className="text-xs text-slate-400">Neural pathways recalibrated for optimal performance</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {verificationStage === 'ready' && (
            <PrimaryButton
              onClick={() => {
                // If background verification exists but is stuck, start fresh
                if (backgroundTaskIds.verificationId) {
                  const task = backgroundTasks.getTask(backgroundTaskIds.verificationId);
                  if (task && (task.status === 'queued' || task.status === 'failed')) {
                    console.log('[Verification Screen] Background verification stuck, starting fresh');
                    // Cancel the stuck task and start fresh
                    backgroundTasks.cancelTask(backgroundTaskIds.verificationId);
                    if (isDevelopmentEnvironment && useMockVerification) {
                      startFakeVerification();
                    } else {
                      startFreshVerification();
                    }
                  } else {
                    console.log('[Verification Screen] Attaching to background verification');
                    // The monitoring useEffect will handle the rest
                  }
                } else {
                  // Start fresh verification (mock or real based on dev settings)
                  console.log('[Verification Screen] Starting fresh verification');
                  if (isDevelopmentEnvironment && useMockVerification) {
                    startFakeVerification();
                  } else {
                    startFreshVerification();
                  }
                }
              }}
              text={
                backgroundTaskIds.verificationId && 
                backgroundTasks.getTask(backgroundTaskIds.verificationId)?.status === 'running' 
                  ? "Use Background Analysis" 
                  : "Start Verification"
              }
              className="flex-1"
              isActive={true}
            />
          )}

          {verificationStage === 'complete' && (
            <PrimaryButton
              onClick={handleProceedToClaiming}
              text="Proceed to Claim"
              className="flex-1"
              isActive={true}
            />
          )}

          {verificationStage === 'failed' && (
            <PrimaryButton
              onClick={() => {
                if (isDevelopmentEnvironment && useMockVerification) {
                  startFakeVerification();
                } else {
                  startFreshVerification();
                }
              }}
              text="Retry Verification"
              className="flex-1"
              isActive={true}
            />
          )}

          {verificationStage === 'verifying' && (
            <PrimaryButton text="Processing..." className="flex-1" disabled={true} isActive={false} />
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationScreen;