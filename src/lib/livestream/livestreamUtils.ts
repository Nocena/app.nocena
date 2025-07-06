// src/lib/livestream/livestreamUtils.ts

export interface LivestreamConfig {
  chunkDurationMs: number;
  maxBufferSize: number;
  bitrate: number;
  audioBitrate: number;
  videoConstraints: MediaTrackConstraints;
  audioConstraints: MediaTrackConstraints;
}

export interface StreamChunk {
  index: number;
  timestamp: number;
  duration: number;
  size: number;
  hash: string;
  blob: Blob;
  commp?: string;
  url?: string;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

export interface StreamSession {
  sessionId: string;
  streamId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  totalChunks: number;
  uploadedSegments: number;
  isLive: boolean;
  config: LivestreamConfig;
  manifest: StreamManifest;
}

export interface StreamManifest {
  sessionId: string;
  streamId: string;
  startTime: number;
  endTime?: number;
  chunks: StreamChunk[];
  totalDuration: number;
  totalSize: number;
  isComplete: boolean;
  fileCdnUrls: string[];
}

export const DEFAULT_LIVESTREAM_CONFIG: LivestreamConfig = {
  chunkDurationMs: 100, // 0.1 seconds for near real-time streaming
  maxBufferSize: 50, // Buffer 5 seconds worth of chunks
  bitrate: 2500000, // 2.5 Mbps
  audioBitrate: 128000, // 128 kbps
  videoConstraints: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'environment',
  },
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export class LivestreamManager {
  private static instance: LivestreamManager;
  private activeSessions: Map<string, StreamSession> = new Map();
  private chunkQueues: Map<string, StreamChunk[]> = new Map();
  private uploadPromises: Map<string, Promise<void>> = new Map();

  private constructor() {}

  static getInstance(): LivestreamManager {
    if (!LivestreamManager.instance) {
      LivestreamManager.instance = new LivestreamManager();
    }
    return LivestreamManager.instance;
  }

  /**
   * Initialize a new livestream session
   */
  async initializeSession(userId: string, config: Partial<LivestreamConfig> = {}): Promise<StreamSession> {
    const sessionId = `live_${Date.now()}_${userId}`;
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const finalConfig = { ...DEFAULT_LIVESTREAM_CONFIG, ...config };

    const session: StreamSession = {
      sessionId,
      streamId,
      userId,
      startTime: Date.now(),
      totalChunks: 0,
      uploadedSegments: 0,
      isLive: true,
      config: finalConfig,
      manifest: {
        sessionId,
        streamId,
        startTime: Date.now(),
        chunks: [],
        totalDuration: 0,
        totalSize: 0,
        isComplete: false,
        fileCdnUrls: [],
      },
    };

    this.activeSessions.set(sessionId, session);
    this.chunkQueues.set(sessionId, []);

    // Initialize session with API
    await this.apiCall('start', {
      sessionId,
      userId,
    });

    console.log(`🎬 Livestream session initialized: ${sessionId}`);
    return session;
  }

  /**
   * Add a chunk to the session
   */
  async addChunk(sessionId: string, chunkBlob: Blob): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isLive) {
      throw new Error('Session not found or not live');
    }

    const timestamp = Date.now();
    const chunkIndex = session.totalChunks;

    // Create chunk hash
    const arrayBuffer = await chunkBlob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const chunk: StreamChunk = {
      index: chunkIndex,
      timestamp,
      duration: session.config.chunkDurationMs,
      size: chunkBlob.size,
      hash,
      blob: chunkBlob,
      uploadStatus: 'pending',
    };

    // Add to session
    session.totalChunks++;
    session.manifest.chunks.push(chunk);
    session.manifest.totalSize += chunkBlob.size;

    // Add to queue
    const queue = this.chunkQueues.get(sessionId) || [];
    queue.push(chunk);
    this.chunkQueues.set(sessionId, queue);

    console.log(`📦 Added chunk ${chunkIndex} to session ${sessionId} (${chunkBlob.size} bytes)`);

    // Upload chunk immediately for real-time streaming
    await this.uploadChunk(sessionId, chunk);

