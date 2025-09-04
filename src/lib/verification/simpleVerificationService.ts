// lib/verification/simpleVerificationService.ts

import { runBasicFileCheck } from './steps/basicFileCheck';
import { runHumanVideoCheck } from './steps/humanVideoCheck';
import { runHumanSelfieCheck } from './steps/humanSelfieCheck';
import { runAIChallengeCheck } from './steps/aiChallengeCheck';

export interface VerificationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string;
  confidence?: number;
  result?: any; // Store step-specific results
}

export interface VerificationResult {
  success: boolean;
  steps: VerificationStep[];
  overallConfidence: number;
  passed: boolean;
  isPartial?: boolean; // Indicates if this is a partial verification (with placeholder selfie)
  pendingSteps?: string[]; // List of step IDs that are pending due to placeholders
}

export class SimpleVerificationService {
  private steps: VerificationStep[] = [
    {
      id: 'basic-check',
      name: 'Basic File Check',
      status: 'pending',
      progress: 0,
      message: 'Waiting to start...',
    },
    {
      id: 'human-selfie-check',
      name: 'Human Detection in Selfie',
      status: 'pending',
      progress: 0,
      message: 'Waiting for video check...',
    },
    {
      id: 'ai-challenge-check',
      name: 'AI Challenge Verification',
      status: 'pending',
      progress: 0,
      message: 'Waiting for selfie check...',
    },
  ];

  private onProgressCallback?: (steps: VerificationStep[]) => void;

  constructor(onProgress?: (steps: VerificationStep[]) => void) {
    this.onProgressCallback = onProgress;
  }

  private updateStep(stepId: string, updates: Partial<VerificationStep>) {
    const stepIndex = this.steps.findIndex((s) => s.id === stepId);
    if (stepIndex !== -1) {
      this.steps[stepIndex] = { ...this.steps[stepIndex], ...updates };
      this.onProgressCallback?.(this.steps);
    }
  }

  // STEP 1: Basic File Check
  async runBasicCheck(videoBlob: Blob, photoBlob: Blob): Promise<boolean> {
    this.updateStep('basic-check', {
      status: 'running',
      progress: 0,
      message: 'Starting file validation...',
    });

    try {
      const result = await runBasicFileCheck(videoBlob, photoBlob, (progress, message) => {
        this.updateStep('basic-check', {
          status: 'running',
          progress,
          message,
        });
      });

      this.updateStep('basic-check', {
        status: result.passed ? 'completed' : 'failed',
        progress: 100,
        message: result.details,
        confidence: result.confidence / 100, // Convert to 0-1 scale
        result, // Store the full result for later reference
      });

      return result.passed;
    } catch (error) {
      this.updateStep('basic-check', {
        status: 'failed',
        progress: 100,
        message: 'File validation failed',
        confidence: 0,
      });
      return false;
    }
  }

  // STEP 2: Human Detection in Video
  async runHumanVideoCheck(videoBlob: Blob): Promise<boolean> {
    this.updateStep('human-video-check', {
      status: 'running',
      progress: 0,
      message: 'Starting human detection...',
    });

    try {
      const result = await runHumanVideoCheck(videoBlob, (progress, message) => {
        this.updateStep('human-video-check', {
          status: 'running',
          progress,
          message,
        });
      });

      this.updateStep('human-video-check', {
        status: result.passed ? 'completed' : 'failed',
        progress: 100,
        message: result.details,
        confidence: result.confidence / 100, // Convert to 0-1 scale
        result,
      });

      return result.passed;
    } catch (error) {
      this.updateStep('human-video-check', {
        status: 'failed',
        progress: 100,
        message: 'Human detection failed',
        confidence: 0,
      });
      return false;
    }
  }

  // STEP 3: Human Detection in Selfie
  async runHumanSelfieCheck(photoBlob: Blob): Promise<boolean> {
    this.updateStep('human-selfie-check', {
      status: 'running',
      progress: 0,
      message: 'Starting face detection...',
    });

    try {
      const result = await runHumanSelfieCheck(photoBlob, (progress, message) => {
        this.updateStep('human-selfie-check', {
          status: 'running',
          progress,
          message,
        });
      });

      this.updateStep('human-selfie-check', {
        status: result.passed ? 'completed' : 'failed',
        progress: 100,
        message: result.details,
        confidence: result.confidence / 100, // Convert to 0-1 scale
        result,
      });

      return result.passed;
    } catch (error) {
      this.updateStep('human-selfie-check', {
        status: 'failed',
        progress: 100,
        message: 'Face detection failed',
        confidence: 0,
      });
      return false;
    }
  }

