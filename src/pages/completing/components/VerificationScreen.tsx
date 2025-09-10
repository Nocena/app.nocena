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
  const [backgroundVerificationUsed, setBackgroundVerificationUsed] = useState(true);

  // Development mode configuration
  const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
  const [useMockVerification, setUseMockVerification] = useState(false); // CHANGED: Default to false to test real verification

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

        // Stop monitoring if task is in a final state
        if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
          if (monitorIntervalRef.current) {
            clearInterval(monitorIntervalRef.current);
            monitorIntervalRef.current = null;
            console.log('[Verification Screen] Stopped monitoring - task reached final state:', task.status);
          }
        }

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

          // Double-check that verification actually passed
          if (task.result.passed) {
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
          } else {
            // Verification completed but failed - treat as failure
            setVerificationStage('failed');
            setVerificationResult(task.result);
            setCurrentStepMessage('Background verification completed - challenge not verified');
            setErrorMessage('AI analysis determined the challenge was not completed properly');
          }
        } else if (task.status === 'failed') {
          console.log('[Verification Screen] Background verification failed:', task.error);

          // CRITICAL FIX: Parse the actual AI data from the error message
          const errorMessage = task.error || '';
          const extractedData = extractAIDataFromError(errorMessage);

          setVerificationStage('failed');
          setVerificationResult(extractedData);
          setErrorMessage(extractedData.explanation || 'Background verification failed');
        }
      };

      // Monitor immediately and then every 500ms (but stop when final state reached)
      monitorTask();
      monitorIntervalRef.current = setInterval(monitorTask, 500);

      return () => {
        if (monitorIntervalRef.current) {
          clearInterval(monitorIntervalRef.current);
          monitorIntervalRef.current = null;
        }
      };
    }
  }, [backgroundTaskIds.verificationId, backgroundTasks]);

  const extractAIDataFromError = (errorMessage: string) => {
    console.log('🔍 Extracting AI data from error:', errorMessage);

    // Extract score
    const scoreMatch = errorMessage.match(/\(Score:\s*(\d+)\/100\)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    // Extract ratings from the error message
    const creativityMatch = errorMessage.match(/Creativity:\s*(\d+)\/10/);
    const authenticityMatch = errorMessage.match(/Authenticity:\s*(\d+)\/10/);
    const effortMatch = errorMessage.match(/Effort:\s*(\d+)\/10/);

    const creativity = creativityMatch ? parseInt(creativityMatch[1]) : 0;
    const authenticity = authenticityMatch ? parseInt(authenticityMatch[1]) : 0;
    const effort = effortMatch ? parseInt(effortMatch[1]) : 0;

    // Extract the main explanation (everything before the ratings)
    let explanation = errorMessage.replace(/^Verification failed:\s*/i, '');
    explanation = explanation.split('(Creativity:')[0].trim();

    const extractedData = {
      passed: false,
      score,
      explanation,
      creativity,
      authenticity,
      effort,
      confidence: score,
      aiConfidence: score / 100,
      challengeCompleted: false,
      details: explanation,
      timestamp: new Date().toISOString(),
    };

    console.log('📊 Extracted AI data:', extractedData);
    return extractedData;
  };

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
        message:
          progress >= 60
            ? 'Face detected and validated'
            : progress >= 20
              ? 'Analyzing facial features...'
              : 'Waiting for file check...',
        confidence: progress >= 60 ? 0.92 : undefined,
      },
      {
        id: 'ai-challenge-check',
        name: 'AI Challenge Verification',
        status: progress >= 100 ? 'completed' : progress >= 60 ? 'running' : 'pending',
        progress: progress >= 60 ? Math.min((progress - 60) * 2.5, 100) : 0, // Scale 60-100 to 0-100
        message:
          progress >= 100
            ? 'Challenge completion verified'
            : progress >= 60
              ? 'Analyzing challenge performance...'
              : 'Waiting for face detection...',
        confidence: progress >= 100 ? 0.88 : undefined,
      },
    ];
  };

  const parseAIRatings = (explanation: string, aiResult: any = null) => {
    console.log('🔍 parseAIRatings called with:');
    console.log('  explanation:', explanation);
    console.log('  aiResult:', aiResult);

    // First try to get ratings from the aiResult object if available
    if (aiResult) {
      console.log('  Checking aiResult properties...');
      const creativity = aiResult.creativity || aiResult.creativityScore;
      const authenticity = aiResult.authenticity || aiResult.authenticityScore;
      const effort = aiResult.effort || aiResult.effortScore;

      console.log('  Found in aiResult:', { creativity, authenticity, effort });

      if (creativity !== undefined && authenticity !== undefined && effort !== undefined) {
        console.log('  ✅ Using ratings from aiResult object');
        return { creativity, authenticity, effort };
      }
    }

    // Fallback to parsing from explanation string
    console.log('  Parsing from explanation string...');

    const creativityMatch = explanation.match(/(?:[Cc]reativity|eativity):\s*(\d+)\/10/);
    const authenticityMatch = explanation.match(/(?:[Aa]uthenticity|uthenticity):\s*(\d+)\/10/);
    const effortMatch = explanation.match(/(?:[Ee]ffort|ffort):\s*(\d+)\/10/);

    const result = {
      creativity: creativityMatch ? parseInt(creativityMatch[1]) : 0,
      authenticity: authenticityMatch ? parseInt(authenticityMatch[1]) : 0,
      effort: effortMatch ? parseInt(effortMatch[1]) : 0,
    };

    console.log('  📊 Final parsed ratings:', result);
    return result;
  };

  const cleanAIExplanation = (explanation: string) => {
    console.log('🧹 cleanAIExplanation called with:', explanation);

    if (!explanation) {
      console.log('  ❌ No explanation provided, using fallback');
      return 'Challenge completion could not be verified.';
    }

    let cleaned = explanation;
    console.log('  Step 1 - Original:', cleaned);

    // Remove the parenthetical ratings part at the end
    cleaned = cleaned.split('(')[0].trim();
    console.log('  Step 2 - After removing (...):', cleaned);

    // Handle truncation
    if (cleaned.includes('…')) {
      console.log('  Step 3 - Handling truncation...');
      // Remove everything from … onwards
      cleaned = cleaned.split('…')[0].trim();
      console.log('  Step 3a - After removing …:', cleaned);

      // If it ends mid-word, try to clean it up
      if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
        const words = cleaned.split(' ');
        if (words.length > 1) {
          // Remove the last word if it seems incomplete
          const lastWord = words[words.length - 1];
          if (lastWord.length < 3 || !lastWord.match(/^[A-Za-z]+$/)) {
            words.pop();
            cleaned = words.join(' ') + '.';
            console.log('  Step 3b - Removed incomplete word:', cleaned);
          }
        }
      }
    }

    // Remove "Verification failed:" prefix if present
    cleaned = cleaned.replace(/^Verification failed:\s*/i, '');
    console.log('  Step 4 - After removing prefix:', cleaned);

    // Final validation
    if (!cleaned || cleaned.length < 3) {
      console.log('  ❌ Cleaned explanation too short, using fallback');
      return 'Challenge completion could not be verified.';
    }

    console.log('  ✅ Final cleaned explanation:', cleaned);
    return cleaned;
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
        setErrorMessage('Verification checks did not pass.');
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
    const hasBackgroundVerification =
      backgroundTaskIds.verificationId && backgroundStatus.verification.status !== 'pending';
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
          title: 'Analysis failed',
          subtitle: 'Our AI deemed the challenge incomplete',
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
        </div>

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
              <ThematicContainer color="nocenaBlue" glassmorphic={true} asButton={false} rounded="2xl" className="p-8">
                {/* Analysis Icon */}
                <div className="w-16 h-16 bg-nocenaBlue/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-nocenaBlue/30">
                  <svg className="w-8 h-8 text-nocenaBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-2">
                  {backgroundStatus.verification.status !== 'pending' ? 'Instant Analysis Ready' : 'AI Analysis Ready'}
                </h3>

                {/* Subtitle */}
                <p className="text-sm text-gray-300 mb-6">
                  {backgroundStatus.verification.status !== 'pending'
                    ? 'Results available immediately'
                    : 'Neural verification system online'}
                </p>

                {/* File Info - Minimal */}
                <div className="flex justify-center gap-6 mb-8 text-xs text-gray-400">
                  <div>Video: {(videoBlob.size / 1024 / 1024).toFixed(1)}MB</div>
                  <div>Photo: {(photoBlob.size / 1024).toFixed(0)}KB</div>
                </div>
              </ThematicContainer>
            </div>
          )}

          {verificationStage === 'verifying' && (
            <div className="text-center">
              <ThematicContainer color="nocenaPink" glassmorphic={true} asButton={false} rounded="2xl" className="p-8">
                {/* Loading Animation */}
                <div className="w-16 h-16 border-4 border-nocenaPink/20 border-t-nocenaPink rounded-full animate-spin mx-auto mb-6" />

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-4">
                  {backgroundVerificationUsed ? 'Background Analysis' : 'Neural Analysis'}
                </h3>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700/50 rounded-full h-2 mb-6">
                  <div
                    className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-nocenaPink to-nocenaPurple"
                    style={{ width: `${getOverallProgress()}%` }}
                  />
                </div>

                {/* Current Step */}
                <p className="text-sm text-gray-300">{currentStepMessage}</p>
              </ThematicContainer>
            </div>
          )}

          {verificationStage === 'complete' && (
            <div className="text-center">
              <ThematicContainer
                color="nocenaPurple"
                glassmorphic={true}
                asButton={false}
                rounded="2xl"
                className="p-6"
              >
                {/* Success Icon */}
                <div className="w-16 h-16 bg-nocenaPurple/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-nocenaPurple/30">
                  <svg className="w-8 h-8 text-nocenaPurple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-2">Challenge passed respect +</h3>

                {/* Score Display */}
                <div className="mb-6">
                  {(() => {
                    // UPDATED: Extract AI analysis data for SUCCESS case (same as failure logic)
                    let aiResult = null;
                    let aiExplanation = '';

                    // First, try to get AI step result from verification steps
                    if (verificationResult?.steps) {
                      const aiStep = verificationResult.steps.find((s: any) => s.id === 'ai-challenge-check');
                      if (aiStep?.result) {
                        aiResult = aiStep.result.rawAIResponse || aiStep.result;
                        aiExplanation = aiResult?.explanation || aiStep.result.explanation || '';
                      }
                    }

                    // Fallback: Use the main verification result if no steps found
                    if (!aiResult && verificationResult) {
                      aiResult = verificationResult;
                      aiExplanation = verificationResult.explanation || verificationResult.details || '';
                    }

                    // UPDATED: Parse ratings using the same logic as failure case
                    const extractRatingsFromText = (text: string) => {
                      const creativityMatch = text.match(/(?:[Cc]reativity|eativity):\s*(\d+)\/10/);
                      const authenticityMatch = text.match(/(?:[Aa]uthenticity|uthenticity):\s*(\d+)\/10/);
                      const effortMatch = text.match(/(?:[Ee]ffort|ffort):\s*(\d+)\/10/);

                      return {
                        creativity: creativityMatch ? parseInt(creativityMatch[1]) : 0,
                        authenticity: authenticityMatch ? parseInt(authenticityMatch[1]) : 0,
                        effort: effortMatch ? parseInt(effortMatch[1]) : 0,
                      };
                    };

                    // Try to get ratings from aiResult object first, then fallback to text parsing
                    let ratings = { creativity: 0, authenticity: 0, effort: 0 };

                    if (aiResult) {
                      // Try to get from object properties
                      const objRatings = {
                        creativity: aiResult.creativity || aiResult.creativityScore,
                        authenticity: aiResult.authenticity || aiResult.authenticityScore,
                        effort: aiResult.effort || aiResult.effortScore,
                      };

                      if (
                        objRatings.creativity !== undefined &&
                        objRatings.authenticity !== undefined &&
                        objRatings.effort !== undefined
                      ) {
                        ratings = objRatings;
                      } else {
                        // Fallback to parsing from explanation text
                        ratings = extractRatingsFromText(aiExplanation);
                      }
                    } else {
                      // Last resort: try to parse from any available text
                      ratings = extractRatingsFromText(aiExplanation);
                    }

                    // Calculate overall score
                    const overallScore =
                      aiResult?.score ||
                      Math.round(((ratings.creativity + ratings.authenticity + ratings.effort) * 10) / 3);

                    // DEBUG: Log the parsing results
                    console.log('SUCCESS PARSING DEBUG:', {
                      aiResult,
                      aiExplanation,
                      ratings,
                      overallScore,
                      verificationResult,
                    });

                    return (
                      <>
                        <div className="text-4xl font-black bg-gradient-to-r from-nocenaPink to-nocenaPurple bg-clip-text text-transparent mb-2">
                          {overallScore}
                        </div>
                        <div className="text-sm text-gray-400 mb-6">Performance Score</div>

                        {/* Compact Metrics */}
                        <div className="flex justify-center gap-6 mb-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-nocenaPink">{ratings.creativity}</div>
                            <div className="text-xs text-gray-400">Creative</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-nocenaBlue">{ratings.authenticity}</div>
                            <div className="text-xs text-gray-400">Authentic</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-nocenaPurple">{ratings.effort}</div>
                            <div className="text-xs text-gray-400">Effort</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Reward */}
                <div className="bg-black/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-bold text-white">{challenge.reward}</span>
                    <Image src="/nocenix.ico" alt="Nocenix" width={20} height={20} />
                    <span className="text-sm text-gray-300">NOCENIX</span>
                  </div>
                </div>
              </ThematicContainer>
            </div>
          )}

          {verificationStage === 'failed' && (
            <div className="text-center">
              <ThematicContainer color="nocenaPink" glassmorphic={true} asButton={false} rounded="2xl" className="p-8">
                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-2">Challenge failed</h3>

                {/* Score Display */}
                <div className="mb-6">
                  {(() => {
                    // Extract AI analysis data
                    let aiResult = null;
                    if (verificationResult?.steps) {
                      const aiStep = verificationResult.steps.find((s: any) => s.id === 'ai-challenge-check');
                      if (aiStep?.result) {
                        aiResult = aiStep.result.rawAIResponse || aiStep.result;
                      }
                    }
                    if (!aiResult && verificationResult?.score !== undefined) {
                      aiResult = verificationResult;
                    }

                    // Parse ratings using the improved function
                    const ratings = parseAIRatings(aiResult?.explanation || '', aiResult);
                    const overallScore =
                      aiResult?.score ||
                      Math.round(((ratings.creativity + ratings.authenticity + ratings.effort) * 10) / 3);
                    const cleanExplanation = cleanAIExplanation(aiResult?.explanation || '');

                    return (
                      <>
                        <div className="text-4xl font-black text-nocenaPink mb-2">{overallScore}</div>
                        <div className="text-sm text-gray-400 mb-6">Performance Score</div>

                        {/* Compact Metrics */}
                        <div className="flex justify-center gap-6 mb-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-nocenaPink">{ratings.creativity}</div>
                            <div className="text-xs text-gray-400">Creative</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-nocenaBlue">{ratings.authenticity}</div>
                            <div className="text-xs text-gray-400">Authentic</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-nocenaPurple">{ratings.effort}</div>
                            <div className="text-xs text-gray-400">Effort</div>
                          </div>
                        </div>

                        {/* AI Feedback - Integrated and minimal */}
                        <div className="bg-black/30 rounded-xl p-4 mb-6">
                          <div className="text-xs text-gray-400 mb-2">AI Analysis:</div>
                          <p className="text-sm text-gray-200 leading-relaxed">{cleanExplanation}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </ThematicContainer>
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
                  ? 'Use Background Analysis'
                  : 'Start Verification'
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
