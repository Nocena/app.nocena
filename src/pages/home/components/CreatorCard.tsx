import React from 'react';
import { FileText, Star, Users } from 'lucide-react';
import { SimplifiedUser } from '../../../lib/types';

interface CreatorCardProps {
  creator: SimplifiedUser;
  onProfileClick: () => void;
  showStats?: boolean;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({
                                                          creator,
                                                          onProfileClick,
                                                          showStats = true
                                                        }) => {
  return (
    <div
      onClick={() => onProfileClick()}
      className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-nocenaBlue transition-all duration-300 cursor-pointer hover:scale-105 group"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <img
            src={creator.avatar}
            alt={creator.username}
            className="w-16 h-16 rounded-full border-2 border-nocenaPurple group-hover:border-nocenaPink transition-colors duration-300"
          />
          <div className="absolute -bottom-1 -right-1 bg-nocenaPink text-white p-1 rounded-full">
            <Star className="w-3 h-3" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white group-hover:text-nocenaBlue transition-colors duration-300">
            {creator.username}
          </h3>
          <p className="text-gray-400 text-sm">@{creator.username}</p>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
        {creator.bio ? creator.bio : `This user doesn't have bio`}
      </p>

      {showStats && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-gray-400">
            <FileText className="w-4 h-4" />
            <span>0 posts</span>
          </div>
          <div className="text-nocenaBlue font-medium">
            0 tiers
          </div>
        </div>
      )}
    </div>
  );
};