// lib/verification/steps/basicFileCheck.ts

export interface BasicFileCheckResult {
  passed: boolean;
  confidence: number; // 0-100
  details: string;
  videoValid: boolean;
  photoValid: boolean;
  isPlaceholderPhoto?: boolean; // New field to track placeholder state
}

/**
 * STEP 1: Basic File Check
 * Validates that the video is a real video file and the selfie is a real image file
 * Handles placeholder selfies gracefully for background verification optimization
 */
export async function runBasicFileCheck(
  videoBlob: Blob,
  photoBlob: Blob,
  onProgress?: (progress: number, message: string) => void,
): Promise<BasicFileCheckResult> {
  console.group('🔍 BASIC FILE CHECK');
  console.log('Video:', {
    size: `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`,
    type: videoBlob.type,
  });
  console.log('Photo:', {
    size: `${(photoBlob.size / 1024).toFixed(2)} KB`,
    type: photoBlob.type,
  });

  // Check if photoBlob is a placeholder (empty or very small)
  const isPlaceholderPhoto = !photoBlob || photoBlob.size === 0 || photoBlob.type === '' || photoBlob.size < 100;

  if (isPlaceholderPhoto) {
    console.log('📷 Placeholder photo detected - deferring selfie validation');
    onProgress?.(25, 'Placeholder selfie detected, validating video only...');
  }

  let videoValid = false;
  let photoValid = false;
  let details = '';

  try {
    // Progress: Starting video check
    onProgress?.(10, 'Checking video file format...');

    // Video validation (always required)
    if (!videoBlob.type.startsWith('video/')) {
      details = 'Invalid video format - not a video file';
      console.error('❌', details);
    } else if (videoBlob.size < 1024) {
      details = 'Video file too small (less than 1KB)';
      console.error('❌', details);
    } else if (videoBlob.size > 100 * 1024 * 1024) {
      details = `Video file too large (${(videoBlob.size / 1024 / 1024).toFixed(1)}MB > 100MB)`;
      console.error('❌', details);
    } else {
      videoValid = true;
      console.log('✅ Video file validation passed');
    }

    if (!videoValid) {
      // If video is invalid, fail regardless of photo status
      onProgress?.(100, details);
      console.error('❌ Basic file check failed:', details);
      console.groupEnd();

      return {
        passed: false,
        confidence: 0,
        details,
        videoValid: false,
        photoValid: false,
        isPlaceholderPhoto,
      };
    }

    // Progress: Video check complete
    onProgress?.(isPlaceholderPhoto ? 70 : 50, 'Video validated, checking photo...');

    // Photo validation - handle placeholder gracefully
    if (isPlaceholderPhoto) {
      // Placeholder photo - pass with lower confidence
      photoValid = true; // Allow placeholder to pass
      details = 'Video validated, selfie pending capture';
      console.log('📷 Placeholder photo accepted - selfie validation deferred');
    } else {
      // Real photo validation
      if (!photoBlob.type.startsWith('image/')) {
        details = 'Invalid image format - not an image file';
        console.error('❌ Invalid image format');
      } else if (photoBlob.size < 1024) {
        details = 'Photo file too small (less than 1KB)';
        console.error('❌ Photo file too small');
      } else if (photoBlob.size > 10 * 1024 * 1024) {
        details = `Photo file too large (${(photoBlob.size / 1024 / 1024).toFixed(1)}MB > 10MB)`;
        console.error('❌ Photo file too large');
      } else {
        photoValid = true;
        console.log('✅ Photo file validation passed');
      }
    }

    // Progress: Finalizing check
    onProgress?.(90, 'Finalizing file validation...');

    // Determine overall result
    const passed = videoValid && photoValid;
    let confidence = 0;

    if (passed) {
      if (isPlaceholderPhoto) {
        confidence = 60; // Lower confidence for placeholder - can be completed later
        details = 'Video validated successfully, awaiting selfie capture';
        console.log('✅ Basic file check completed with placeholder photo (partial)');
      } else {
        confidence = 100; // Perfect score for all valid files
        details = 'All files validated successfully';
        console.log('✅ Basic file check completed successfully');
      }
    } else {
      confidence = 0; // No confidence if files are invalid
      console.error('❌ Basic file check failed:', details);
    }

    // Progress: Complete
    onProgress?.(100, passed ? details : 'File validation failed');

    console.groupEnd();

    return {
      passed,
      confidence,
      details,
      videoValid,
      photoValid,
      isPlaceholderPhoto,
    };
  } catch (error) {
    console.error('💥 Basic file check error:', error);
    console.groupEnd();

    onProgress?.(100, 'File validation failed due to error');

    return {
      passed: false,
      confidence: 0,
      details: `File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      videoValid: false,
      photoValid: false,
      isPlaceholderPhoto,
    };
  }
}