  // STEP 4: AI Challenge Check
  async runAICheck(videoBlob: Blob, challengeDescription: string): Promise<boolean> {
    this.updateStep('ai-challenge-check', {
      status: 'running',
      progress: 0,
      message: 'Starting AI analysis...',
    });

    try {
      const result = await runAIChallengeCheck(videoBlob, challengeDescription, (progress, message) => {
        this.updateStep('ai-challenge-check', {
          status: 'running',
          progress,
          message,
        });
      });

      this.updateStep('ai-challenge-check', {
        status: result.passed ? 'completed' : 'failed',
        progress: 100,
        message: result.details,
        confidence: result.confidence / 100, // Convert to 0-1 scale
        result,
      });

      return result.passed;
    } catch (error) {
      this.updateStep('ai-challenge-check', {
        status: 'failed',
        progress: 100,
        message: 'AI verification failed',
        confidence: 0,
      });
      return false;
    }
  }

  // Main verification process - UPDATED to handle placeholders
  async runFullVerification(
    videoBlob: Blob,
    photoBlob: Blob,
    challengeDescription: string,
  ): Promise<VerificationResult> {
    try {
      // Step 1: Basic file check (handles placeholders gracefully)
      const basicCheckPassed = await this.runBasicCheck(videoBlob, photoBlob);
      if (!basicCheckPassed) {
        return this.getFailedResult('Basic file check failed');
      }

      // Check if we're dealing with a placeholder photo
      const basicResult = this.steps.find((s) => s.id === 'basic-check')?.result;
      const hasPlaceholderPhoto = basicResult?.isPlaceholderPhoto === true;

      // Step 2: Skip video check for now (your service doesn't use it)
      // const humanVideoCheckPassed = await this.runHumanVideoCheck(videoBlob);
      // if (!humanVideoCheckPassed) {
      //   return this.getFailedResult('Human detection in video failed');
      // }

      // Step 3: Human detection in selfie (handles placeholders gracefully)
      const humanSelfieCheckPassed = await this.runHumanSelfieCheck(photoBlob);
      if (!humanSelfieCheckPassed) {
        // Check if this failed due to placeholder - if so, create partial result
        const selfieResult = this.steps.find((s) => s.id === 'human-selfie-check')?.result;
        if (selfieResult?.isPlaceholder) {
          // This should not happen as placeholders return passed=true, but handle just in case
          console.log('Unexpected: Placeholder selfie check failed');
        }
        return this.getFailedResult('Human detection in selfie failed');
      }

      // Step 4: AI challenge verification (only if we have a real photo or want to try anyway)
      const aiCheckPassed = await this.runAICheck(videoBlob, challengeDescription);
      if (!aiCheckPassed) {
        return this.getFailedResult('AI challenge verification failed');
      }

      // All checks passed - determine if this is partial or complete
      const overallConfidence = this.calculateOverallConfidence();
      const isPartial = hasPlaceholderPhoto;
      const pendingSteps = isPartial ? ['human-selfie-check'] : [];

      if (isPartial) {
        console.log('✅ Partial verification completed - awaiting selfie');
        return {
          success: true,
          steps: this.steps,
          overallConfidence,
          passed: true,
          isPartial: true,
          pendingSteps,
        };
      } else {
        console.log('✅ Full verification completed');
        return {
          success: true,
          steps: this.steps,
          overallConfidence,
          passed: true,
          isPartial: false,
        };
      }
    } catch (error) {
      console.error('Verification process error:', error);
      return this.getFailedResult('Verification process failed');
    }
  }

  private calculateOverallConfidence(): number {
    const completedSteps = this.steps.filter((s) => s.status === 'completed' && s.confidence);
    if (completedSteps.length === 0) return 0;

    const totalConfidence = completedSteps.reduce((sum, step) => sum + (step.confidence || 0), 0);
    return totalConfidence / completedSteps.length;
  }

  private getFailedResult(message: string): VerificationResult {
    // Get more detailed error from failed steps
    const failedStep = this.steps.find((s) => s.status === 'failed');
    const details = failedStep ? failedStep.message : message;

    return {
      success: false,
      steps: this.steps,
      overallConfidence: 0,
      passed: false,
      isPartial: false,
    };
  }

  getSteps(): VerificationStep[] {
    return this.steps;
  }

  // NEW: Check if verification is ready for completion (all real data available)
  isReadyForFullVerification(videoBlob: Blob, photoBlob: Blob): boolean {
    const hasValidVideo = videoBlob && videoBlob.size > 0 && videoBlob.type.startsWith('video/');
    const hasValidPhoto = photoBlob && photoBlob.size > 100 && photoBlob.type.startsWith('image/');
    return hasValidVideo && hasValidPhoto;
  }
}
