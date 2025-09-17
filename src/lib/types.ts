// src/lib/types.ts

import { AuthenticatedSession, SessionClient } from '@lens-protocol/client';
import type { ClothingTemplate } from './utils/clothingRewardUtils';

/**
 * Clothing NFT Reward Types - integrates with existing Challenge system
 */
export interface ClothingNFTReward {
  id: string;
  collectionId: string;
  templateType: ClothingTemplate;
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic';
  status: 'generating' | 'completed' | 'failed';
  generatedAt: Date;
  userID: string;
  completionId: string;
}

/**
 * NFT Generation Status Types
 */
export type NFTGenerationStatus = 'idle' | 'generating' | 'completed' | 'failed';

/**
 * Extends your existing Challenge types to include NFT rewards
 * Uses your existing PublicChallenge and PrivateChallenge types
 */
export interface PublicChallengeWithNFTReward extends PublicChallenge {
  nftReward?: ClothingNFTReward;
}

export interface PrivateChallengeWithNFTReward extends PrivateChallenge {
  nftReward?: ClothingNFTReward;
}

export type ChallengeWithNFTReward = PublicChallengeWithNFTReward | PrivateChallengeWithNFTReward;

/**
 * NFT Reward Generation Result
 */
export interface NFTRewardGenerationResult {
  success: boolean;
  collectionId?: string;
  templateType?: ClothingTemplate;
  templateName?: string;
  message: string;
  error?: string;
}

/**
 * NFT Progress Tracking
 */
export interface NFTProgressData {
  collectionId: string;
  status: NFTGenerationStatus;
  progress: number; // 0-100
  templateType?: ClothingTemplate;
  templateName?: string;
  imageUrl?: string;
  error?: string;
  estimatedTimeRemaining?: number;
}

/**
 * Claiming Screen NFT State - works with existing Challenge flow
 */
export interface ClaimingScreenNFTState {
  generationStatus: NFTGenerationStatus;
  collectionId: string | null;
  templateType: ClothingTemplate | null;
  templateName: string | null;
  imageUrl: string | null;
  progress: number;
  error: string | null;
}

/**
 * User's NFT Collection (for profile display) - integrates with existing user system
 */
export interface UserNFTCollection {
  userId: string;
  clothingNFTs: ClothingNFTReward[];
  totalCount: number;
  lastUpdated: Date;
}

/**
 * NFT Rarity Configuration
 */
export interface NFTRarityConfig {
  rarity: 'common' | 'rare' | 'epic';
  probability: number; // 0-1
  bonusMultiplier: number;
  glowColor: string;
  borderColor: string;
}

/**
 * Extended Challenge Completion Data with NFT - builds on existing ChallengeData
 */
export interface ExtendedCompletionData {
  // Existing completion data
  completionId: string;
  tokensEarned: number;

  // NFT reward data
  nftReward?: {
    collectionId: string;
    templateType: ClothingTemplate;
    templateName: string;
    status: NFTGenerationStatus;
    imageUrl?: string;
  };
}

/**
 * Claiming Process State - works with existing challenge completion workflow
 */
export interface ClaimingProcessState {
  stage: 'ready' | 'claiming' | 'success' | 'failed';

  // Token claiming (uses existing reward system)
  tokensClaimed: boolean;
  tokensAmount: number;

  // NFT generation (new addition)
  nftGeneration: ClaimingScreenNFTState;

  // Overall status
  error?: string;
  completedAt?: Date;
}

export interface ChallengeData {
  id?: string;
  position: [number, number];
  color: string;
  title: string;
  description: string;
  reward: number;
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

// ---- created by matija --------
export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
}
export type LensAuthContextType = {
  activeSession: AuthenticatedSession | null;
  client: SessionClient | null;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  authenticate: (lensAccountAddress: string, walletAddr: string) => Promise<void>;
  disconnect: () => Promise<void>;
  restore: () => Promise<void>;
  refreshCurrentAccount: () => Promise<void>;
  onboard: (walletAddr: string) => Promise<SessionClient | null>;
  currentAccount: AccountType | null;
};

