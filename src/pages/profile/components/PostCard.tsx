import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Lock, Play, Eye } from 'lucide-react';
import { Post, MembershipTier } from '../../../lib/types';

interface PostCardProps {
  post: Post;
  hasAccess: boolean;
  showBlurred?: boolean;
  onSubscribe?: (tierId: string) => void;
  onLike?: (postId: string) => void;
  onClick?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, hasAccess, showBlurred = false, onSubscribe, onLike, onClick }) => {
  const [isLiked, setIsLiked] = useState(false);

  const getTierColor = (tier?: MembershipTier) => {
    if (!tier) return '';
/*
    switch (tier.color) {
      case 'common': return 'border-rarityCommon bg-rarityCommonDark';
      case 'uncommon': return 'border-rarityUncommon bg-rarityUncommonDark';
      case 'rare': return 'border-rarityRare bg-rarityRareDark';
      case 'epic': return 'border-rarityEpic bg-rarityEpicDark';
      case 'legendary': return 'border-rarityLegendary bg-rarityLegendaryDark';
      default: return 'border-gray-700 bg-gray-900';
    }
*/
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(post.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`bg-gray-900 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-300 cursor-pointer ${getTierColor(post.tierRequired)}`}
      onClick={onClick}
    >
      {/* Creator Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={post.creator.avatar}
            alt={post.creator.displayName}
            className="w-10 h-10 rounded-full border-2 border-nocenaPurple"
          />
          <div>
            <h3 className="text-white font-semibold">{post.creator.displayName}</h3>
            <p className="text-gray-400 text-sm">@{post.creator.username} • {formatDate(post.createdAt)}</p>
          </div>
        </div>
        {post.tierRequired && (
          <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getTierColor(post.tierRequired)}`}>
            {post.tierRequired.name}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4">
        <h2 className="text-xl font-bold text-white mb-2">{post.title}</h2>

        {/* Media Preview */}
        {post.mediaUrl && (
          <div className="relative mb-4 rounded-lg overflow-hidden">
            {hasAccess && !showBlurred ? (
              <div className="relative">
                {post.mediaType === 'video' ? (
                  <video
                    src={post.mediaUrl}
                    className={`w-full h-64 object-cover ${post.tierRequired ? 'filter blur-sm' : ''}`}
                    controls={!post.tierRequired}
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className={`w-full h-64 object-cover ${post.tierRequired ? 'filter blur-sm' : ''}`}
                  />
                )}
                {post.tierRequired && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-white font-semibold mb-2">Premium Content</p>
                      <p className="text-sm text-gray-300 mb-4">Subscribe to unlock this content</p>
                      {onSubscribe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSubscribe(post.tierRequired!.id);
                          }}
                          className="bg-nocena-purple hover:bg-nocena-purple-fade text-white px-4 py-2 rounded-lg transition-all duration-200"
                        >
                          Subscribe for {post.tierRequired.price} NCX
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {post.mediaType === 'video' && post.tierRequired && (
                  <Play className="absolute top-4 right-4 w-6 h-6 text-gray-400" />
                )}
              </div>
            ) : (
              <div className="relative">
                {post.mediaType === 'video' ? (
                  <video
                    src={post.mediaUrl}
                    className="w-full h-64 object-cover filter blur-sm"
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-64 object-cover filter blur-sm"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-white font-semibold mb-2">Premium Content</p>
                    <p className="text-sm text-gray-300 mb-4">Subscribe to unlock this content</p>
                    {onSubscribe && post.tierRequired && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSubscribe(post.tierRequired!.id);
                        }}
                        className="bg-nocena-purple hover:bg-nocena-purple-fade text-white px-4 py-2 rounded-lg transition-all duration-200"
                      >
                        Subscribe for {post.tierRequired.price} NCX
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Content Preview */}
        <div className="mb-4">
          <p className={`text-gray-300 leading-relaxed line-clamp-3 ${post.tierRequired ? 'filter blur-sm' : ''}`}>
            {post.content}
          </p>
          {post.tierRequired && (
            <div className="mt-2 flex items-center text-gray-400 text-sm">
              <Lock className="w-4 h-4 mr-1" />
              <span>Full content available to subscribers</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-800 text-nocenaBlue text-xs px-2 py-1 rounded-full hover:bg-gray-700 transition-colors duration-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-800 pt-4">
        <div className="flex items-center space-x-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`flex items-center space-x-2 transition-colors duration-200 ${
              isLiked ? 'text-nocenaPink' : 'text-gray-400 hover:text-nocenaPink'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.likes + (isLiked ? 1 : 0)}</span>
          </button>

          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center space-x-2 text-gray-400 hover:text-nocenaBlue transition-colors duration-200"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments}</span>
          </button>

          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center space-x-2 text-gray-400 hover:text-nocenaPurple transition-colors duration-200"
          >
            <Share className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center text-gray-500 text-sm">
          <Eye className="w-4 h-4 mr-1" />
          <span>1.2k views</span>
        </div>
      </div>
    </div>
  );
};