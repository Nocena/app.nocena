import React from 'react';
import { Users, FileText, Star } from 'lucide-react';
import { Creator } from '../../../lib/types'

interface CreatorCardProps {
  creator: Creator;
  onProfileClick: (username: string) => void;
  showStats?: boolean;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({
                                                          creator,
                                                          onProfileClick,
                                                          showStats = true
                                                        }) => {
  return (
    <div
      onClick={() => onProfileClick(creator.username)}
      className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-nocenaBlue transition-all duration-300 cursor-pointer hover:scale-105 group"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <img
            src={creator.avatar}
            alt={creator.displayName}
            className="w-16 h-16 rounded-full border-2 border-nocenaPurple group-hover:border-nocenaPink transition-colors duration-300"
          />
          <div className="absolute -bottom-1 -right-1 bg-nocenaPink text-white p-1 rounded-full">
            <Star className="w-3 h-3" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white group-hover:text-nocenaBlue transition-colors duration-300">
            {creator.displayName}
          </h3>
          <p className="text-gray-400 text-sm">@{creator.username}</p>
          <p className="text-nocenaPink text-xs font-medium mt-1">{creator.category}</p>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
        {creator.bio}
      </p>

      {showStats && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-gray-400">
            <Users className="w-4 h-4" />
            <span>{creator.followers.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <FileText className="w-4 h-4" />
            <span>{creator.posts} posts</span>
          </div>
          <div className="text-nocenaBlue font-medium">
            {creator.membershipTiers.length} tiers
          </div>
        </div>
      )}
    </div>
  );
};