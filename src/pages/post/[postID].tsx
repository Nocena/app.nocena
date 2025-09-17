import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import { fetchMembershipTiersByCreator, fetchPostById, getSubscriptionsByUserId } from '../../lib/api/dgraph';
import { useAuth } from '../../contexts/AuthContext';
import { MembershipTier, Post } from '../../lib/types';
import { Lock, ArrowLeft, Calendar, Eye, Share, MessageCircle, Heart } from 'lucide-react';
import userID from '@pages/profile/[userID]';
import { SubscriptionModal } from '@components/modals/SubscriptionModal';

// Local User interface for profile page
interface ProfileUser {
  id: string;
  username: string;
  profilePicture: string;
  coverPhoto?: string;
  trailerVideo?: string;
  bio: string;
  earnedTokens: number;
  dailyChallenge: string;
  weeklyChallenge: string;
  monthlyChallenge: string;
  followers: string[]; // Array of user IDs
}

// Interface for follower data that could be string or object
type FollowerData = string | { id: string; [key: string]: any };

const PostDetailView: React.FC = () => {
  const router = useRouter();
  const { postID } = router.query;
  const { user: currentUser } = useAuth();
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [post, setPost] = useState<Post>({
    id: '',
    creatorId: '',
    creator: {
      id: '',
      username: '',
      avatar: '',
    },
    title: '',
    content: '',
    mediaUrl: '',
    mediaType: 'image',
    isPublic: true,
    likes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
    tags: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [subscribedTiers, setSubscribedTiers] = useState<string[]>([]);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTier[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleConfirmSubscription = (tierId: string) => {
    // onSubscribe?.(tierId);
    setIsSubscriptionModalOpen(false);
  };

  const updateUserMembershipTiers = useCallback(async (userId: string) => {
    const tiers = await fetchMembershipTiersByCreator(userId);
    setMembershipTiers(tiers);
  }, []);

  const updateSubscriptionTiers = useCallback(async (userId: string) => {
    const tiers = await getSubscriptionsByUserId(userId);
    setSubscribedTiers(tiers.map((tier: any) => tier.tierId));
  }, []);

  // Check if this page is visible in the PageManager
  useEffect(() => {
    if (!postID) return;

    (async () => {
      const post = await fetchPostById(postID as string);
      if (post) {
        setPost(post);
        await updateUserMembershipTiers(post.creator.id);
        await updateSubscriptionTiers(currentUser?.id || '');
      }
    })();
  }, [postID, currentUser]);

  const hasAccess = useMemo(() => {
    if (!post) return false;
    if (post.isPublic) return true;
    if (post.creator.id === currentUser?.id) return true;
    if (!post.tierRequired) return true;
    return subscribedTiers.includes(post.tierRequired.id);
  }, [post, subscribedTiers, currentUser]);

  console.log('post', post);
  console.log('subscribedTiers', subscribedTiers);

  const onSubscribe = () => {};

  const handleSubscribeClick = () => {
    setIsSubscriptionModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 text-white overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
        }}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto main-page-wrapper">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Post Content */}
      <div className={`bg-gray-900 border rounded-xl overflow-hidden`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <img
                src={post.creator.avatar}
                alt={post.creator.username}
                className="w-12 h-12 rounded-full border-2 border-nocenaPurple"
              />
              <div>
                <h3 className="text-white font-semibold text-lg">{post.creator.username}</h3>
                <p className="text-gray-400">@{post.creator.username}</p>
              </div>
            </div>
            {post.tierRequired && (
              <div className={`px-4 py-2 rounded-full text-sm font-semibold text-white`}>{post.tierRequired.name}</div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>

          <div className="flex items-center space-x-6 text-gray-400 text-sm">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>1.2k views</span>
            </div>
          </div>
        </div>

        {/* Media */}
        {post.mediaUrl && (
          <div className="relative">
            {post.mediaType === 'video' ? (
              <video
                src={post.mediaUrl}
                className={`w-full max-h-96 object-cover ${!hasAccess ? 'filter blur-sm' : ''}`}
                controls={!post.tierRequired}
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt={post.title}
                className={`w-full max-h-96 object-cover ${!hasAccess ? 'filter blur-sm' : ''}`}
              />
            )}
            {!hasAccess && post.tierRequired && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">Premium Content</h3>
                  <p className="text-gray-300 mb-6 max-w-md">
                    This content is exclusive to {post.tierRequired.name} subscribers and above.
                  </p>
                  <button
                    onClick={handleSubscribeClick}
                    className="bg-nocena-purple hover:bg-nocena-purple-fade text-white px-8 py-3 rounded-lg transition-all duration-200 font-semibold"
                  >
                    Subscribe for {post.tierRequired.price} NCX/month
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="prose prose-invert max-w-none">
            <p
              className={`text-gray-300 text-lg leading-relaxed whitespace-pre-wrap ${!hasAccess ? 'filter blur-sm' : ''}`}
            >
              {post.content}
            </p>
          </div>
          {!hasAccess && post.tierRequired && (
            <div className="mt-4 flex items-center justify-center text-gray-400 text-sm">
              <Lock className="w-4 h-4 mr-2" />
              <span>Subscribe to read the full content</span>
              <button
                onClick={handleSubscribeClick}
                className="ml-4 bg-nocena-purple hover:bg-nocena-purple-fade text-white px-4 py-2 rounded-lg transition-all duration-200"
              >
                Subscribe for {post.tierRequired.price} NCX
              </button>
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div
              className={`flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-800 ${!hasAccess ? 'filter blur-sm' : ''}`}
            >
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-800 text-nocenaBlue text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors duration-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-between border-t border-gray-800 pt-6">
          <div className="flex items-center space-x-8">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors duration-200 ${
                isLiked ? 'text-nocenaPink' : 'text-gray-400 hover:text-nocenaPink'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-lg">{post.likes + (isLiked ? 1 : 0)}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-400 hover:text-nocenaBlue transition-colors duration-200">
              <MessageCircle className="w-6 h-6" />
              <span className="text-lg">{post.comments}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-400 hover:text-nocenaPurple transition-colors duration-200">
              <Share className="w-6 h-6" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        currentUserId={currentUser?.id || ''}
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        tier={post?.tierRequired || null}
        creatorName={post?.creator.username || ''}
        onConfirmSubscription={handleConfirmSubscription}
        updateSubscriptionTiers={updateSubscriptionTiers}
      />
    </div>
  );
};

export default PostDetailView;
