import React, { useState, useEffect } from 'react';
import { Share, Copy, MessageCircle, Smartphone, Users, Gift, ExternalLink, AlertTriangle } from 'lucide-react';

interface InviteFriendsProps {
  onBack: () => void;
}

const InviteFriends: React.FC<InviteFriendsProps> = ({ onBack }) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);

  // Mock user data - replace with real data
  const user = {
    firstName: 'Alex',
    availableInvites: 1, // One ready to send
    totalInvites: 2, // Two total (one used, one available)
    inviteCode: `${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // 6 characters
    friendsInvited: 3,
    tokensEarned: 150,
    canEarnMoreInvites: true, // Well-behaving users can earn more
  };

  const inviteUrl = `https://nocena.app/join/${user.inviteCode}`;

  // Enhanced invite message optimized for link previews
  const inviteMessage = `🎯 Join me on Nocena! Complete fun challenges and earn tokens together. 

🔑 Your invite code: ${user.inviteCode}

💰 We both get 50 Nocenix when you join!

📱 Download: ${inviteUrl}

⚠️ IMPORTANT: If this opens in WhatsApp/Instagram/Messenger browser, tap the (...) menu and select "Open in Browser" to install the app properly!`;

  // Detect if user is in an in-app browser
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    const isInAppBrowser = /FBAN|FBAV|Instagram|Line|WhatsApp|Telegram|MessengerForiOS|MessengerLite/i.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isInAppBrowser && !isStandalone) {
      setShowBrowserWarning(true);
    }
  }, []);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me on Nocena! Use code: ${user.inviteCode}`,
          text: inviteMessage,
          url: inviteUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        handleCopyToClipboard();
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopySuccess('Copied to clipboard!');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteMessage;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess('Copied to clipboard!');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleSMSShare = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(inviteMessage)}`;
    window.open(smsUrl, '_blank');
  };

  const shareMethods = [
    {
      icon: Share,
      title: 'Share Anywhere',
      subtitle: "Use your phone's share menu",
      action: handleNativeShare,
      primary: true,
    },
    {
      icon: MessageCircle,
      title: 'Send via SMS',
      subtitle: 'Text your friends directly',
      action: handleSMSShare,
    },
    {
      icon: Copy,
      title: 'Copy Invite Link',
      subtitle: 'Paste in any app you like',
      action: handleCopyToClipboard,
    },
  ];

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
          <div className="w-12" /> {/* Spacer */}
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

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-nocena-brand rounded-full animate-pulse" />
            <div className="absolute inset-1 bg-nocenaBg/80 rounded-full backdrop-blur-sm" />
            <div className="absolute inset-3 bg-nocena-brand rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">Share the Fun</h2>
            <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed">
              You have {user.availableInvites} invite{user.availableInvites !== 1 ? 's' : ''} ready to send. Both earn
              50 Nocenix tokens!
            </p>
          </div>
        </div>

        {/* Your Invite Code - Enhanced for Link Previews */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="text-center space-y-4">
            <div className="text-white/60 text-sm font-medium">Your Available Invite Code</div>

            {/* Large, visually prominent invite code display */}
            <div className="relative">
              <div className="bg-nocena-blue rounded-xl p-6 border border-nocenaBlue/50">
                <div className="text-3xl font-mono font-bold tracking-wider text-white mb-2">{user.inviteCode}</div>
                <div className="text-sm font-medium">6-character personal code</div>
              </div>

              {/* Decorative elements to make it pop in screenshots */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-nocenaPink rounded-full animate-pulse" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-nocenaPurple rounded-full animate-pulse" />
            </div>

            <div className="text-white/50 text-xs">Friends enter this code when they sign up</div>
          </div>
        </div>

        {/* Link Preview Optimization Notice */}
        <div className="bg-nocenaBlue/10 rounded-2xl p-4 border border-nocenaBlue/20">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-nocenaBlue rounded-lg flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1">Optimized for Sharing</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Your invite code will be clearly visible in link previews on WhatsApp, Telegram, Instagram, and other
                messaging apps.
              </p>
            </div>
          </div>
        </div>

        {/* Share Methods */}
        <div className="space-y-3">
          <h3 className="text-white/80 font-medium text-sm uppercase tracking-wide">Choose How to Share</h3>

          {shareMethods.map((method, index) => (
            <button
              key={index}
              onClick={method.action}
              className={`w-full p-4 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden ${
                method.primary
                  ? 'bg-nocena-blue-fade border-nocenaBlue/30 hover:bg-nocena-blue/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-4 relative z-10">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    method.primary ? 'bg-nocena-blue' : 'bg-white/10'
                  }`}
                >
                  <method.icon className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1">
                  <div className="font-medium text-white">{method.title}</div>
                  <div className="text-white/60 text-sm">{method.subtitle}</div>
                </div>

                <ExternalLink className="w-4 h-4 text-white/40" />
              </div>

              {method.primary && <div className="absolute inset-0 bg-nocena-blue-fade rounded-2xl opacity-20" />}
            </button>
          ))}
        </div>

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
                <span className="text-nocenaPink font-semibold"> 50 Nocenix tokens</span>. Start building your challenge
                community today!
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">{user.friendsInvited}</div>
            <div className="text-white/50 text-xs mt-1">Friends Joined</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-nocenaPink">{user.tokensEarned}</div>
            <div className="text-white/50 text-xs mt-1">Tokens Earned</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-nocenaBlue">{user.availableInvites}</div>
            <div className="text-white/50 text-xs mt-1">Available</div>
          </div>
        </div>

        {/* Earn More Invites */}
        {user.canEarnMoreInvites && (
          <div className="bg-nocena-brand-fade rounded-2xl p-4 border border-nocenaBlue/20">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-nocena-brand rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1">Earn More Invites</h4>
                <p className="text-white/70 text-sm leading-relaxed">
                  Complete challenges consistently and help build a positive community to unlock additional invite
                  codes!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Browser Instructions */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h4 className="text-white/80 font-medium mb-3 text-sm">📱 Sharing Tips</h4>
          <ul className="space-y-2 text-white/60 text-sm">
            <li className="flex items-start space-x-2">
              <span className="text-nocenaBlue">•</span>
              <span>Your invite code appears clearly in link previews</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-nocenaPurple">•</span>
              <span>Tell friends to "Open in Browser" from messaging apps</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-nocenaPink">•</span>
              <span>Share your best challenge photos to build excitement</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InviteFriends;
