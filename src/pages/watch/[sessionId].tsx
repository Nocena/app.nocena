// src/pages/watch/[sessionId].tsx - MOBILE-FIRST WATCH PAGE
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import FilCDNViewer from '../../components/FilCDNViewer';

interface Comment {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

const WatchPage = () => {
  const router = useRouter();
  const { sessionId } = router.query;
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  console.log(`🎬 [WatchPage] Component mounted for session: ${sessionId}`);
  console.log(`🎬 [WatchPage] User:`, user);
  console.log(`🎬 [WatchPage] Router query:`, router.query);

  useEffect(() => {
    if (router.isReady) {
      console.log(`🎬 [WatchPage] Router is ready, sessionId: ${sessionId}`);
      setIsLoading(false);
    }
  }, [router.isReady, sessionId]);

  const handleSendComment = () => {
    if (!newComment.trim() || !user) return;

    console.log(`💬 [WatchPage] Sending comment: ${newComment}`);

    const comment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username || `User ${user.id.slice(-4)}`,
      message: newComment.trim(),
      timestamp: Date.now(),
    };

    setComments((prev) => [...prev, comment]);
    setNewComment('');

    console.log(`💬 [WatchPage] Comment added:`, comment);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return `${seconds}s ago`;
  };

  if (isLoading) {
    console.log(`⏳ [WatchPage] Still loading...`);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg">Loading stream...</div>
        </div>
      </div>
    );
  }

  if (!sessionId || typeof sessionId !== 'string') {
    console.error(`❌ [WatchPage] Invalid sessionId:`, sessionId);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl mb-4">Invalid Stream</h1>
          <button
            onClick={() => {
              console.log(`🔙 [WatchPage] Going back to watch index`);
              router.push('/watch');
            }}
            className="bg-nocenaPink px-6 py-3 rounded-lg text-white font-medium hover:bg-pink-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  console.log(`✅ [WatchPage] Rendering watch page for session: ${sessionId}`);

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              console.log(`🔙 [WatchPage] Back button clicked`);
              router.back();
            }}
            className="text-white hover:text-nocenaPink transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">LIVE</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              console.log(`💬 [WatchPage] Toggle chat: ${!showChat}`);
              setShowChat(!showChat);
            }}
            className={`p-2 rounded-full transition-colors ${
              showChat ? 'bg-nocenaPink' : 'bg-black/40 hover:bg-black/60'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>

          <button
            onClick={() => {
              console.log(`🔗 [WatchPage] Share button clicked`);
              if (navigator.share) {
                navigator.share({
                  title: 'Live Stream',
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Video Player - Full Width Mobile */}
      <div className="flex-1 relative bg-black">
        <div className="absolute inset-0">
          <FilCDNViewer sessionId={sessionId} autoplay={false} controls={true} className="w-full h-full object-cover" />
        </div>

        {/* Stream Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">FilCDN Live Stream</h2>
              <p className="text-xs text-gray-300">Session: {sessionId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Overlay - Slides up from bottom */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-black/95 backdrop-blur-sm rounded-t-2xl max-h-[70vh] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h3 className="font-bold">Live Chat</h3>
                <p className="text-sm text-gray-400">{comments.length} messages</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {comments.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No messages yet</p>
                  <p className="text-sm">Be the first to say something!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nocenaPink to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {comment.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{comment.username}</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-200 break-words">{comment.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            {user ? (
              <div className="p-4 border-t border-white/10">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nocenaPink to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {(user.username || user.id).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-end space-x-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Say something..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-400 resize-none focus:outline-none focus:border-nocenaPink max-h-20"
                        rows={1}
                        maxLength={200}
                      />
                      <button
                        onClick={handleSendComment}
                        disabled={!newComment.trim()}
                        className="w-10 h-10 bg-nocenaPink hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{newComment.length}/200</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-white/10 text-center">
                <p className="text-sm text-gray-400 mb-3">Sign in to join the conversation</p>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full px-4 py-3 bg-nocenaPink hover:bg-pink-600 text-white text-sm rounded-xl transition-colors font-medium"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Chat Button - When chat is hidden */}
      {!showChat && comments.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowChat(true)}
            className="bg-nocenaPink hover:bg-pink-600 text-white p-3 rounded-full shadow-lg transition-colors relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {comments.length > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {comments.length > 99 ? '99+' : comments.length}
              </div>
            )}
          </button>
        </div>
      )}

      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded border border-white/20 max-w-xs">
          <div>
            <strong>Debug Info:</strong>
          </div>
          <div>Session: {sessionId}</div>
          <div>User: {user?.id || 'Not logged in'}</div>
          <div>Comments: {comments.length}</div>
          <div>Chat: {showChat ? 'Visible' : 'Hidden'}</div>
        </div>
      )}
    </div>
  );
};

export default WatchPage;
