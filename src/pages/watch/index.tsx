// src/pages/watch/index.tsx - MOBILE-FIRST WATCH INDEX PAGE
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PrimaryButton from '../../components/ui/PrimaryButton';

interface ActiveSession {
  sessionId: string;
  userId: string;
  startTime: number;
  isLive: boolean;
  totalChunks: number;
  uploadedSegments: number;
  duration: number;
  lastActivity: number;
  proofSetId?: string;
  storageProvider?: string;
}

const WatchIndexPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch active sessions
  const fetchActiveSessions = async () => {
    try {
      setError(null);
      console.log('🔄 [WatchIndex] Fetching active sessions...');

      const response = await fetch('/api/filcdn/livestream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list_active_sessions',
        }),
      });

      console.log('📡 [WatchIndex] API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch active sessions: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 [WatchIndex] API response:', result);

      if (result.success) {
        const sessions = result.sessions || [];
        console.log(`✅ [WatchIndex] Found ${sessions.length} active sessions`);
        setActiveSessions(sessions);

        // Log each session for debugging
        sessions.forEach((session: ActiveSession, index: number) => {
          console.log(`📺 [WatchIndex] Session ${index + 1}:`, {
            sessionId: session.sessionId,
            userId: session.userId,
            isLive: session.isLive,
            chunks: session.totalChunks,
            segments: session.uploadedSegments,
            duration: Math.round(session.duration / 1000) + 's',
          });
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ [WatchIndex] Error fetching active sessions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load active sessions');
      setActiveSessions([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('🔐 [WatchIndex] User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('🎬 [WatchIndex] Component mounted, fetching sessions');
    fetchActiveSessions();
  }, [isAuthenticated, router]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    console.log('⏰ [WatchIndex] Setting up auto-refresh interval');
    const interval = setInterval(() => {
      console.log('🔄 [WatchIndex] Auto-refresh triggered');
      setRefreshing(true);
      fetchActiveSessions();
    }, 10000);

    return () => {
      console.log('🧹 [WatchIndex] Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    console.log('🔄 [WatchIndex] Manual refresh triggered');
    setRefreshing(true);
    fetchActiveSessions();
  };

  const handleWatchStream = (sessionId: string) => {
    console.log(`🎥 [WatchIndex] Navigating to watch stream: ${sessionId}`);
    console.log(`🎥 [WatchIndex] Target URL: /watch/${sessionId}`);

    router
      .push(`/watch/${sessionId}`)
      .then(() => {
        console.log(`✅ [WatchIndex] Navigation to /watch/${sessionId} completed`);
      })
      .catch((error) => {
        console.error(`❌ [WatchIndex] Navigation failed:`, error);
      });
  };

  const handleStartStreaming = () => {
    console.log('🎬 [WatchIndex] Navigating to livestream page');
    router.push('/livestream');
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${minutes}m ago`;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    console.log(`⏳ [WatchIndex] Still loading...`);
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="text-lg mt-4">Loading streams...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Header - No back button */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <h1 className="text-lg font-bold">Live Streams</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button
            onClick={handleStartStreaming}
            className="bg-nocenaPink hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            Go Live
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && activeSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📺</div>
            <h2 className="text-xl font-bold mb-2 text-red-400">Connection Error</h2>
            <p className="text-gray-400 mb-6 text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-nocenaPink hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-bold mb-2">No Live Streams</h2>
            <p className="text-gray-400 mb-6 text-sm">Be the first to go live!</p>
            <button
              onClick={handleStartStreaming}
              className="bg-nocenaPink hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Start Streaming
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-4 text-center">
              <p className="text-gray-400 text-sm">
                {activeSessions.length} stream{activeSessions.length !== 1 ? 's' : ''} currently live
              </p>
            </div>

            {/* Stream Grid - Mobile First */}
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="bg-black/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10"
                >
                  {/* Full-width Stream Preview */}
                  <div
                    className="relative aspect-video bg-black/60 flex items-center justify-center cursor-pointer"
                    onClick={() => handleWatchStream(session.sessionId)}
                  >
                    {/* Placeholder for video thumbnail */}
                    <div className="text-6xl text-gray-400">📹</div>

                    {/* Live Indicator */}
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
                      {formatDuration(session.duration)}
                    </div>

                    {/* View count (placeholder) */}
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{Math.floor(Math.random() * 50) + 10}</span>
                    </div>
                  </div>

                  {/* Stream Info */}
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* Profile Picture */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nocenaPink to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {session.userId.slice(-4).toUpperCase()}
                      </div>

                      {/* Stream Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white">User {session.userId.slice(-8)}</h3>
                        <p className="text-sm text-gray-400">Started {formatTimeAgo(session.startTime)}</p>

                        {/* Stream Stats */}
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>{session.totalChunks} chunks</span>
                          <span>{session.uploadedSegments} segments</span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (navigator.share) {
                              navigator.share({
                                title: `Live Stream by User ${session.userId.slice(-8)}`,
                                url: `${window.location.origin}/watch/${session.sessionId}`,
                              });
                            }
                          }}
                          className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    {/* Watch Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`🎥 [WatchIndex] Watch button clicked for session: ${session.sessionId}`);
                        handleWatchStream(session.sessionId);
                      }}
                      className="w-full mt-4 bg-nocenaPink hover:bg-pink-600 text-white py-3 rounded-xl font-medium transition-colors duration-300"
                    >
                      Watch Stream
                    </button>

                    {/* Debug Info (only in development) */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-3 text-xs text-gray-500 bg-black/20 p-3 rounded-lg">
                        <div>Session: {session.sessionId}</div>
                        <div>Live: {session.isLive ? 'Yes' : 'No'}</div>
                        <div>Last Activity: {Math.round((Date.now() - session.lastActivity) / 1000)}s ago</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Powered by FilCDN */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-xs">
                Powered by <span className="text-nocenaPink font-bold">FilCDN</span>
              </p>
              <p className="text-gray-600 text-xs">Decentralized Streaming</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default WatchIndexPage;
