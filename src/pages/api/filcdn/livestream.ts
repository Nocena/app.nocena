// pages/api/filcdn/livestream.ts - IMPROVED WITH BETTER SESSION CLEANUP
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Session persistence to survive Next.js hot reloads
const SESSION_FILE = path.join(process.cwd(), '.sessions.json');

interface StreamSession {
  sessionId: string;
  userId: string;
  startTime: number;
  lastActivity: number;
  isLive: boolean;
  chunks: ChunkData[];
  uploadedSegments: number;
  endTime?: number; // Track when stream ended
}

interface ChunkData {
  index: number;
  timestamp: number;
  size: number;
  buffer: Buffer;
  url?: string;
}

// Load sessions from file on startup
let activeSessions: { [sessionId: string]: StreamSession } = {};

const loadSessions = () => {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = fs.readFileSync(SESSION_FILE, 'utf8');
      const parsed = JSON.parse(data);

      // Convert buffer data back to Buffer objects
      Object.keys(parsed).forEach((sessionId) => {
        const session = parsed[sessionId];
        if (session.chunks) {
          session.chunks = session.chunks.map((chunk: any) => ({
            ...chunk,
            buffer: Buffer.from(chunk.buffer?.data || [], 'utf8'),
          }));
        }
      });

      activeSessions = parsed;
      console.log(`📂 Loaded ${Object.keys(activeSessions).length} sessions from file`);
    }
  } catch (error) {
    console.log('📂 No existing sessions file, starting fresh');
    activeSessions = {};
  }
};

const saveSessions = () => {
  try {
    // Convert Buffer objects to serializable format
    const serializable = JSON.parse(JSON.stringify(activeSessions));
    fs.writeFileSync(SESSION_FILE, JSON.stringify(serializable, null, 2));
    console.log(`💾 Saved ${Object.keys(activeSessions).length} sessions to file`);
  } catch (error) {
    console.error('❌ Failed to save sessions:', error);
  }
};

// Load sessions on module initialization
loadSessions();

// Generate HLS manifest
const generateManifest = (sessionId: string): string => {
  const session = activeSessions[sessionId];
  if (!session) {
    console.error(`❌ Session not found for manifest: ${sessionId}`);
    return '';
  }

  console.log(`📄 Generating manifest for session ${sessionId} with ${session.chunks.length} chunks`);

  // Get chunks with URLs (uploaded segments)
  const chunksWithUrls = session.chunks.filter((chunk) => chunk.url);
  console.log(`📄 Found ${chunksWithUrls.length} chunks with URLs`);

  if (chunksWithUrls.length === 0) {
    console.log(`⚠️ No segments available yet for session ${sessionId}`);
    return `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:5
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT
`;
  }

  // Group chunks into 5-second segments (50 chunks per segment at 100ms each)
  const segmentSize = 50;
  const segments: ChunkData[][] = [];

  for (let i = 0; i < chunksWithUrls.length; i += segmentSize) {
    const segmentChunks = chunksWithUrls.slice(i, i + segmentSize);
    if (segmentChunks.length > 0) {
      segments.push(segmentChunks);
    }
  }

  console.log(`📄 Created ${segments.length} segments from chunks`);

  let manifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:5
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT
`;

  segments.forEach((segmentChunks, index) => {
    // Use the URL from the first chunk of each segment
    const segmentUrl = segmentChunks[0].url;
    const duration = (segmentChunks.length * 0.1).toFixed(1); // 0.1s per chunk

    manifest += `#EXTINF:${duration},\n${segmentUrl}\n`;
  });

  // If stream is not live, add end tag
  if (!session.isLive) {
    manifest += '#EXT-X-ENDLIST\n';
  }

  console.log(`📄 Generated manifest with ${segments.length} segments`);
  return manifest;
};

// Enhanced cleanup function
const cleanupSessions = () => {
  const now = Date.now();
  const inactiveThreshold = 10 * 60 * 1000; // 10 minutes for ended streams
  const liveInactiveThreshold = 2 * 60 * 1000; // 2 minutes for live streams with no activity
  let cleanedCount = 0;

  console.log(`🧹 Starting session cleanup...`);

  Object.keys(activeSessions).forEach((sessionId) => {
    const session = activeSessions[sessionId];
    const timeSinceActivity = now - session.lastActivity;
    const timeSinceEnd = session.endTime ? now - session.endTime : 0;

    let shouldCleanup = false;
    let reason = '';

    if (!session.isLive && session.endTime && timeSinceEnd > inactiveThreshold) {
      // Clean up ended streams after 10 minutes
      shouldCleanup = true;
      reason = `ended ${Math.round(timeSinceEnd / 1000)}s ago`;
    } else if (session.isLive && timeSinceActivity > liveInactiveThreshold) {
      // Clean up live streams with no activity for 2 minutes
      shouldCleanup = true;
      reason = `live but inactive for ${Math.round(timeSinceActivity / 1000)}s`;

      // Mark as ended before cleanup
      session.isLive = false;
      session.endTime = now;
    }

    if (shouldCleanup) {
      console.log(`🧹 Cleaning up session: ${sessionId} (${reason})`);
      delete activeSessions[sessionId];
      cleanedCount++;
    } else {
      console.log(
        `✅ Keeping session: ${sessionId} (live: ${session.isLive}, lastActivity: ${Math.round(timeSinceActivity / 1000)}s ago)`,
      );
    }
  });

  if (cleanedCount > 0) {
    saveSessions();
    console.log(`🧹 Cleaned up ${cleanedCount} sessions`);
  } else {
    console.log(`🧹 No sessions needed cleanup`);
  }
};