    // Process buffer if full
    if (queue.length >= session.config.maxBufferSize) {
      await this.processChunkBuffer(sessionId);
    }
  }

  /**
   * Upload a single chunk to FilCDN
   */
  private async uploadChunk(sessionId: string, chunk: StreamChunk): Promise<void> {
    const uploadKey = `${sessionId}_${chunk.index}`;

    // Prevent duplicate uploads
    if (this.uploadPromises.has(uploadKey)) {
      return this.uploadPromises.get(uploadKey);
    }

    const uploadPromise = this._uploadChunkToApi(sessionId, chunk);
    this.uploadPromises.set(uploadKey, uploadPromise);

    try {
      await uploadPromise;
    } finally {
      this.uploadPromises.delete(uploadKey);
    }
  }

  /**
   * Internal method to upload chunk to API
   */
  private async _uploadChunkToApi(sessionId: string, chunk: StreamChunk): Promise<void> {
    try {
      chunk.uploadStatus = 'uploading';

      const formData = new FormData();
      formData.append('action', 'chunk');
      formData.append('sessionId', sessionId);
      formData.append('chunk', chunk.blob, `chunk_${chunk.index}.webm`);
      formData.append('timestamp', chunk.timestamp.toString());
      formData.append('chunkIndex', chunk.index.toString());

      const response = await fetch('/api/filcdn/livestream', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        chunk.uploadStatus = 'uploaded';
        console.log(`✅ Chunk ${chunk.index} uploaded successfully`);
      } else {
        chunk.uploadStatus = 'failed';
        console.error(`❌ Chunk ${chunk.index} upload failed:`, result.error);
      }
    } catch (error) {
      chunk.uploadStatus = 'failed';
      console.error(`❌ Chunk ${chunk.index} upload error:`, error);
    }
  }

  /**
   * Process buffered chunks (upload as segment to FilCDN)
   */
  private async processChunkBuffer(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    const queue = this.chunkQueues.get(sessionId);

    if (!session || !queue || queue.length === 0) return;

    try {
      // Combine chunks into a segment
      const segmentBlobs = queue.map((chunk) => chunk.blob);
      const combinedBlob = new Blob(segmentBlobs, { type: 'video/webm' });

      console.log(`📤 Processing buffer: ${queue.length} chunks (${combinedBlob.size} bytes)`);

      // Upload combined segment (this could be implemented as a separate endpoint)
      // For now, we rely on individual chunk uploads

      // Update session stats
      session.uploadedSegments++;

      // Clear processed chunks from queue
      this.chunkQueues.set(sessionId, []);

      console.log(`✅ Buffer processed for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Buffer processing failed for session ${sessionId}:`, error);
    }
  }

  /**
   * End a livestream session
   */
  async endSession(sessionId: string): Promise<StreamManifest | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    console.log(`🛑 Ending livestream session: ${sessionId}`);

    // Mark as not live
    session.isLive = false;
    session.endTime = Date.now();

    // Process any remaining chunks
    await this.processChunkBuffer(sessionId);

    // Wait for all uploads to complete
    const pendingUploads = Array.from(this.uploadPromises.values());
    if (pendingUploads.length > 0) {
      console.log(`⏳ Waiting for ${pendingUploads.length} pending uploads...`);
      await Promise.allSettled(pendingUploads);
    }

    // Finalize manifest
    session.manifest.endTime = session.endTime;
    session.manifest.totalDuration = session.endTime - session.startTime;
    session.manifest.isComplete = true;

    // End session with API
    try {
      const result = await this.apiCall('end', { sessionId });
      if (result.success && result.manifest) {
        // Merge API manifest data
        session.manifest = { ...session.manifest, ...result.manifest };
      }
    } catch (error) {
      console.error('❌ Failed to end session via API:', error);
    }

    // Cleanup
    this.activeSessions.delete(sessionId);
    this.chunkQueues.delete(sessionId);

    console.log(`🏁 Session ${sessionId} ended successfully`);
    return session.manifest;
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const queue = this.chunkQueues.get(sessionId) || [];
    const uploadedChunks = session.manifest.chunks.filter((c) => c.uploadStatus === 'uploaded').length;
    const failedChunks = session.manifest.chunks.filter((c) => c.uploadStatus === 'failed').length;

    return {
      sessionId: session.sessionId,
      streamId: session.streamId,
      isLive: session.isLive,
      startTime: session.startTime,
      totalChunks: session.totalChunks,
      uploadedChunks,
      failedChunks,
      queuedChunks: queue.length,
      uploadedSegments: session.uploadedSegments,
      totalSize: session.manifest.totalSize,
      duration: (session.endTime || Date.now()) - session.startTime,
      averageChunkSize: session.totalChunks > 0 ? session.manifest.totalSize / session.totalChunks : 0,
      uploadProgress: session.totalChunks > 0 ? (uploadedChunks / session.totalChunks) * 100 : 0,
    };
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * API call helper
   */
  private async apiCall(action: string, data: Record<string, any>): Promise<any> {
    const formData = new FormData();
    formData.append('action', action);

    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value.toString());
    }

    const response = await fetch('/api/filcdn/livestream', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }
}

/**
 * Utility functions for livestreaming
 */
export const livestreamUtils = {
  /**
   * Calculate optimal chunk size based on bitrate and duration
   */
  calculateOptimalChunkSize(bitrate: number, durationMs: number): number {
    // Convert bitrate to bytes per second, then calculate for duration
    const bytesPerSecond = bitrate / 8;
    const bytesPerMs = bytesPerSecond / 1000;
    return Math.ceil(bytesPerMs * durationMs);
  },

  /**
   * Format stream duration
   */
  formatDuration(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  },

  /**
   * Format bytes with units
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * Calculate bitrate from chunk data
   */
  calculateBitrate(chunks: StreamChunk[]): number {
    if (chunks.length === 0) return 0;

    const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalDurationMs = chunks.length * chunks[0].duration;
    const totalDurationSeconds = totalDurationMs / 1000;

    return totalDurationSeconds > 0 ? (totalBytes * 8) / totalDurationSeconds : 0;
  },

  /**
   * Validate MediaRecorder support
   */
  validateMediaRecorderSupport(): { supported: boolean; supportedTypes: string[] } {
    if (!MediaRecorder.isTypeSupported) {
      return { supported: false, supportedTypes: [] };
    }

    const types = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=h264,opus',
      'video/mp4;codecs=h264,aac',
    ];

    const supportedTypes = types.filter((type) => MediaRecorder.isTypeSupported(type));

    return {
      supported: supportedTypes.length > 0,
      supportedTypes,
    };
  },

  /**
   * Get optimal MediaRecorder options
   */
  getOptimalRecorderOptions(config: LivestreamConfig): MediaRecorderOptions {
    const support = this.validateMediaRecorderSupport();

    if (!support.supported) {
      throw new Error('MediaRecorder not supported');
    }

    // Prefer WebM with VP8 for better compression and FilCDN compatibility
    let mimeType = 'video/webm;codecs=vp8,opus';
    if (!support.supportedTypes.includes(mimeType)) {
      mimeType = support.supportedTypes[0];
    }

    return {
      mimeType,
      videoBitsPerSecond: config.bitrate,
      audioBitsPerSecond: config.audioBitrate,
    };
  },
};
