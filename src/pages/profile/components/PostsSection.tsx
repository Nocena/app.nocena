import React, { useState } from 'react';
import { Post } from '../../../lib/types';
import { PostCard } from './PostCard';
import { FileText, Plus } from 'lucide-react';
import { CreatePostModal } from './CreatePostModal';
import { mockMembershipTiers } from '../../../data/mock';


interface PostsSectionProps {
  posts: Post[];
  subscribedTiers: string[];
  isOwnProfile: boolean;
}

const PostsSection: React.FC<PostsSectionProps> = ({
                                                     posts,
                                                     subscribedTiers,
                                                     isOwnProfile,
                                                   }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const hasAccessToPost = (post: Post): boolean => {
    if (post.isPublic) return true;
    if (isOwnProfile) return true;
    if (!post.tierRequired) return true;
    return subscribedTiers.includes(post.tierRequired.id);
  };

  const onSubscribe = (tierId: string) => {
  };

  const onPostClick = (post: Post) => {
  };

  const handleCreatePost = () => {}

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
              showBlurred={!hasAccessToPost(post)}
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
        membershipTiers={mockMembershipTiers}
        onCreatePost={handleCreatePost}
      />
    </>
  );
};

export default PostsSection;
