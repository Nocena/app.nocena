// lib/verification/helpers/videoFrameExtractor.ts

export interface FrameExtractionOptions {
  framesPerSecond?: number; // Default: 4 frames per second
  maxFrames?: number; // Default: 20 frames max
  quality?: number; // JPEG quality 0-1, default: 0.7
  maxDimension?: number; // Resize if larger, default: 640px
}

export interface FrameExtractionResult {
  frames: string[]; // Base64 encoded frames
  totalFrames: number;
  videoDuration: number;
  frameRate: number;
  videoResolution: { width: number; height: number };
}

/**
 * Extract frames from video blob on client-side
 * This must run in browser environment (not server-side)
 * FOLLOWS THE SAME PATTERN AS tensorflowHumanDetection.ts
 */
export async function extractVideoFrames(
  videoBlob: Blob,
  options: FrameExtractionOptions = {},
): Promise<FrameExtractionResult> {
  const { framesPerSecond = 4, maxFrames = 20, quality = 0.7, maxDimension = 640 } = options;

  console.group('🎬 Video Frame Extraction');
  console.log('Options:', { framesPerSecond, maxFrames, quality, maxDimension });
  console.log('Video size:', `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const frames: string[] = [];

    // Create object URL for video
    const videoUrl = URL.createObjectURL(videoBlob);

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Video frame extraction timed out after 30 seconds'));
    }, 30000);

    const cleanup = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(videoUrl);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      console.log(`📹 Video loaded: ${width}x${height}, duration: ${duration}s`);

      // Calculate canvas dimensions (maintain aspect ratio)
      let canvasWidth = width;
      let canvasHeight = height;

      if (Math.max(width, height) > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        canvasWidth = Math.round(width * scale);
        canvasHeight = Math.round(height * scale);
        console.log(`📐 Resizing to: ${canvasWidth}x${canvasHeight} (scale: ${scale.toFixed(2)})`);
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // FOLLOW THE SAME PATTERN AS tensorflowHumanDetection.ts
      // If duration is invalid, try a few fixed time points
      const timePoints =
        duration && isFinite(duration) && duration > 0
          ? generateTimePoints(duration, 1 / framesPerSecond, maxFrames)
          : [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 10.0, 12.0, 15.0]; // Fallback time points like in tensorflow

      console.log(
        `📊 Extracting ${Math.min(timePoints.length, maxFrames)} frames at:`,
        timePoints
          .slice(0, maxFrames)
          .map((t) => `${t.toFixed(1)}s`)
          .join(', '),
      );

      extractFramesAtTimePoints(video, canvas, ctx, timePoints.slice(0, maxFrames), quality)
        .then((extractedFrames) => {
          const result: FrameExtractionResult = {
            frames: extractedFrames,
            totalFrames: extractedFrames.length,
            videoDuration: duration && isFinite(duration) ? duration : Math.max(...timePoints),
            frameRate: extractedFrames.length / (duration && isFinite(duration) ? duration : Math.max(...timePoints)),
            videoResolution: { width, height },
          };

          console.log(`✅ Extraction complete: ${extractedFrames.length} frames`);
          console.groupEnd();
          cleanup();
          resolve(result);
        })
        .catch((error) => {
          cleanup();
          reject(error);
        });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video for frame extraction'));
    };

    // Configure video for metadata loading (same as tensorflow)
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';
    video.muted = true; // Ensure it can play without user interaction

    // Load the video
    video.src = videoUrl;
    video.load();
  });
}

/**
 * Generate time points for frame analysis (SAME AS tensorflowHumanDetection.ts)
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
 * Extract frames at specific time points (SAME LOGIC AS tensorflowHumanDetection.ts)
 */
async function extractFramesAtTimePoints(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  timePoints: number[],
  quality: number,
): Promise<string[]> {
  const frames: string[] = [];

  for (let i = 0; i < timePoints.length; i++) {
    const timePoint = timePoints[i];

    try {
      // Seek to the time point (SAME AS tensorflowHumanDetection.ts)
      await seekToTime(video, timePoint);

      // Wait a bit for the frame to be available (SAME AS tensorflowHumanDetection.ts)
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Extract frame to canvas (SAME AS tensorflowHumanDetection.ts)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Check if frame is too dark (basic brightness check)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const brightness = calculateBrightness(imageData);

      if (brightness < 15 && frames.length === 0) {
        console.warn(
          `⚠️ Frame ${i + 1} appears very dark (brightness: ${brightness.toFixed(1)}), but keeping as first frame`,
        );
      } else if (brightness < 10) {
        console.warn(`⚠️ Frame ${i + 1} appears very dark (brightness: ${brightness.toFixed(1)}), skipping...`);
        continue;
      }

      // Convert to base64 JPEG
      const frameData = canvas.toDataURL('image/jpeg', quality);
      const base64Data = frameData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      frames.push(base64Data);

      console.log(
        `📷 Frame ${i + 1}/${timePoints.length} extracted (${timePoint.toFixed(2)}s, brightness: ${brightness.toFixed(1)})`,
      );
    } catch (frameError) {
      console.warn(`⚠️ Failed to analyze frame at ${timePoint.toFixed(1)}s:`, frameError);
      // Continue with next frame instead of stopping
    }
  }

  return frames;
}

/**
 * Seek video to specific time with timeout (SAME AS tensorflowHumanDetection.ts)
 */
async function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      resolve(); // Continue even if seek doesn't complete
    }, 300); // Short timeout for video seeking (SAME AS tensorflowHumanDetection.ts)

    const onSeeked = () => {
      clearTimeout(timeout);
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };

    video.addEventListener('seeked', onSeeked);

    // If already at the right time (within 0.1s), resolve immediately (SAME AS tensorflowHumanDetection.ts)
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
 * Calculate average brightness of an image
 */
function calculateBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let total = 0;
  let count = 0;

  // Sample every 4th pixel to speed up calculation
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Calculate perceived brightness
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    total += brightness;
    count++;
  }

  return count > 0 ? total / count : 0;
}

/**
 * Estimate token usage for OpenAI API based on frame count and dimensions
 */
export function estimateTokenUsage(result: FrameExtractionResult): number {
  // OpenAI charges ~765 tokens per image at 512x512
  // Scale based on our actual image size
  const { frames, videoResolution } = result;
  const pixelCount = videoResolution.width * videoResolution.height;
  const basePixels = 512 * 512; // Reference size
  const tokensPerImage = Math.round(765 * (pixelCount / basePixels));
  return frames.length * tokensPerImage;
}

/**
 * Create a preview of extracted frames (for debugging)
 */
export function createFramePreview(frames: string[]): string {
  if (frames.length === 0) return 'No frames extracted';

  const sampleFrames = frames.slice(0, 5); // First 5 frames
  return `Extracted ${frames.length} frames. Sample frame sizes: ${sampleFrames.map((f) => `${(f.length / 1024).toFixed(1)}KB`).join(', ')}`;
}

/**
 * Validate video before frame extraction
 */
export function validateVideoForExtraction(videoBlob: Blob): { valid: boolean; error?: string } {
  if (!videoBlob.type.startsWith('video/')) {
    return { valid: false, error: 'File is not a video' };
  }

  if (videoBlob.size < 1024) {
    return { valid: false, error: 'Video file too small' };
  }

  if (videoBlob.size > 100 * 1024 * 1024) {
    return { valid: false, error: 'Video file too large (>100MB)' };
  }

  return { valid: true };
}
