// src/lib/map/types.ts

export interface ChallengeData {
  id?: string;
  position: [number, number];
  color: string;
  title: string;
  description: string;
  reward: number;
  // Existing additional data for UI
  creatorName?: string;
  creatorAvatar?: string;
  participantCount?: number;
  maxParticipants?: number;
  // Completion data fields
  completionCount?: number;
  recentCompletions?: {
    userId: string;
    username: string;
    profilePicture: string;
    completedAt: string;
  }[];
  // NEW: Fields for generated challenges
  category?: string;
  distance?: number;
  poiName?: string;
}

export interface LocationData {
  longitude: number;
  latitude: number;
}

export interface MapLibreMapType {
  flyTo: (options: {
    center: [number, number];
    zoom: number;
    essential: boolean;
    animate?: boolean;
    duration?: number;
  }) => void;
  setCenter: (position: [number, number]) => void;
  setZoom: (zoom: number) => void;
  addControl: (control: any, position?: string) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  remove: () => void;
}

// New types for challenge creation

export interface PublicChallenge {
  id?: string;
  title: string;
  description: string;
  isPublic: true;
  creatorId: string;
  durationDays: number;
  reward: number;
  maxParticipants: number;
  location: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface PrivateChallenge {
  id?: string;
  title: string;
  description: string;
  isPublic: false;
  creatorId: string;
  targetUserId: string;
  durationDays: number;
  reward: number;
  createdAt: string;
  expiresAt?: string;
}

export type Challenge = PublicChallenge | PrivateChallenge;

// Challenge submission form data
export interface ChallengeFormData {
  challengeName: string;
  description: string;
  reward: number;
  participants?: number;
  totalCost: number;
  // Add these properties for private and public challenges
  targetUserId?: string;
  latitude?: number;
  longitude?: number;
  expiresAt?: string;
}

// API Request type for challenge creation
export interface CreateChallengeRequest {
  title: string;
  description: string;
  isPublic: boolean;
  creatorId: string;
  durationDays: number;
  reward: number;
  maxParticipants?: number;
  targetUserId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

// API Response type for challenge creation
export interface CreateChallengeResponse {
  success: boolean;
  challengeId: string;
  uids?: Record<string, string>;
  error?: string;
}
