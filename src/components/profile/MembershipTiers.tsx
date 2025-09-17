import React from 'react';
import { Crown, Star, Gem, Shield, Sparkles, Users, CheckCircle } from 'lucide-react';
import { MembershipTier } from '../../lib/types';

interface MembershipTiersProps {
  tiers: MembershipTier[];
  subscribedTiers: string[];
  onSubscribe: (tierId: string) => void;
  isOwnProfile: boolean;
}

export const MembershipTiers: React.FC<MembershipTiersProps> = ({
  tiers,
  subscribedTiers,
  onSubscribe,
  isOwnProfile,
}) => {
  const getTierIcon = (color: string) => {
    switch (color) {
      case 'common':
        return <Shield className="w-6 h-6" />;
      case 'uncommon':
        return <Star className="w-6 h-6" />;
      case 'rare':
        return <Gem className="w-6 h-6" />;
      case 'epic':
        return <Sparkles className="w-6 h-6" />;
      case 'legendary':
        return <Crown className="w-6 h-6" />;
      default:
        return <Shield className="w-6 h-6" />;
    }
  };

  const getTierColors = (color: string) => {
    switch (color) {
      case 'common':
        return {
          border: 'border-rarityCommon',
          bg: 'bg-rarityCommon',
          text: 'text-rarityCommon',
          button: 'bg-rarity-common hover:bg-rarityCommon',
        };
      case 'uncommon':
        return {
          border: 'border-rarityUncommon',
          bg: 'bg-rarityUncommon',
          text: 'text-rarityUncommon',
          button: 'bg-rarity-uncommon hover:bg-rarityUncommon',
        };
      case 'rare':
        return {
          border: 'border-rarityRare',
          bg: 'bg-rarityRare',
          text: 'text-rarityRare',
          button: 'bg-rarity-rare hover:bg-rarityRare',
        };
      case 'epic':
        return {
          border: 'border-rarityEpic',
          bg: 'bg-rarityEpic',
          text: 'text-rarityEpic',
          button: 'bg-rarity-epic hover:bg-rarityEpic',
        };
      case 'legendary':
        return {
          border: 'border-rarityLegendary',
          bg: 'bg-rarityLegendary',
          text: 'text-rarityLegendary',
          button: 'bg-rarity-legendary hover:bg-rarityLegendary',
        };
      default:
        return {
          border: 'border-gray-700',
          bg: 'bg-gray-700',
          text: 'text-gray-400',
          button: 'bg-gray-700 hover:bg-gray-600',
        };
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Crown className="w-6 h-6 text-nocenaPink" />
        <h2 className="text-xl font-bold text-white">Membership Tiers</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {tiers.map((tier) => {
          const colors = getTierColors(tier.color);
          const isSubscribed = subscribedTiers.includes(tier.id);
          const tierClass =
            tier.color === 'legendary' ? 'animate-legendary-glow' : tier.color === 'epic' ? 'animate-epic-pulse' : '';

          return (
            <div
              key={tier.id}
              className={`bg-gray-800 border rounded-xl p-6 transition-all duration-300 hover:scale-105 ${colors.border} ${tierClass}`}
            >
              {/* Tier Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${colors.bg} bg-opacity-20`}>
                    <div className={colors.text}>{getTierIcon(tier.color)}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                    <p className={`text-sm ${colors.text} capitalize font-medium`}>{tier.color}</p>
                  </div>
                </div>
                {isSubscribed && <CheckCircle className="w-6 h-6 text-green-500" />}
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{tier.description}</p>

              {/* Benefits */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-2">Benefits:</h4>
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.text}`} />
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price and Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{tier.price.toLocaleString()} NCX</span>
                  <span className="text-gray-400 text-sm">per month</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{tier.subscriberCount} subscribers</span>
                </div>

                {!isOwnProfile && (
                  <button
                    onClick={() => onSubscribe(tier.id)}
                    disabled={isSubscribed}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                      isSubscribed ? 'bg-green-600 cursor-not-allowed' : `${colors.button} hover:scale-105`
                    }`}
                  >
                    {isSubscribed ? 'Subscribed' : `Subscribe for ${tier.price} NCX`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
