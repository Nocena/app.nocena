'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PrimaryButton from '../../../components/ui/PrimaryButton';
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [verificationStage, setVerificationStage] = useState<
    'ready' | 'verifying' | 'complete' | 'claiming' | 'success' | 'failed'
  >('ready');
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [currentStepMessage, setCurrentStepMessage] = useState('Ready to verify submission');
  const [challengeDescription, setChallengeDescription] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Create object URLs for media and generate thumbnail
  useEffect(() => {
    const vUrl = URL.createObjectURL(videoBlob);
    const pUrl = URL.createObjectURL(photoBlob);

    setVideoUrl(vUrl);
    setPhotoUrl(pUrl);

    // Generate video thumbnail immediately
    generateThumbnail(vUrl);

    return () => {
      URL.revokeObjectURL(vUrl);
      URL.revokeObjectURL(pUrl);
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [videoBlob, photoBlob]); // Remove thumbnailUrl from dependencies

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
          canvas.toBlob((blob) => {
            if (blob) {
              const thumbUrl = URL.createObjectURL(blob);
              setThumbnailUrl(thumbUrl);
              console.log('Thumbnail generated successfully');
            }
          }, 'image/jpeg', 0.9);
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    };

    video.onloadedmetadata = () => {
      console.log('Video metadata loaded for thumbnail');
      video.currentTime = 0.05;
    };
    
    video.onloadeddata = () => {
      console.log('Video data loaded for thumbnail');
      if (video.videoWidth > 0) {
        extractFrame();
      }
    };

    video.onseeked = () => {
      console.log('Video seeked for thumbnail');
      extractFrame();
    };

    video.oncanplay = () => {
      console.log('Video can play for thumbnail');
      if (!thumbnailUrl) {
        extractFrame();
      }
    };

    video.onerror = (e) => {
      console.error('Error loading video for thumbnail:', e);
    };
  };

  const startVerification = async () => {
    setVerificationStage('verifying');

    // 🎭 FAKE VERIFICATION FOR TESTING
    console.log('🧪 RUNNING FAKE VERIFICATION FOR TESTING');
    
    try {
      // Simulate verification steps with fake progress
      const fakeSteps: VerificationStep[] = [
        {
          id: 'file-check',
          name: 'File Validation',
          status: 'running',
          progress: 0,
          message: 'Checking video and photo files...',
          confidence: 0
        },
        {
          id: 'human-detection',
          name: 'Human Detection', 
          status: 'pending',
          progress: 0,
          message: 'Detecting human presence in video...',
          confidence: 0
        },
        {
          id: 'face-match',
          name: 'Face Matching',
          status: 'pending', 
          progress: 0,
          message: 'Comparing faces between video and selfie...',
          confidence: 0
        },
        {
          id: 'activity-check',
          name: 'Activity Analysis',
          status: 'pending',
          progress: 0, 
          message: 'Analyzing challenge completion...',
          confidence: 0
        },
        {
          id: 'final-review',
          name: 'Final Review',
          status: 'pending',
          progress: 0,
          message: 'Conducting final verification...',
          confidence: 0
        }
      ];

      // Simulate each step with realistic timing
      for (let i = 0; i < fakeSteps.length; i++) {
        const step = fakeSteps[i];
        
        // Mark current step as running
        step.status = 'running';
        step.message = `Processing ${step.name.toLowerCase()}...`;
        setVerificationSteps([...fakeSteps]);
        setCurrentStepMessage(step.message);

        // Simulate progress within the step
        for (let progress = 0; progress <= 100; progress += 25) {
          step.progress = progress;
          setVerificationSteps([...fakeSteps]);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Mark step as completed with fake confidence
        step.status = 'completed';
        step.confidence = 0.85 + (Math.random() * 0.14); // 85-99% confidence
        step.progress = 100;
        
        // Set completion messages
        switch (step.id) {
          case 'file-check':
            step.message = 'Video and photo files are valid and high quality';
            break;
          case 'human-detection':
            step.message = 'Human detected in video with clear visibility';
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
        
        // Brief pause between steps
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Create fake successful result
      const fakeResult = {
        passed: true,
        overallConfidence: 0.92,
        details: 'All verification checks completed successfully. Challenge completion confirmed with high confidence.',
        steps: fakeSteps,
        timestamp: new Date().toISOString()
      };

      setVerificationResult(fakeResult);
      setVerificationStage('complete');
      setCurrentStepMessage('All verification checks passed!');
      
      console.log('🎉 FAKE VERIFICATION COMPLETED SUCCESSFULLY');

    } catch (error) {
      console.error('Fake verification error:', error);
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setVerificationStage('success');

      onVerificationComplete({
        video: videoBlob,
        photo: photoBlob,
        verificationResult,
        description: challengeDescription,
        challenge: challenge,
      });

      setTimeout(() => {
        window.location.href = '/home';
      }, 2000);
    } catch (error) {
      console.error('Error claiming tokens:', error);
      alert('Failed to claim tokens. Please try again.');
      setVerificationStage('complete');
    }
  };

  const getStageInfo = () => {
    switch (verificationStage) {
      case 'ready':
        return {
          title: 'AI Verification',
          subtitle: 'Ready to analyze your submission',
          color: 'nocenaPink'
        };
      case 'verifying':
        return {
          title: 'Analyzing...',
          subtitle: currentStepMessage,
          color: 'nocenaPink'
        };
      case 'complete':
        return {
          title: 'Verified ✓',
          subtitle: 'Ready to claim your reward',
          color: 'nocenaPurple'
        };
      case 'claiming':
        return {
          title: 'Processing...',
          subtitle: 'Claiming your tokens',
          color: 'nocenaPink'
        };
      case 'success':
        return {
          title: 'Success!',
          subtitle: `+${challenge.reward} Nocenix claimed`,
          color: 'nocenaPurple'
        };
      case 'failed':
        return {
          title: 'Failed',
          subtitle: 'Verification unsuccessful',
          color: 'red'
        };
      default:
        return {
          title: 'AI Verification',
          subtitle: 'Analyzing your submission',
          color: 'nocenaPink'
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

  return (
    <div className="text-white h-full flex flex-col px-6 py-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-light mb-1">{stageInfo.title}</h2>
        <div className="text-sm text-gray-400">
          {challenge.title} • {stageInfo.subtitle}
        </div>
      </div>

      {/* Media Preview - BeReal Style Layout */}
      <div className="mb-6">
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
          {/* Main Video - Large */}
          <div className="relative h-64 w-full">
            <video
              ref={videoRef}
              src={videoUrl}
              poster={thumbnailUrl || undefined}
              className="w-full h-full object-cover"
              preload="metadata"
              playsInline
              muted
              onLoadedData={() => {
                console.log('Main video loaded data');
                if (!thumbnailUrl && videoRef.current) {
                  const video = videoRef.current;
                  video.currentTime = 0.05;
                }
              }}
              onSeeked={() => {
                console.log('Main video seeked');
                if (!thumbnailUrl && videoRef.current) {
                  try {
                    const video = videoRef.current;
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth || 640;
                    canvas.height = video.videoHeight || 480;
                    
                    const ctx = canvas.getContext('2d');
                    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                      canvas.toBlob((blob) => {
                        if (blob) {
                          const thumbUrl = URL.createObjectURL(blob);
                          setThumbnailUrl(thumbUrl);
                          console.log('Thumbnail generated from main video');
                        }
                      }, 'image/jpeg', 0.9);
                    }
                  } catch (error) {
                    console.error('Error generating thumbnail from main video:', error);
                  }
                }
              }}
              onCanPlay={() => {
                console.log('Main video can play');
                if (!thumbnailUrl && videoRef.current && videoRef.current.videoWidth > 0) {
                  const video = videoRef.current;
                  video.currentTime = 0.05;
                }
              }}
              onClick={(e) => {
                const video = e.target as HTMLVideoElement;
                if (video.paused) {
                  video.play();
                } else {
                  video.pause();
                }
              }}
              style={{
                WebkitPlaysinline: true,
              } as React.CSSProperties}
            />

            {/* Selfie Overlay - Top Right Corner (BeReal Style) */}
            <div className="absolute top-4 right-4 w-20 h-24 rounded-xl overflow-hidden border-2 border-white shadow-lg">
              <img 
                src={photoUrl} 
                alt="Verification selfie" 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Challenge Info Overlay - Bottom */}
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

      {/* Status Section */}
      <div className="mb-6 flex-1">
        {verificationStage === 'ready' && (
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/20 rounded-2xl p-6">
              <div className="w-16 h-16 bg-nocenaPink/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-nocenaPink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">AI Analysis Ready</h3>
              <p className="text-sm text-gray-300 mb-4">
                Our AI will verify your challenge completion using advanced computer vision
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
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
                <h3 className="text-lg font-medium text-nocenaPink">Neural Analysis Active</h3>
              </div>

              {/* Overall Progress */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-nocenaPink to-nocenaPurple"
                  style={{ width: `${getOverallProgress()}%` }}
                />
              </div>

              {/* Current Step */}
              <div className="text-center">
                <p className="text-sm text-gray-300">{currentStepMessage}</p>
              </div>
            </div>

            {/* Verification Steps */}
            <div className="space-y-2">
              {verificationSteps.map((step) => (
                <div key={step.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      step.status === 'completed' ? 'bg-nocenaPurple' :
                      step.status === 'running' ? 'bg-nocenaPink animate-pulse' :
                      step.status === 'failed' ? 'bg-red-500' : 'bg-gray-600'
                    }`} />
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
                <h3 className="text-lg font-medium text-nocenaPurple mb-2">Verification Complete!</h3>
                <p className="text-sm text-gray-300 mb-4">
                  AI analysis passed with {verificationResult ? Math.round(verificationResult.overallConfidence * 100) : 95}% confidence
                </p>
                
                {/* Reward Display */}
                <div className="bg-black/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-2xl font-bold">{challenge.reward}</span>
                    <Image src="/nocenix.ico" alt="Nocenix" width={24} height={24} />
                    <span className="text-sm text-gray-300">NOCENIX</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Describe your completion:</label>
              <textarea
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-nocenaPink transition-colors resize-none"
              />
            </div>
          </div>
        )}

        {verificationStage === 'claiming' && (
          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-800/20 rounded-2xl p-8">
              <div className="w-16 h-16 border-4 border-nocenaPink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Processing Claim</h3>
              <p className="text-sm text-gray-300">Executing blockchain transaction...</p>
            </div>
          </div>
        )}

        {verificationStage === 'success' && (
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-900/20 to-purple-900/20 border border-green-800/20 rounded-2xl p-8">
              <div className="w-16 h-16 bg-nocenaPurple rounded-full flex items-center justify-center mx-auto mb-4">
                <Image src="/nocenix.ico" alt="Success" width={32} height={32} />
              </div>
              <h3 className="text-xl font-bold text-nocenaPurple mb-2">Tokens Claimed!</h3>
              <p className="text-lg mb-1">+{challenge.reward} Nocenix</p>
              <p className="text-sm text-gray-300">Returning to home...</p>
            </div>
          </div>
        )}

        {verificationStage === 'failed' && (
          <div>
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-800/20 rounded-2xl p-6 mb-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-red-400 mb-2">Verification Failed</h3>
                <p className="text-sm text-gray-300 mb-4">{currentStepMessage}</p>
              </div>

              {/* Show Failed Steps with Details */}
              {verificationSteps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-red-300 mb-2">Issues Found:</h4>
                  {verificationSteps
                    .filter((s) => s.status === 'failed')
                    .map((step) => (
                      <div key={step.id} className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-red-300 mb-1">{step.name}</h5>
                            <p className="text-xs text-gray-300 leading-relaxed">{step.message}</p>
                            {step.confidence !== undefined && (
                              <p className="text-xs text-red-400 mt-1">
                                Confidence: {Math.round(step.confidence * 100)}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Show Overall Verification Result Details */}
              {verificationResult && (
                <div className="mt-4 bg-black/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Overall Analysis:</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">Overall Confidence:</span>
                      <span className="text-red-400 ml-2 font-medium">
                        {Math.round(verificationResult.overallConfidence * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Required:</span>
                      <span className="text-white ml-2">≥70%</span>
                    </div>
                  </div>
                  {verificationResult.details && (
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                      {verificationResult.details}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Helpful Tips */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/20 rounded-2xl p-4">
              <h4 className="text-sm font-medium text-blue-300 mb-2">💡 Tips for Better Results:</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Ensure good lighting for both video and selfie</li>
                <li>• Keep your face clearly visible in the selfie</li>
                <li>• Record the full challenge activity in the video</li>
                <li>• Make sure video is at least 3 seconds long</li>
                <li>• Avoid blurry or dark footage</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-auto">
        {verificationStage === 'ready' && (
          <PrimaryButton 
            onClick={startVerification} 
            text="Start Verification" 
            className="flex-1"
            isActive={true}
          />
        )}

        {verificationStage === 'complete' && (
          <PrimaryButton 
            onClick={handleClaimTokens} 
            text="Claim Tokens"
            className="flex-1"
            disabled={!challengeDescription.trim()}
            isActive={true}
          />
        )}

        {verificationStage === 'failed' && (
          <PrimaryButton 
            onClick={startVerification} 
            text="Retry Verification" 
            className="flex-1"
            isActive={true}
          />
        )}

        {(verificationStage === 'verifying' || verificationStage === 'claiming') && (
          <PrimaryButton 
            text="Processing..." 
            className="flex-1" 
            disabled={true}
            isActive={false}
          />
        )}
      </div>
    </div>
  );
};

export default VerificationScreen;
