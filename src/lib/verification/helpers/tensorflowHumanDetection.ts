// lib/verification/helpers/tensorflowHumanDetection.ts

import * as tf from '@tensorflow/tfjs';

export interface HumanDetectionResult {
  hasHuman: boolean;
  confidence: number; // 0-1 scale
  detectionCount: number;
  details: string;
  boundingBoxes?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>;
}

export interface VideoHumanDetectionResult {
  hasHuman: boolean;
  confidence: number; // 0-1 scale
  detectionCount: number;
  totalFramesChecked: number;
  consecutiveDetections: number;
  details: string;
  stoppedEarly: boolean;
}

// Define types for BlazeFace predictions
interface BlazeFacePrediction {
  topLeft: [number, number];
  bottomRight: [number, number];
  probability?: [number];
  landmarks?: number[][];
}

// Define types for COCO-SSD predictions
interface CocoSsdPrediction {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

// Cache for loaded models
let blazeFaceModel: any = null;
let cocoSsdModel: any = null;
let modelsLoaded = false;

/**
 * Initialize TensorFlow and preload models
 */
export async function initializeTensorFlow(): Promise<void> {
  console.log('🤖 Initializing TensorFlow...');

  try {
    // Initialize TensorFlow backend
    await tf.ready();
    console.log('✅ TensorFlow backend ready:', tf.getBackend());

    // Set memory growth for better performance
    if (tf.getBackend() === 'webgl') {
      tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
    }
  } catch (error) {
    console.error('❌ Failed to initialize TensorFlow:', error);
    throw error;
  }
}

/**
 * Load the BlazeFace model for face detection
 */
async function loadBlazeFaceModel(): Promise<any> {
  if (blazeFaceModel) {
    return blazeFaceModel;
  }

  console.log('📦 Loading BlazeFace model...');

  try {
    const blazeFace = await import('@tensorflow-models/blazeface');
    blazeFaceModel = await blazeFace.load();
    console.log('✅ BlazeFace model loaded successfully');
    return blazeFaceModel;
  } catch (error) {
    console.error('❌ Failed to load BlazeFace model:', error);
    throw error;
  }
}

/**
 * Load the COCO-SSD model as fallback for person detection
 */
async function loadCocoSsdModel(): Promise<any> {
  if (cocoSsdModel) {
    return cocoSsdModel;
  }

  console.log('📦 Loading COCO-SSD model...');

  try {
    const cocoSsd = await import('@tensorflow-models/coco-ssd');
    cocoSsdModel = await cocoSsd.load({
      base: 'mobilenet_v2', // Faster, good enough for human detection
    });
    console.log('✅ COCO-SSD model loaded successfully');
    return cocoSsdModel;
  } catch (error) {
    console.error('❌ Failed to load COCO-SSD model:', error);
    throw error;
  }
}

/**
 * Detect humans in video by analyzing frames at regular intervals
 * Stops early when humans are detected in two consecutive frames
 */
export async function detectHumanInVideo(
  videoElement: HTMLVideoElement,
  options: {
    frameInterval?: number; // Interval between frames in seconds (default: 0.1)
    minConfidence?: number; // Minimum confidence threshold (0-1)
    maxFrames?: number; // Maximum frames to check
    consecutiveThreshold?: number; // Number of consecutive detections to confirm human
  } = {},
): Promise<VideoHumanDetectionResult> {
  const {
    frameInterval = 0.1, // Check every 0.1 seconds
    minConfidence = 0.5, // Lower threshold for video (more forgiving)
    maxFrames = 50, // Don't check more than 50 frames
    consecutiveThreshold = 2, // Stop after 2 consecutive detections
  } = options;

  console.group('🎬 Human Detection in Video');
  console.log('Video details:', {
    duration: `${videoElement.duration}s`,
    size: `${videoElement.videoWidth}x${videoElement.videoHeight}`,
    frameInterval: `${frameInterval}s`,
    minConfidence: `${(minConfidence * 100).toFixed(0)}%`,
    consecutiveThreshold,
  });

  try {
    await initializeTensorFlow();

    const duration = videoElement.duration;
    const currentTime = 0;
    let framesChecked = 0;
    let detectionsCount = 0;
    let consecutiveDetections = 0;
    let maxConfidence = 0;
    let stoppedEarly = false;

    // If duration is invalid, try a few fixed time points
    const timePoints =
      duration && isFinite(duration) && duration > 0
        ? generateTimePoints(duration, frameInterval, maxFrames)
        : [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]; // Fallback time points

    console.log(
      `📍 Will analyze ${Math.min(timePoints.length, maxFrames)} frames at:`,
      timePoints
        .slice(0, maxFrames)
        .map((t) => `${t.toFixed(1)}s`)
        .join(', '),
    );

    for (const timePoint of timePoints.slice(0, maxFrames)) {
      try {
        // Seek to the time point
        await seekToTime(videoElement, timePoint);

        // Wait a bit for the frame to be available
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Extract frame to canvas
        const canvas = extractFrameToCanvas(videoElement);

        // Detect humans in this frame (use both face and person detection for video)
        const frameResult = await detectHumanInImage(canvas, {
          preferFaceDetection: false, // For video, use COCO-SSD first (better for full bodies)
          minConfidence,
          maxFaces: 5, // Allow more detections in video
        });

        framesChecked++;

        if (frameResult.hasHuman) {
          detectionsCount++;
          consecutiveDetections++;
          maxConfidence = Math.max(maxConfidence, frameResult.confidence);

          console.log(
            `✅ Frame ${framesChecked} (${timePoint.toFixed(1)}s): Human detected (${(frameResult.confidence * 100).toFixed(1)}% confidence) - Consecutive: ${consecutiveDetections}`,
          );

          // Stop early if we have enough consecutive detections
          if (consecutiveDetections >= consecutiveThreshold) {
            console.log(`🏁 Stopping early: Found humans in ${consecutiveDetections} consecutive frames`);
            stoppedEarly = true;
            break;
          }
        } else {
          consecutiveDetections = 0; // Reset consecutive counter
          console.log(`❌ Frame ${framesChecked} (${timePoint.toFixed(1)}s): No human detected`);
        }
      } catch (frameError) {
        console.warn(`⚠️ Failed to analyze frame at ${timePoint.toFixed(1)}s:`, frameError);
        consecutiveDetections = 0; // Reset on error
      }
    }

    // Calculate results
    const hasHuman = detectionsCount > 0;
    const confidence = hasHuman ? Math.min(0.95, maxConfidence + 0.1) : 0; // Slight bonus for video detection

    const details = hasHuman
      ? `Human detected in ${detectionsCount}/${framesChecked} frames (max ${(maxConfidence * 100).toFixed(1)}% confidence)${stoppedEarly ? ' - stopped early' : ''}`
      : `No humans detected in ${framesChecked} frames analyzed`;

    console.log('📊 Video detection summary:', {
      hasHuman,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      detectionsCount,
      framesChecked,
      consecutiveDetections,
      stoppedEarly,
    });

    console.groupEnd();

    return {
      hasHuman,
      confidence,
      detectionCount: detectionsCount,
      totalFramesChecked: framesChecked,
      consecutiveDetections,
      details,
      stoppedEarly,
    };
  } catch (error) {
    console.error('💥 Video human detection failed:', error);
    console.groupEnd();

    return {
      hasHuman: false,
      confidence: 0,
      detectionCount: 0,
      totalFramesChecked: 0,
      consecutiveDetections: 0,
      details: `Video detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stoppedEarly: false,
    };
  }
}

/**
 * Generate time points for frame analysis
 */
function generateTimePoints(duration: number, interval: number, maxFrames: number): number[] {
  const timePoints: number[] = [];
  let currentTime = 0;

  while (currentTime < duration - 0.1 && timePoints.length < maxFrames) {
    timePoints.push(currentTime);
    currentTime += interval;
  }

  return timePoints;
}

/**
 * Seek video to specific time with timeout
 */
async function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      resolve(); // Continue even if seek doesn't complete
    }, 300); // Short timeout for video seeking

    const onSeeked = () => {
      clearTimeout(timeout);
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };

    video.addEventListener('seeked', onSeeked);

    // If already at the right time (within 0.1s), resolve immediately
    if (Math.abs(video.currentTime - time) < 0.1) {
      clearTimeout(timeout);
      video.removeEventListener('seeked', onSeeked);
      resolve();
      return;
    }

    video.currentTime = time;
  });
}

/**
 * Extract current video frame to canvas
 */
function extractFrameToCanvas(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas;
}

/**
 * Detect human faces in an image using BlazeFace (preferred for selfies)
 */
export async function detectHumanInImage(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  options: {
    preferFaceDetection?: boolean; // Use BlazeFace first, fallback to COCO-SSD
    minConfidence?: number; // Minimum confidence threshold (0-1)
    maxFaces?: number; // Maximum number of faces to detect
  } = {},
): Promise<HumanDetectionResult> {
  const { preferFaceDetection = true, minConfidence = 0.6, maxFaces = 3 } = options;

  console.log(`🔍 Analyzing ${imageElement.width}x${imageElement.height} image/frame...`);

  try {
    await initializeTensorFlow();

    let detectionResult: HumanDetectionResult;

    // For video frames, try COCO-SSD first (better for full body detection)
    // For selfies, try BlazeFace first (better for faces)
    if (preferFaceDetection) {
      // Selfie mode: BlazeFace first, COCO-SSD fallback
      try {
        detectionResult = await detectFacesWithBlazeFace(imageElement, minConfidence, maxFaces);

        if (detectionResult.hasHuman && detectionResult.confidence >= minConfidence) {
          return detectionResult;
        }
      } catch (blazeError) {
        console.warn('⚠️ BlazeFace failed, falling back to COCO-SSD:', blazeError);
      }

      // Fallback to COCO-SSD
      detectionResult = await detectPersonWithCocoSsd(imageElement, minConfidence);
    } else {
      // Video mode: COCO-SSD first, BlazeFace fallback
      try {
        detectionResult = await detectPersonWithCocoSsd(imageElement, minConfidence);

        if (detectionResult.hasHuman && detectionResult.confidence >= minConfidence) {
          return detectionResult;
        }
      } catch (cocoError) {
        console.warn('⚠️ COCO-SSD failed, falling back to BlazeFace:', cocoError);
      }

      // Fallback to BlazeFace
      detectionResult = await detectFacesWithBlazeFace(imageElement, minConfidence, maxFaces);
    }

    return detectionResult;
  } catch (error) {
    console.error('💥 Human detection failed:', error);

    return {
      hasHuman: false,
      confidence: 0,
      detectionCount: 0,
      details: `Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Detect faces using BlazeFace model
 */
async function detectFacesWithBlazeFace(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  minConfidence: number,
  maxFaces: number,
): Promise<HumanDetectionResult> {
  const model = await loadBlazeFaceModel();

  // Run face detection
  const predictions: BlazeFacePrediction[] = await model.estimateFaces(imageElement, false);

  if (predictions.length === 0) {
    return {
      hasHuman: false,
      confidence: 0,
      detectionCount: 0,
      details: 'No faces detected with BlazeFace',
    };
  }

  // Process face detections
  const validFaces = predictions
    .slice(0, maxFaces) // Limit number of faces
    .map((face: BlazeFacePrediction, index: number) => {
      const confidence = face.probability ? face.probability[0] : 0.95; // BlazeFace doesn't always provide probability

      let boundingBox = { x: 0, y: 0, width: 0, height: 0 };

      if (face.topLeft && face.bottomRight) {
        boundingBox = {
          x: face.topLeft[0],
          y: face.topLeft[1],
          width: face.bottomRight[0] - face.topLeft[0],
          height: face.bottomRight[1] - face.topLeft[1],
        };
      }

      return {
        ...boundingBox,
        confidence,
      };
    })
    .filter((face: any) => face.confidence >= minConfidence);

  if (validFaces.length === 0) {
    const firstPrediction = predictions[0];
    const firstConfidence = firstPrediction?.probability?.[0] || 0;
    return {
      hasHuman: false,
      confidence: firstConfidence,
      detectionCount: 0,
      details: `${predictions.length} faces detected but all below confidence threshold`,
    };
  }

  // Get the best confidence
  const bestConfidence = Math.max(...validFaces.map((f: any) => f.confidence));

  // For selfies, check if faces are reasonable size
  const imageArea = imageElement.width * imageElement.height;
  const validSizedFaces = validFaces.filter((face: any) => {
    const faceArea = face.width * face.height;
    const faceRatio = faceArea / imageArea;
    return faceRatio >= 0.01; // More lenient for video frames (1% vs 2% for selfies)
  });

  const hasHuman = validSizedFaces.length > 0;
  const details = hasHuman
    ? `${validSizedFaces.length} valid face(s) detected (${(bestConfidence * 100).toFixed(1)}% confidence)`
    : `Faces detected but too small`;

  return {
    hasHuman,
    confidence: bestConfidence,
    detectionCount: validSizedFaces.length,
    details,
    boundingBoxes: validSizedFaces,
  };
}

/**
 * Detect persons using COCO-SSD model (fallback)
 */
async function detectPersonWithCocoSsd(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  minConfidence: number,
): Promise<HumanDetectionResult> {
  const model = await loadCocoSsdModel();

  // Create canvas if needed (COCO-SSD works better with canvas)
  let canvas: HTMLCanvasElement;
  if (imageElement instanceof HTMLCanvasElement) {
    canvas = imageElement;
  } else {
    canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
  }

  // Run object detection
  const predictions: CocoSsdPrediction[] = await model.detect(canvas);

  // Filter for person detections
  const personDetections = predictions
    .filter((pred: CocoSsdPrediction) => pred.class === 'person')
    .filter((pred: CocoSsdPrediction) => pred.score >= minConfidence);

  if (personDetections.length === 0) {
    const allPersons = predictions.filter((pred: CocoSsdPrediction) => pred.class === 'person');
    return {
      hasHuman: false,
      confidence: allPersons.length > 0 ? allPersons[0].score : 0,
      detectionCount: 0,
      details:
        allPersons.length > 0
          ? `Person detected but confidence too low (${(allPersons[0].score * 100).toFixed(1)}%)`
          : 'No person detected with COCO-SSD',
    };
  }

  // Process person detections
  const validPersons = personDetections.map((pred: CocoSsdPrediction) => {
    const [x, y, width, height] = pred.bbox;
    return {
      x,
      y,
      width,
      height,
      confidence: pred.score,
    };
  });

  // Get the best confidence
  const bestConfidence = Math.max(...validPersons.map((p: any) => p.confidence));

  // For video, be more lenient about coverage (people can be far away)
  const imageArea = canvas.width * canvas.height;
  const reasonablePersons = validPersons.filter((person: any) => {
    const personArea = person.width * person.height;
    const coverage = personArea / imageArea;
    // More lenient for video: 5-90% coverage (vs 10-80% for selfies)
    return coverage >= 0.05 && coverage <= 0.9;
  });

  const hasHuman = reasonablePersons.length > 0;
  const details = hasHuman
    ? `${reasonablePersons.length} person(s) detected (${(bestConfidence * 100).toFixed(1)}% confidence)`
    : validPersons.length > 0
      ? 'Person detected but coverage suspicious'
      : 'No person detected';

  return {
    hasHuman,
    confidence: bestConfidence,
    detectionCount: reasonablePersons.length,
    details,
    boundingBoxes: reasonablePersons,
  };
}

/**
 * Preload models for better performance
 */
export async function preloadModels(): Promise<void> {
  if (modelsLoaded) {
    return;
  }

  console.log('🚀 Preloading TensorFlow models...');

  try {
    await initializeTensorFlow();

    // Load both models in parallel
    await Promise.all([
      loadBlazeFaceModel().catch((e) => console.warn('BlazeFace preload failed:', e)),
      loadCocoSsdModel().catch((e) => console.warn('COCO-SSD preload failed:', e)),
    ]);

    modelsLoaded = true;
    console.log('✅ All models preloaded successfully');
  } catch (error) {
    console.error('❌ Model preloading failed:', error);
  }
}

/**
 * Clean up TensorFlow resources
 */
export function cleanupTensorFlow(): void {
  console.log('🧹 Cleaning up TensorFlow resources...');

  try {
    // Dispose of models
    if (blazeFaceModel && blazeFaceModel.dispose) {
      blazeFaceModel.dispose();
      blazeFaceModel = null;
    }

    if (cocoSsdModel && cocoSsdModel.dispose) {
      cocoSsdModel.dispose();
      cocoSsdModel = null;
    }

    modelsLoaded = false;
    console.log('✅ TensorFlow cleanup completed');
  } catch (error) {
    console.error('❌ TensorFlow cleanup failed:', error);
  }
}
