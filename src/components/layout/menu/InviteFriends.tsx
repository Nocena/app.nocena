import React, { useState, useEffect } from 'react';
import { Share, Copy, MessageCircle, Users, Gift, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface InviteFriendsProps {
  onBack: () => void;
}

interface InviteStats {
  inviteCodes: Array<{
    code: string;
    createdAt: string;
    isUsed: boolean;
  }>;
  friendsInvited: number;
  tokensEarned: number;
}

const InviteFriends: React.FC<InviteFriendsProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const [inviteStats, setInviteStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's invite statistics and ensure they have exactly 2 codes (only if they don't exist)
  const fetchInviteStats = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/invite/user-invites?userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        // Only generate missing codes if user has NO codes at all (new user)
        if (data.inviteCodes.length === 0) {
          await generateMissingInviteCodes(2);
          // Refetch after generating initial codes
          const updatedResponse = await fetch(`/api/invite/user-invites?userId=${user.id}`);
          const updatedData = await updatedResponse.json();
          setInviteStats(updatedData);
        } else if (data.inviteCodes.length > 2) {
          // Keep only the 2 most recent codes
          setInviteStats({
            ...data,
            inviteCodes: data.inviteCodes.slice(0, 2),
          });
        } else {
          setInviteStats(data);
        }
      } else {
        setError(data.error || 'Failed to load invite stats');
      }
    } catch (err) {
      console.error('Error fetching invite stats:', err);
      setError('Failed to load invite stats');
    } finally {
      setLoading(false);
    }
  };

  // Generate missing invite codes (only for new users)
  const generateMissingInviteCodes = async (count: number) => {
    if (!user?.id) return;

    try {
      for (let i = 0; i < count; i++) {
        await fetch('/api/invite/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            source: 'initial',
          }),
        });
      }
    } catch (err) {
      console.error('Error generating invite codes:', err);
    }
  };

  useEffect(() => {
    fetchInviteStats();
  }, [user?.id]);

  // Detect if user is in an in-app browser
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const isInAppBrowser = /FBAN|FBAV|Instagram|Line|WhatsApp|Telegram|MessengerForiOS|MessengerLite/i.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isInAppBrowser && !isStandalone) {
      setShowBrowserWarning(true);
    }
  }, []);

  // Get available invite codes (unused ones first)
  const availableCodes = inviteStats?.inviteCodes?.filter((code) => !code.isUsed) || [];
  const primaryCode = availableCodes[0]?.code;

  const createInviteMessage = (code: string) => `Hello Challenger!

  You've just been invited to Nocena — where fun meets rewards.
  Complete challenges. Earn token. Connect with people.

  Your invite code: ${code}
  We both get 50 Nocenix when you join!
  Download: https://app.nocena/${code}

  ⚠️ *Pro tip:* If you're opening this in Meta, Telegram, or any in-app browser, tap the ... menu and choose "Open in browser" to install the app properly.

  Need assistance? Tap [this link].
  `;

  const handleShare = async (code: string) => {
    const message = createInviteMessage(code);
    const url = `https://nocena.app/join/${code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me on Nocena! Use code: ${code}`,
          text: message,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        handleCopy(message, 'Invite message copied!');
      }
    } else {
      handleCopy(message, 'Invite message copied!');
    }
  };

  const handleCopy = async (text: string, successMessage: string = 'Copied to clipboard!') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(successMessage);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(successMessage);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleCopyCode = (code: string) => {
    handleCopy(code, 'Invite code copied!');
  };

  const handleSMS = (code: string) => {
    const message = createInviteMessage(code);
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-nocenaBg to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-nocenaBlue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading your invite codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-nocenaBg to-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-nocenaBg/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="flex items-center text-white/70 hover:text-white transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mr-2"
            >
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Back
          </button>
          <h1 className="text-lg font-semibold">Invite Friends</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Browser Warning */}
        {showBrowserWarning && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-orange-200 font-medium mb-1">Open in Browser Required</h3>
                <p className="text-orange-300/80 text-sm">
                  You're in an in-app browser. For the best experience sharing invites, tap the menu (⋯) and select
                  "Open in Browser".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-200 font-medium mb-1">Error</h3>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-nocena-brand rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Share the Fun</h2>
            <p className="text-white/60 text-sm">
              {availableCodes.length > 0
                ? `You have ${availableCodes.length} invite code${availableCodes.length !== 1 ? 's' : ''} ready. Both earn 50 Nocenix tokens!`
                : 'All invite codes have been used. Great job spreading the word!'}
            </p>
          </div>
        </div>

        {/* Your Invite Codes */}
        {inviteStats && inviteStats.inviteCodes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-white/80 font-medium text-sm">Your Invite Codes</h3>

            {inviteStats.inviteCodes.map((invite, index) => (
              <div key={invite.code} className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`text-2xl font-mono font-bold ${invite.isUsed ? 'text-white/40' : 'text-white'}`}>
                      {invite.code}
                    </div>
                    {invite.isUsed ? (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                        ✓ Used
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-nocena-blue/20 text-nocena-blue text-xs rounded-full font-medium">
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                {invite.isUsed ? (
                  <div className="text-center py-4">
                    <p className="text-white/50 text-sm">This code has been used successfully! 🎉</p>
                    <p className="text-white/40 text-xs mt-1">You both earned 50 Nocenix tokens</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => handleShare(invite.code)}
                      className="flex flex-col items-center space-y-1 p-3 rounded-xl bg-nocena-blue hover:bg-nocena-blue/80 transition-colors"
                      title="Share anywhere"
                    >
                      <Share className="w-5 h-5" />
                      <span className="text-xs">Share</span>
                    </button>

                    <button
                      onClick={() => handleSMS(invite.code)}
                      className="flex flex-col items-center space-y-1 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                      title="Send via SMS"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-xs">SMS</span>
                    </button>

                    <button
                      onClick={() => handleCopyCode(invite.code)}
                      className="flex flex-col items-center space-y-1 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                      title="Copy invite code only"
                    >
                      <Copy className="w-5 h-5" />
                      <span className="text-xs">Copy</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Copy Success Feedback */}
        {copySuccess && (
          <div className="fixed bottom-6 left-6 right-6 bg-nocenaPink/90 backdrop-blur-sm text-white p-4 rounded-xl text-center font-medium z-50">
            {copySuccess}
          </div>
        )}

        {/* Rewards Info */}
        <div className="bg-nocena-pink-fade rounded-2xl p-6 border border-nocenaPink/20">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-nocena-pink rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold mb-2">Double the Rewards</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                When someone joins with your code, you both instantly receive
                <span className="text-nocenaPink font-semibold"> 50 Nocenix tokens</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {inviteStats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl font-bold text-white">{inviteStats.friendsInvited}</div>
              <div className="text-white/50 text-xs mt-1">Friends Joined</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl font-bold text-nocenaPink">{inviteStats.tokensEarned}</div>
              <div className="text-white/50 text-xs mt-1">Tokens Earned</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteFriends;
