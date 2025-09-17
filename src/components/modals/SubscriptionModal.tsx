import React, { useState } from 'react';
import { X, Crown, Calendar, CreditCard, CheckCircle, Clock, Star } from 'lucide-react';
import { MembershipTier } from '../../lib/types';
import { addNewUserSubscription } from '../../lib/api/dgraph';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  tier: MembershipTier | null;
  creatorName: string;
  updateSubscriptionTiers?: (userId: string) => Promise<void>
  onConfirmSubscription: (tierId: string) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      tier,
                                                                      currentUserId,
                                                                      creatorName,
                                                                      updateSubscriptionTiers,
                                                                      onConfirmSubscription,
                                                                    }) => {
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !tier) return null;

  const getTierColor = (color: string) => {
    switch (color) {
      case 'common': return 'text-rarityCommon bg-rarityCommon';
      case 'uncommon': return 'text-rarityUncommon bg-rarityUncommon';
      case 'rare': return 'text-rarityRare bg-rarityRare';
      case 'epic': return 'text-rarityEpic bg-rarityEpic';
      case 'legendary': return 'text-rarityLegendary bg-rarityLegendary';
      default: return 'text-gray-400 bg-gray-400';
    }
  };

  const handleProceed = async () => {
    setIsLoading(true);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStep('confirm');
    setIsLoading(false);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    await addNewUserSubscription(
      currentUserId,
      tier.id,
      (new Date()).toISOString(),
      '',
      true,
    )
    await updateSubscriptionTiers?.(currentUserId)
    setStep('success');
    setIsLoading(false);

    // Auto-close after success
    setTimeout(() => {
      onConfirmSubscription(tier.id);
      onClose();
      setStep('details'); // Reset for next time
    }, 2000);
  };

  const handleClose = () => {
    onClose();
    setStep('details'); // Reset for next time
    setIsLoading(false); // Reset loading state
  };

  const formatDate = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Crown className="w-6 h-6 text-nocenaPink" />
            <h2 className="text-xl font-bold text-white">
              {step === 'details' ? 'Subscription Details' :
                step === 'confirm' ? 'Confirm Subscription' :
                  'Subscription Successful!'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'details' && (
            <div className="space-y-6">
              {/* Tier Info */}
              <div className="text-center">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-opacity-20 ${getTierColor(tier.color)}`}>
                  <Star className={`w-5 h-5 ${getTierColor(tier.color).split(' ')[0]}`} />
                  <span className="text-white font-semibold">{tier.name}</span>
                </div>
                <p className="text-gray-400 mt-2">Subscribe to {creatorName}</p>
              </div>

              {/* Pricing */}
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {tier.price.toLocaleString()} NCX
                </div>
                <div className="text-gray-400">per month</div>
              </div>

              {/* Subscription Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Subscription starts</span>
                  </div>
                  <span className="text-white">Today</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Next billing date</span>
                  </div>
                  <span className="text-white">{formatDate(30)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment method</span>
                  </div>
                  <span className="text-nocenaPink">NCX Wallet</span>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="text-white font-medium mb-3">What you'll get:</h4>
                <ul className="space-y-2">
                  {tier?.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getTierColor(tier?.color).split(' ')[0]}`} />
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={handleProceed}
                disabled={isLoading}
                className="w-full bg-nocena-purple hover:bg-nocena-purple-fade disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Proceed to Confirmation</span>
                )}
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              {/* Confirmation Summary */}
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">
                  {tier.price.toLocaleString()} NCX
                </div>
                <p className="text-gray-400">
                  Monthly subscription to <span className="text-white font-medium">{creatorName}</span>
                </p>
                <p className="text-gray-400">
                  <span className={getTierColor(tier.color).split(' ')[0]}>{tier.name}</span> tier
                </p>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Subscription fee</span>
                  <span className="text-white">{tier.price.toLocaleString()} NCX</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Processing fee</span>
                  <span className="text-green-400">Free</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-white font-bold">{tier.price.toLocaleString()} NCX</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-400 text-center">
                By confirming, you agree to be charged {tier.price.toLocaleString()} NCX monthly until you cancel.
                You can cancel anytime from your subscription settings.
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('details')}
                  disabled={isLoading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-nocena-purple hover:bg-nocena-purple-fade disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Subscription</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>

              {/* Success Message */}
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  You're subscribed!
                </h3>
                <p className="text-gray-400">
                  You've successfully subscribed to <span className="text-white font-medium">{creatorName}</span>'s{' '}
                  <span className={getTierColor(tier.color).split(' ')[0]}>{tier.name}</span> tier.
                </p>
              </div>

              {/* Next Steps */}
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-2">
                  🎉 You now have access to exclusive content!
                </p>
                <p className="text-xs text-gray-400">
                  Your subscription will renew on {formatDate(30)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};