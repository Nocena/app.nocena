// lib/verification/steps/humanSelfieCheck.ts

import { detectHumanInImage, type HumanDetectionResult } from '../helpers/tensorflowHumanDetection';

export interface HumanSelfieCheckResult {
  passed: boolean;
  confidence: number; // 0-100
  details: string;
  faceDetected: boolean;
  faceConfidence: number;
  faceSize: number; // Percentage of image covered by face
  isPlaceholder?: boolean; // Track if this was a placeholder
}

/**
 * STEP 3: Human Detection in Selfie
 * Uses TensorFlow to detect human faces in the selfie photo
 * Handles placeholder images gracefully for background verification optimization
 */
export async function runHumanSelfieCheck(
  photoBlob: Blob,
  onProgress?: (progress: number, message: string) => void,
): Promise<HumanSelfieCheckResult> {
  console.group('📸 HUMAN DETECTION IN SELFIE');
  console.log('Photo size:', `${(photoBlob.size / 1024).toFixed(2)} KB`);

  // Check if this is a placeholder photo
  const isPlaceholder = !photoBlob || photoBlob.size === 0 || photoBlob.type === '' || photoBlob.size < 100;

  if (isPlaceholder) {
    console.log('📷 Placeholder photo detected - deferring face detection');
    onProgress?.(50, 'Placeholder selfie detected...');
    onProgress?.(100, 'Awaiting selfie capture for face verification');

    console.log('📊 Placeholder selfie result: deferred verification');
    console.groupEnd();

    return {
      passed: true, // Allow placeholder to pass
      confidence: 30, // Low confidence until real selfie is provided
      details: 'Selfie capture pending - face detection will be performed when image is available',
      faceDetected: false,
      faceConfidence: 0,
      faceSize: 0,
      isPlaceholder: true,
    };
  }

  try {
    // Progress: Starting
    onProgress?.(5, 'Validating photo format...');

    // Basic photo validation
    if (!photoBlob.type.startsWith('image/')) {
      throw new Error('Invalid file format - not an image file');
    }

    if (photoBlob.size < 1024) {
      throw new Error('Photo file too small - appears to be empty');
    }

    if (photoBlob.size > 10 * 1024 * 1024) {
      throw new Error('Photo file too large (>10MB)');
    }

    // Progress: Loading image
    onProgress?.(15, 'Loading image for analysis...');

    // Create image element for processing
    const imageUrl = URL.createObjectURL(photoBlob);
    const imageElement = new Image();

    // Load image with error handling
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Image loading timeout - file may be corrupted'));
      }, 5000);

      imageElement.onload = () => {
        clearTimeout(timeout);
        console.log(`🖼️ Image loaded: ${imageElement.width}x${imageElement.height}`);
        resolve();
      };

      imageElement.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image - file may be corrupted'));
      };

      imageElement.src = imageUrl;
    });

    // Validate image dimensions
    if (imageElement.width <= 0 || imageElement.height <= 0) {
      throw new Error('Invalid image dimensions');
    }

    if (imageElement.width < 100 || imageElement.height < 100) {
      throw new Error('Image resolution too low (minimum 100x100)');
    }

    console.log('✅ Image validation passed');

    // Progress: Loading TensorFlow models
    onProgress?.(30, 'Loading TensorFlow face detection models...');

    // Use TensorFlow to detect human faces
    const detectionResult: HumanDetectionResult = await detectHumanInImage(imageElement, {
      preferFaceDetection: true, // Use BlazeFace first for better face detection
      minConfidence: 0.6, // Minimum 60% confidence for faces
      maxFaces: 3, // Allow up to 3 faces (group selfies)
    });

    // Progress: Analyzing results
    onProgress?.(85, 'Analyzing face detection results...');

    // Clean up image URL
    URL.revokeObjectURL(imageUrl);

    // Calculate face size if we have bounding boxes
    let faceSize = 0;
    if (detectionResult.boundingBoxes && detectionResult.boundingBoxes.length > 0) {
      const imageArea = imageElement.width * imageElement.height;
      const largestFace = detectionResult.boundingBoxes.reduce((largest, face) => {
        const faceArea = face.width * face.height;
        const largestArea = largest.width * largest.height;
        return faceArea > largestArea ? face : largest;
      });

      const faceArea = largestFace.width * largestFace.height;
      faceSize = (faceArea / imageArea) * 100; // Convert to percentage

      console.log(`📏 Largest face size: ${faceSize.toFixed(1)}% of image`);
    }

    // Determine if selfie passes our requirements
    const minConfidenceThreshold = 0.6; // 60%
    const minFaceSizeThreshold = 2; // Face should be at least 2% of image

    const passed =
      detectionResult.hasHuman &&
      detectionResult.confidence >= minConfidenceThreshold &&
      (faceSize === 0 || faceSize >= minFaceSizeThreshold); // Allow faceSize=0 if no bounding box

    // Convert confidence to 0-100 scale
    const confidence = passed ? Math.round(detectionResult.confidence * 100) : 0;

    // Enhanced details based on results
    let details = detectionResult.details;
    if (passed) {
      details = `Human face detected (${Math.round(detectionResult.confidence * 100)}% confidence)`;
      if (faceSize > 0) {
        details += `, face covers ${faceSize.toFixed(1)}% of image`;
      }
      if (detectionResult.detectionCount > 1) {
        details += `, ${detectionResult.detectionCount} faces total`;
      }
    } else if (detectionResult.hasHuman && detectionResult.confidence < minConfidenceThreshold) {
      details = `Face detected but confidence too low (${Math.round(detectionResult.confidence * 100)}% < 60%)`;
    } else if (detectionResult.hasHuman && faceSize > 0 && faceSize < minFaceSizeThreshold) {
      details = `Face detected but too small for selfie verification (${faceSize.toFixed(1)}% < 2%)`;
    }

    // Progress: Complete
    onProgress?.(100, details);

    console.log('📊 Selfie detection result:', {
      hasHuman: detectionResult.hasHuman,
      confidence: `${confidence}%`,
      detectionCount: detectionResult.detectionCount,
      faceSize: faceSize > 0 ? `${faceSize.toFixed(1)}%` : 'unknown',
      passed,
    });

    console.log('✅ Human selfie check completed');
    console.groupEnd();

    return {
      passed,
      confidence,
      details,
      faceDetected: detectionResult.hasHuman,
      faceConfidence: detectionResult.confidence,
      faceSize: faceSize / 100, // Convert back to 0-1 scale for consistency
      isPlaceholder: false,
    };
  } catch (error) {
    console.error('💥 Human selfie check error:', error);
    console.groupEnd();

    onProgress?.(100, 'Face detection failed due to error');

    return {
      passed: false,
      confidence: 0,
      details: `Face detection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      faceDetected: false,
      faceConfidence: 0,
      faceSize: 0,
      isPlaceholder: false,
    };
  }
}
