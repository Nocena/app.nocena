import React, { useCallback, useEffect, useState } from 'react';
import { MembershipTier, Post } from '../../../lib/types';
import { PostCard } from './PostCard';
import { FileText, Plus } from 'lucide-react';
import { CreatePostModal } from './CreatePostModal';
import { addPostWithTier, fetchUserPosts } from '../../../lib/api/dgraph';
import imageCompression from 'browser-image-compression';
import { SubscriptionModal } from '@components/modals/SubscriptionModal';
import { useRouter } from 'next/router';


interface PostsSectionProps {
  userId: string;
  currentUserId: string;
  tiers: MembershipTier[];
  subscribedTiers: string[];
  isOwnProfile: boolean;
  updateSubscriptionTiers?: (userId: string) => Promise<void>
}

const PostsSection: React.FC<PostsSectionProps> = ({
                                                     userId,
                                                     currentUserId,
                                                     tiers,
                                                     subscribedTiers,
                                                     updateSubscriptionTiers,
                                                     isOwnProfile,
                                                   }) => {

  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const hasAccessToPost = (post: Post): boolean => {
    if (post.isPublic) return true;
    if (isOwnProfile) return true;
    if (!post.tierRequired) return true;
    return subscribedTiers.includes(post.tierRequired.id);
  };

  const updateUserPosts = useCallback(async (userId: string) => {
    const rawPosts = await fetchUserPosts(userId);
    setPosts(rawPosts.map((rawPost) => ({
      id: rawPost.id,
      creatorId: rawPost.creator.id,
      creator: rawPost.creator,
      title: rawPost.title,
      content: rawPost.content,
      mediaUrl: rawPost.mediaUrl,
      mediaType: rawPost.mediaType,
      tierRequired: {
        id: rawPost.tierRequired.id,
        name: rawPost.tierRequired.name,
        price: rawPost.tierRequired.price,
        description: '',
        color: 'common',
        benefits: [],
        subscriberCount: 0,
      },
      isPublic: rawPost.isPublic,
      likes: rawPost.likes,
      comments: rawPost.comments,
      createdAt: rawPost.createdAt,
      tags: [],
    })));
  }, []);

  useEffect(() => {
    if (userId)
      updateUserPosts(userId);
  }, [userId]);

  const onSubscribe = (post: Post) => {
    setSelectedPost(post)
    setIsSubscriptionModalOpen(true)
  };

  const onPostClick = (post: Post) => {
    router.push(`/post/${post.id}`)
  };

  const handleConfirmSubscription = (tierId: string) => {
    // onSubscribe?.(tierId);
    setIsSubscriptionModalOpen(false);
  };

  const handleCreatePost = async (postData: any) => {
    let mediaUrl = '';
    const mediaType = 'image';
    const { mediaFile } = postData;

    if (mediaFile) {
      try {
        if (!mediaFile.type.startsWith('image/')) {
          alert('Please select a valid image file.');
          return;
        }

        if (mediaFile.size > 10 * 1024 * 1024) {
          alert('Image file must be smaller than 10MB.');
          return;
        }

        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
        };

        const compressedFile = await imageCompression(mediaFile, options);

        // Wrap FileReader in a Promise
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              resolve((reader.result as string).replace(/^data:.+;base64,/, ''));
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });

        // Now upload to IPFS
        const response = await fetch('/api/pinFileToIPFS', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64String,
            fileName: `post-${Date.now()}.webp`,
            fileType: 'image',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const { ipfsHash } = await response.json();
        mediaUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        // Now everything is sequential
        await addPostWithTier(
          currentUserId,
          postData.title,
          postData.content,
          postData.tierRequired ?? '8b589fd8-08ed-4e20-b0df-9c7dd5b6d941',
          postData.isPublic,
          postData.tags,
          mediaUrl,
          mediaType
        );

        await updateUserPosts(userId);

      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
      }
    }
  };

  // UNIFIED AVATAR INTERFACE - Single container for visual consistency
  return (
    <>
      <div className="space-y-6">
        {isOwnProfile && (
          <div className="w-full flex justify-center my-10">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-nocena-purple hover:bg-nocena-purple-fade text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create a new post</span>
            </button>
          </div>
        )}

        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              hasAccess={hasAccessToPost(post)}
              onSubscribe={onSubscribe}
              onClick={() => onPostClick(post)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No posts available yet.</p>
          </div>
        )}
      </div>
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        membershipTiers={tiers}
        onCreatePost={handleCreatePost}
      />
      {/* Subscription Modal */}
      <SubscriptionModal
        currentUserId={currentUserId}
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        tier={selectedPost?.tierRequired || null}
        creatorName={selectedPost?.creator.username || ''}
        onConfirmSubscription={handleConfirmSubscription}
        updateSubscriptionTiers={updateSubscriptionTiers}
      />
    </>
  );
};

export default PostsSection;
