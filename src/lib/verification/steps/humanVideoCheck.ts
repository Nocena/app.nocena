// lib/verification/steps/humanVideoCheck.ts

import { detectHumanInVideo, type VideoHumanDetectionResult } from '../helpers/tensorflowHumanDetection';

export interface HumanVideoCheckResult {
  passed: boolean;
  confidence: number; // 0-100
  details: string;
  framesChecked: number;
  humanFrames: number;
  maxConfidence: number;
  stoppedEarly: boolean;
}

/**
 * STEP 2: Human Detection in Video
 * Uses TensorFlow to detect humans in video frames - if humans detected in some frames, pass to next step
 * Analyzes frames every 0.1 seconds and stops early when humans found in 2 consecutive frames
 */
export async function runHumanVideoCheck(
  videoBlob: Blob,
  onProgress?: (progress: number, message: string) => void,
): Promise<HumanVideoCheckResult> {
  console.group('🤖 HUMAN DETECTION IN VIDEO');
  console.log('Video size:', `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);

  try {
    // Progress: Starting
    onProgress?.(5, 'Validating video format...');

    // Basic video validation
    if (!videoBlob.type.startsWith('video/')) {
      throw new Error('Invalid file format - not a video file');
    }

    if (videoBlob.size < 1024) {
      throw new Error('Video file too small - appears to be empty');
    }

    if (videoBlob.size > 100 * 1024 * 1024) {
      throw new Error('Video file too large (>100MB)');
    }

    // Progress: Loading video
    onProgress?.(15, 'Loading video for analysis...');

    // Create video element for processing
    const videoUrl = URL.createObjectURL(videoBlob);
    const videoElement = document.createElement('video');

    // Load video with error handling
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video loading timeout - file may be corrupted'));
      }, 10000); // 10 second timeout for video loading

      videoElement.onloadedmetadata = () => {
        clearTimeout(timeout);
        console.log(
          `📹 Video loaded: ${videoElement.videoWidth}x${videoElement.videoHeight}, duration: ${videoElement.duration}s`,
        );
        resolve();
      };

      videoElement.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load video - file may be corrupted'));
      };

      videoElement.src = videoUrl;
      videoElement.load();
    });

    // Validate video properties
    if (videoElement.videoWidth <= 0 || videoElement.videoHeight <= 0) {
      throw new Error('Invalid video dimensions');
    }

    if (videoElement.videoWidth < 100 || videoElement.videoHeight < 100) {
      throw new Error('Video resolution too low (minimum 100x100)');
    }

    console.log('✅ Video validation passed');

    // Progress: Loading TensorFlow models
    onProgress?.(35, 'Loading TensorFlow human detection models...');

    // Use TensorFlow to detect humans in video frames
    const detectionResult: VideoHumanDetectionResult = await detectHumanInVideo(videoElement, {
      frameInterval: 0.1, // Check every 0.1 seconds as requested
      minConfidence: 0.5, // 50% confidence threshold (more lenient for video)
      maxFrames: 50, // Don't check more than 50 frames (5 seconds max)
      consecutiveThreshold: 2, // Stop after 2 consecutive detections
    });

    // Progress: Analyzing results
    onProgress?.(90, 'Processing human detection results...');

    // Clean up video URL
    URL.revokeObjectURL(videoUrl);

    // Determine if video passes our requirements
    const minDetectionThreshold = 1; // Need at least 1 human detection
    const passed = detectionResult.hasHuman && detectionResult.detectionCount >= minDetectionThreshold;

    // Convert confidence to 0-100 scale
    const confidence = passed ? Math.round(detectionResult.confidence * 100) : 0;

    // Enhanced details
    let details = detectionResult.details;
    if (passed && detectionResult.stoppedEarly) {
      details += ' (analysis stopped early - clear human presence detected)';
    }

    // Progress: Complete
    onProgress?.(100, details);

    console.log('📊 Video detection result:', {
      hasHuman: detectionResult.hasHuman,
      confidence: `${confidence}%`,
      detectionCount: detectionResult.detectionCount,
      framesChecked: detectionResult.totalFramesChecked,
      consecutiveDetections: detectionResult.consecutiveDetections,
      stoppedEarly: detectionResult.stoppedEarly,
      passed,
    });

    console.log('✅ Human video check completed');
    console.groupEnd();

    return {
      passed,
      confidence,
      details,
      framesChecked: detectionResult.totalFramesChecked,
      humanFrames: detectionResult.detectionCount,
      maxConfidence: detectionResult.confidence,
      stoppedEarly: detectionResult.stoppedEarly,
    };
  } catch (error) {
    console.error('💥 Human video check error:', error);
    console.groupEnd();

    onProgress?.(100, 'Human detection failed due to error');

    return {
      passed: false,
      confidence: 0,
      details: `Human detection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      framesChecked: 0,
      humanFrames: 0,
      maxConfidence: 0,
      stoppedEarly: false,
    };
  }
}
