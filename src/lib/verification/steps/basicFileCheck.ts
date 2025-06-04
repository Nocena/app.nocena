// lib/verification/steps/basicFileCheck.ts

export interface BasicFileCheckResult {
  passed: boolean;
  confidence: number; // 0-100
  details: string;
  videoValid: boolean;
  photoValid: boolean;
}

/**
 * STEP 1: Basic File Check
 * Validates that the video is a real video file and the selfie is a real image file
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

  let videoValid = false;
  let photoValid = false;
  let details = '';

  try {
    // Progress: Starting video check
    onProgress?.(10, 'Checking video file format...');

    // Video validation
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

    // Progress: Video check complete, starting photo check
    onProgress?.(50, 'Checking photo file format...');

    // Photo validation
    if (!photoBlob.type.startsWith('image/')) {
      details = videoValid ? 'Invalid image format - not an image file' : details + ' | Invalid image format';
      console.error('❌ Invalid image format');
    } else if (photoBlob.size < 1024) {
      details = videoValid ? 'Photo file too small (less than 1KB)' : details + ' | Photo too small';
      console.error('❌ Photo file too small');
    } else if (photoBlob.size > 10 * 1024 * 1024) {
      details = videoValid
        ? `Photo file too large (${(photoBlob.size / 1024 / 1024).toFixed(1)}MB > 10MB)`
        : details + ' | Photo too large';
      console.error('❌ Photo file too large');
    } else {
      photoValid = true;
      console.log('✅ Photo file validation passed');
    }

    // Progress: Finalizing check
    onProgress?.(90, 'Finalizing file validation...');

    // Determine overall result
    const passed = videoValid && photoValid;
    let confidence = 0;

    if (passed) {
      confidence = 100; // Perfect score for valid files
      details = 'All files validated successfully';
      console.log('✅ Basic file check completed successfully');
    } else {
      confidence = 0; // No confidence if files are invalid
      console.error('❌ Basic file check failed:', details);
    }

    // Progress: Complete
    onProgress?.(100, passed ? 'Files validated successfully' : details);

    console.groupEnd();

    return {
      passed,
      confidence,
      details,
      videoValid,
      photoValid,
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
    };
  }
}
