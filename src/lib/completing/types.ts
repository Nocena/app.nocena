// lib/completing/types.ts

export enum ChallengeType {
  AI = 'AI',
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

// Recording states - maintaining your existing enum values
export enum RecordingState {
  IDLE = 'idle',
  STARTING = 'starting',
  RECORDING = 'recording',
  SELFIE_MODE = 'selfie_mode',
  FILE_UPLOAD = 'file_upload',
  REVIEW = 'review',
  UPLOADING = 'uploading',
  COMPLETE = 'complete',
  ERROR = 'error',
}

// Challenge parameters
export interface ChallengeParams {
  type: string;
  frequency: string;
  title: string;
  description: string;
  reward: string;
  visibility: string;
  challengeId?: string;
  longitude?: string;
  latitude?: string;
  invitedUsers?: string[]; // For private challenges
  creatorId?: string; // User who created the private challenge
}

// Media metadata returned from IPFS upload
export interface MediaMetadata {
  // Support for new format (individual file CIDs)
  videoCID?: string;
  selfieCID?: string;
  // Support for old format (directory structure)
  directoryCID?: string;
  videoFileName?: string;
  selfieFileName?: string;
  // Common properties
  hasVideo: boolean;
  hasSelfie: boolean;
  timestamp: number;
}

// Challenge completion data - updated to match new schema
export interface ChallengeCompletion {
  id: string;
  userId: string;
  challengeId: string;
  date: string;
  media: MediaMetadata | string;
  visibility: 'public' | 'private' | 'friends';
  likesCount?: number;
  // New field for challenge type to match updated schema
  challengeType?: 'ai' | 'private' | 'public';
}