export interface AccountType {
  accountAddress: string;
  createdAt: string;
  avatar: string;
  displayName: string;
  localName: string;
  bio: string;
  isFollowedByMe?: boolean;
}

export interface CommentType {
  id: string;
  timestamp: string;
  content: string;
  author: AccountType;
}

export interface AccountStatusType {
  followers: number;
  following: number;
  posts: number;
  comments: number;
  reposts: number;
  quotes: number;
  reacted: number;
  reactions: number;
  collects: number;
}

export interface ProfileDataType {
  followers: number;
  following: number;
  accountAddress: string;
  createdAt: string;
  avatar: string;
  displayName: string;
  localName: string;
  bio: string;
  isMe: boolean;
  isFollowedByMe: boolean;
}
// ---- end by matija --------

// ---- added by matija for kaia hackathon ----

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  isCreator: boolean;
  nocenixBalance: number;
  usdtBalance: number;
  followers: number;
  following: number;
}

export interface MembershipTier {
  id: string;
  name: string;
  description: string;
  price: number; // in nocenix tokens
  color: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  benefits: string[];
  subscriberCount: number;
}

export interface Post {
  id: string;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    profilePicture: string;
  };
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  tierRequired?: MembershipTier;
  isPublic: boolean;
  likes: number;
  comments: number;
  createdAt: string;
  tags: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  creatorId: string;
  tierId: string;
  tier: MembershipTier;
  isActive: boolean;
  startDate: string;
  nextBillingDate: string;
}

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner?: string;
  bio: string;
  category: string;
  followers: number;
  posts: number;
  isFollowing?: boolean;
  membershipTiers: MembershipTier[];
}

export interface ChallengeCardType {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  creatorId: string;
  creatorAvatar: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward: number; // NCX tokens
  participants: number;
  completions: number;
  createdAt: string;
  tags: string[];
}

export interface SimplifiedUser {
  id: string;
  username: string;
  avatar: string;
  bio: string;
}

export interface completionItem {
  id: string;
  challenge: {
    description: string;
    title: string;
    id: string;
    reward: number;
  },
  user: {
    id: string;
    profilePicture: string;
    username: string;
  },
  completionDate: string;
  isLiked: boolean;
  likesCount: number;
  videoUrl: string;
  selfieUrl: string;
}
// ---- end by matija for kaia hackathon ----

export interface MediaMetadata {
  // New format (individual CIDs) - this is what you're using now
  videoCID?: string;
  selfieCID?: string;
  // Old format (directory structure) - for backwards compatibility
  directoryCID?: string;
  videoFileName?: string;
  selfieFileName?: string;
  // Common properties
  hasVideo?: boolean;
  hasSelfie?: boolean;
  timestamp?: number;
  description?: string;
  verificationResult?: any;
}

export interface ChallengeCompletion {
  id: string;
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  completionDate: string;
  media: string; // JSON string containing videoCID and selfieCID
  challengeType: string;
  description?: string; // User's completion description (removed from query)
  publicChallenge?: {
    id: string;
    title: string;
    description: string;
    reward: number;
  };
  privateChallenge?: {
    id: string;
    title: string;
    description: string;
    reward: number;
  };
  aiChallenge?: {
    id: string;
    title: string;
    description: string;
    reward: number;
  };
  videoUrl?: string;
  selfieUrl?: string;
  // Local state for likes (will be replaced with DB data later)
  localLikes?: number;
  localIsLiked?: boolean;
  // Database fields for likes
  totalLikes?: number;
  isLiked?: boolean;
  recentLikes?: Array<{
    id: string;
    username: string;
    profilePicture: string;
  }>;
  // Database fields for reactions
  totalReactions?: number;
  recentReactions?: Array<{
    id: string;
    reactionType: string;
    emoji: string;
    selfieUrl?: string;
    user: {
      id: string;
      username: string;
      profilePicture: string;
    };
    createdAt: string;
  }>;
}