// Run cleanup every 1 minute
setInterval(cleanupSessions, 60 * 1000);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Handle manifest requests
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Session ID required' });
    }

    console.log(`📄 Manifest request for session: ${sessionId}`);

    if (!activeSessions[sessionId]) {
      console.error(`❌ Session not found for manifest: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    const manifest = generateManifest(sessionId);

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    return res.status(200).send(manifest);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const action = Array.isArray(fields.action) ? fields.action[0] : fields.action;

    console.log(`🎬 FilCDN API action: ${action}`);

    switch (action) {
      case 'start': {
        const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;
        const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;

        if (!sessionId || !userId) {
          return res.status(400).json({
            success: false,
            error: 'Session ID and User ID are required',
          });
        }

        console.log(`🎬 Starting FilCDN stream session: ${sessionId}`);

        // Check if user already has an active session and end it
        const existingUserSessions = Object.values(activeSessions).filter(
          (session) => session.userId === userId && session.isLive,
        );

        if (existingUserSessions.length > 0) {
          console.log(`🔄 User ${userId} has ${existingUserSessions.length} existing active sessions, ending them...`);
          existingUserSessions.forEach((session) => {
            console.log(`🏁 Auto-ending previous session: ${session.sessionId}`);
            session.isLive = false;
            session.endTime = Date.now();
          });
        }

        const session: StreamSession = {
          sessionId,
          userId,
          startTime: Date.now(),
          lastActivity: Date.now(),
          isLive: true,
          chunks: [],
          uploadedSegments: 0,
        };

        activeSessions[sessionId] = session;
        saveSessions(); // Persist immediately

        console.log(`✅ FilCDN stream session created: ${sessionId}`);

        return res.status(200).json({
          success: true,
          streamId: `stream_${Date.now()}_${sessionId}`,
          sessionId,
          proofSetId: '436', // Mock
          storageProvider: '0xe9bc394383B67aBcEbe86FD9843F53d8B4a2E981', // Mock
          message: 'Livestream started successfully',
        });
      }

      case 'chunk': {
        const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;
        const timestamp = Array.isArray(fields.timestamp) ? fields.timestamp[0] : fields.timestamp;
        const chunkFile = Array.isArray(files.chunk) ? files.chunk[0] : files.chunk;

        if (!sessionId || !chunkFile) {
          return res.status(400).json({
            success: false,
            error: 'Session ID and chunk file are required',
          });
        }

        const session = activeSessions[sessionId];
        if (!session || !session.isLive) {
          console.error(`❌ Session not found or not live: ${sessionId}`);
          return res.status(404).json({
            success: false,
            error: 'Stream session not found or not live',
          });
        }

        // Update lastActivity on every chunk
        session.lastActivity = Date.now();
        console.log(`🔄 Updated lastActivity for session ${sessionId}`);

        console.log(`📦 Received chunk ${session.chunks.length} for stream ${sessionId}: ${chunkFile.size} bytes`);

        // Read chunk data
        const chunkBuffer = fs.readFileSync(chunkFile.filepath);

        const chunkData: ChunkData = {
          index: session.chunks.length,
          timestamp: parseInt(timestamp as string) || Date.now(),
          size: chunkFile.size,
          buffer: chunkBuffer,
          // Mock FilCDN URL - in real implementation this would be from actual upload
          url: `https://0xe9bc394383B67aBcEbe86FD9843F53d8B4a2E981.calibration.filcdn.io/mock_${sessionId}_${session.chunks.length}`,
        };

        session.chunks.push(chunkData);

        // FIXED: Better buffer management
        const bufferSize = 50;
        const currentBufferSize = session.chunks.length % bufferSize;
        const completedSegments = Math.floor(session.chunks.length / bufferSize);

        console.log(`📊 Buffer status: ${currentBufferSize}/${bufferSize} chunks`);

        // FIXED: When buffer is full (reaches 50), immediately mark as uploaded segment
        if (currentBufferSize === 0 && session.chunks.length >= bufferSize) {
          const segmentIndex = completedSegments - 1;
          session.uploadedSegments = completedSegments; // Update to actual completed segments
          console.log(`📤 Buffer full, triggering upload for segment ${segmentIndex}`);
          console.log(`✅ Segment ${segmentIndex} ready for streaming`);

          // In real implementation, this is where you'd upload to FilCDN
          console.log(`🔄 Uploading segment ${segmentIndex} to FilCDN`);
          console.log(`✅ FilCDN upload complete for segment ${segmentIndex}`);
        }

        // Save sessions every 10 chunks to avoid too frequent writes
        if (session.chunks.length % 10 === 0) {
          saveSessions();
        }

        const streamDuration = Date.now() - session.startTime;

        // FIXED: Return correct buffer size and segment count
        return res.status(200).json({
          success: true,
          chunkIndex: chunkData.index,
          totalChunks: session.chunks.length,
          bufferSize: currentBufferSize, // 0-49, resets to 0 when segment completes
          streamDuration,
          uploadedSegments: session.uploadedSegments,
          completedSegments: completedSegments, // Total completed 50-chunk segments
        });
      }

      case 'status': {
        const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;

        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: 'Session ID is required',
          });
        }

        const session = activeSessions[sessionId];
        if (!session) {
          return res.status(404).json({
            success: false,
            error: 'Session not found',
          });
        }

        // Update lastActivity on status check (but only if still live)
        if (session.isLive) {
          session.lastActivity = Date.now();
        }

        const streamDuration = Date.now() - session.startTime;

        return res.status(200).json({
          success: true,
          status: {
            sessionId: session.sessionId,
            isLive: session.isLive,
            totalChunks: session.chunks.length,
            uploadedSegments: session.uploadedSegments,
            bufferSize: session.chunks.length % 50,
            duration: streamDuration,
            startTime: session.startTime,
            lastActivity: session.lastActivity,
            endTime: session.endTime,
            proofSetId: '436',
            storageProvider: '0xe9bc394383B67aBcEbe86FD9843F53d8B4a2E981',
          },
        });
      }

      case 'heartbeat': {
        const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;

        if (!sessionId || !activeSessions[sessionId]) {
          return res.status(404).json({
            success: false,
            error: 'Session not found',
          });
        }

        const session = activeSessions[sessionId];

        // Only update lastActivity if session is still live
        if (session.isLive) {
          session.lastActivity = Date.now();
          saveSessions();

          console.log(`💓 Heartbeat received for live session ${sessionId}`);

          return res.status(200).json({
            success: true,
            message: 'Heartbeat received',
            sessionId: sessionId,
            lastActivity: session.lastActivity,
            isLive: session.isLive,
          });
        } else {
          console.log(`💓 Heartbeat received for ended session ${sessionId}`);
          return res.status(200).json({
            success: true,
            message: 'Session has ended',
            sessionId: sessionId,
            isLive: false,
          });
        }
      }

      case 'end': {
        const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;

        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: 'Session ID is required',
          });
        }

        const session = activeSessions[sessionId];
        if (!session) {
          return res.status(404).json({
            success: false,
            error: 'Session not found',
          });
        }

        console.log(`🏁 Ending FilCDN stream session: ${sessionId}`);

        // Mark as not live and set end time
        session.isLive = false;
        session.endTime = Date.now();
        session.lastActivity = Date.now();
        saveSessions(); // Persist the end state immediately

        const streamDuration = Date.now() - session.startTime;

        console.log(
          `🏁 Stream ended: ${sessionId}, Total chunks: ${session.chunks.length}, Duration: ${streamDuration}ms`,
        );

        return res.status(200).json({
          success: true,
          message: 'Stream ended successfully',
          sessionId,
          totalChunks: session.chunks.length,
          uploadedSegments: session.uploadedSegments,
          duration: streamDuration,
          endTime: session.endTime,
        });
      }

      case 'list_active_sessions': {
        // Only return truly live sessions (not ended ones)
        const activeSessionsList = Object.values(activeSessions)
          .filter((session) => session.isLive && !session.endTime)
          .map((session) => ({
            sessionId: session.sessionId,
            userId: session.userId,
            startTime: session.startTime,
            duration: Date.now() - session.startTime,
            totalChunks: session.chunks.length,
            uploadedSegments: session.uploadedSegments,
            isLive: session.isLive,
            lastActivity: session.lastActivity,
            proofSetId: '436',
            storageProvider: '0xe9bc394383B67aBcEbe86FD9843F53d8B4a2E981',
          }));

        console.log(
          `📋 Returning ${activeSessionsList.length} active sessions out of ${Object.keys(activeSessions).length} total sessions`,
        );

        return res.status(200).json({
          success: true,
          sessions: activeSessionsList,
        });
      }

      case 'manifest': {
        const sessionId = Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId;

        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: 'Session ID is required',
          });
        }

        console.log(`📄 Generating manifest for session: ${sessionId}`);

        if (!activeSessions[sessionId]) {
          return res.status(404).json({
            success: false,
            error: 'Session not found',
          });
        }

        const manifest = generateManifest(sessionId);

        return res.status(200).json({
          success: true,
          manifest,
          sessionId,
        });
      }

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
        });
    }
  } catch (error) {
    console.error('❌ FilCDN API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
