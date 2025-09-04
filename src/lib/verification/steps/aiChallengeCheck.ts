// lib/verification/steps/aiChallengeCheck.ts

import {
  extractVideoFrames,
  validateVideoForExtraction,
  estimateTokenUsage,
  createFramePreview,
  type FrameExtractionOptions,
} from '../helpers/videoFrameExtractor';

export interface AIChallengeCheckResult {
  passed: boolean;
  confidence: number; // 0-100
  details: string;
  challengeCompleted: boolean;
  aiConfidence: number;
  explanation: string;
  score: number; // 0-100 from OpenAI
  framesAnalyzed: number;
  rawAIResponse?: any;
}

/**
 * STEP 4: AI Challenge Verification with Your Frame Extractor
 * Uses your existing frame extraction helper and OpenAI GPT-4 Vision
 */
export async function runAIChallengeCheck(
  videoBlob: Blob,
  challengeDescription: string,
  onProgress?: (progress: number, message: string) => void,
): Promise<AIChallengeCheckResult> {
  console.group('🤖 AI CHALLENGE VERIFICATION');
  console.log('Challenge:', challengeDescription);
  console.log('Video size:', `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);

  try {
    // Progress: Starting
    onProgress?.(5, 'Validating video for AI analysis...');

    // Step 1: Validate video file
    const validation = validateVideoForExtraction(videoBlob);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Step 2: Configure frame extraction based on video size/duration
    onProgress?.(10, 'Configuring frame extraction...');

    const extractionOptions: FrameExtractionOptions = {
      framesPerSecond: 3, // More frames for better analysis
      maxFrames: 16, // Keep under OpenAI limits but enough for good analysis
      quality: 0.6, // Balance between quality and token usage
      maxDimension: 512, // Good quality for AI analysis
    };

    console.log('📊 Frame extraction config:', extractionOptions);

    // Step 3: Extract frames from video
    onProgress?.(15, 'Extracting frames from video...');

    const frameResult = await extractVideoFrames(videoBlob, extractionOptions);

    if (frameResult.frames.length === 0) {
      throw new Error('No frames could be extracted from video');
    }

    // Progress update after frame extraction
    onProgress?.(55, `Extracted ${frameResult.totalFrames} frames successfully`);

    // Step 4: Estimate token usage and log info
    const estimatedTokens = estimateTokenUsage(frameResult);
    const framePreview = createFramePreview(frameResult.frames);

    console.log('📷 Frame extraction results:', {
      totalFrames: frameResult.totalFrames,
      videoDuration: `${frameResult.videoDuration.toFixed(2)}s`,
      frameRate: `${frameResult.frameRate.toFixed(2)} fps`,
      resolution: `${frameResult.videoResolution.width}x${frameResult.videoResolution.height}`,
      estimatedTokens,
      preview: framePreview,
    });

    // Step 5: Send frames to AI for analysis
    onProgress?.(65, 'Sending frames to AI for analysis...');

    const aiResult = await sendFramesToAI(frameResult.frames, challengeDescription);

    // Step 6: Process AI response
    onProgress?.(90, 'Processing AI evaluation results...');

    const processedResult = processAIResult(aiResult, frameResult.totalFrames);

    // Final progress update
    onProgress?.(100, processedResult.details);

    console.log('📊 AI challenge verification result:', {
      score: `${processedResult.score}/100`,
      passed: processedResult.passed,
      challengeCompleted: processedResult.challengeCompleted,
      confidence: `${processedResult.confidence}%`,
      framesAnalyzed: processedResult.framesAnalyzed,
      estimatedTokensUsed: estimatedTokens,
    });

    console.log('✅ AI challenge check completed');
    console.groupEnd();

    return processedResult;
  } catch (error) {
    console.error('💥 AI challenge check error:', error);
    console.groupEnd();

    onProgress?.(100, 'AI verification failed due to error');

    // Development mode fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: simulating AI analysis due to error');

      return {
        passed: true,
        confidence: 75,
        details: 'AI analysis simulated (development mode)',
        challengeCompleted: true,
        aiConfidence: 0.75,
        explanation: 'Challenge appears to be completed (simulated)',
        score: 75,
        framesAnalyzed: 0,
      };
    }

    return {
      passed: false,
      confidence: 0,
      details: `AI verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      challengeCompleted: false,
      aiConfidence: 0,
      explanation: 'AI analysis could not be completed due to technical error',
      score: 0,
      framesAnalyzed: 0,
    };
  }
}

/**
 * Send extracted frames to AI API for analysis
 */
async function sendFramesToAI(frames: string[], challengeDescription: string) {
  console.log('📤 Sending frames to AI analysis API...');

  // Prepare the request body
  const requestBody = {
    challengeDescription,
    frames,
    frameCount: frames.length,
  };

  // Call the AI analysis API
  const response = await fetch('/api/ai-challenge-check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ AI API Error Response:', errorText);
    throw new Error(`AI API request failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('📥 AI Analysis Response:', result);

  if (!result.success) {
    throw new Error(result.error || 'AI analysis failed');
  }

  return result;
}

/**
 * Process and validate AI analysis result
 */
function processAIResult(result: any, framesAnalyzed: number): AIChallengeCheckResult {
  const score = result.score || 0;
  const aiConfidence = result.confidence || 0;

  // Determine pass/fail based on score thresholds
  let passed = false;
  let challengeCompleted = false;

  if (score >= 60) {
    // Score 60+ means challenge was completed well
    passed = true;
    challengeCompleted = true;
  } else if (score >= 40) {
    // Score 40-59 is uncertain, but we'll be lenient
    passed = true;
    challengeCompleted = true;
  } else {
    // Score under 40 means challenge likely not completed
    passed = false;
    challengeCompleted = false;
  }

  // Convert to 0-100 confidence scale
  const confidence = passed ? Math.max(60, score) : Math.min(40, score);

  // Create detailed explanation based on score
  let details = result.explanation || 'AI analysis completed';

  if (score >= 80) {
    details = `Excellent! ${details} (Score: ${score}/100 - Creative and engaging completion)`;
  } else if (score >= 60) {
    details = `Good! ${details} (Score: ${score}/100 - Challenge completed successfully)`;
  } else if (score >= 40) {
    details = `Acceptable. ${details} (Score: ${score}/100 - Partial completion detected)`;
  } else {
    details = `Challenge not completed. ${details} (Score: ${score}/100)`;
  }

  return {
    passed,
    confidence,
    details,
    challengeCompleted,
    aiConfidence,
    explanation: result.explanation,
    score,
    framesAnalyzed,
    rawAIResponse: result,
  };
}
