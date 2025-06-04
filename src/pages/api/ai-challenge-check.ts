// src/pages/api/ai-challenge-check.ts

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

interface AIChallengeResponse {
  success: boolean;
  score: number; // 0-100
  explanation: string;
  confidence: number; // 0-1
  error?: string;
  framesAnalyzed?: number;
}

interface RequestBody {
  challengeDescription: string;
  frames: string[]; // Base64 encoded frames
  frameCount: number;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Create GPT-4 Vision messages from base64 frames
 */
function createVisionMessages(frames: string[], challengeDescription: string) {
  const systemPrompt = `You are an AI judge evaluating whether a user completed a challenge correctly and creatively by analyzing video frames from their submission.

Scoring Guidelines:
0-20: Nothing related to the challenge / No attempt visible / Completely wrong activity
20-40: Some activity visible but doesn't match the challenge requirements  
40-60: Challenge requirements met but execution is basic, boring, or lacks engagement
60-80: Challenge completed well with some creativity, effort, and human-like fun
80-100: Excellent completion - creative, engaging, fun, possibly with personal flair

Analysis Focus:
- Examine the sequence of frames to understand the complete action/story
- Assess if the specific challenge requirements were met
- Evaluate creativity, effort, and engagement level
- Consider if the execution feels authentic and human-like
- Look for signs of fun, personality, or creative interpretation
- Pay attention to progression and change between frames

Be fair but encouraging. Users should feel motivated to participate more.`;

  const userPrompt = `Challenge: "${challengeDescription}"

I'm providing you with ${frames.length} frames extracted from a video submission showing the user's attempt at completing this challenge. The frames are in chronological order.

Please analyze these frames as a sequence and evaluate:
1. Did the user actually complete the challenge as described?
2. How creative, fun, and engaging was their approach?
3. Does the execution feel authentic and human-like?
4. What's the overall quality and effort level?
5. Is there progression/story visible across the frames?

Respond with ONLY a JSON object in this exact format:
{
  "score": [number from 0-100],
  "explanation": "[2-3 sentences explaining your scoring reasoning]",
  "completed": [true/false],
  "creativity": [number from 0-10],
  "authenticity": [number from 0-10],
  "effort": [number from 0-10]
}`;

  // Create the messages array
  const messages: any[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: userPrompt,
        },
        // Add all frames
        ...frames.map((frameBase64, index) => ({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${frameBase64}`,
            detail: 'low', // Use "low" to save tokens, "high" for better analysis
          },
        })),
      ],
    },
  ];

  return messages;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.group('🤖 AI CHALLENGE CHECK API');

  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody: RequestBody = req.body;
    const { challengeDescription, frames, frameCount } = requestBody;

    // Validate required fields
    if (!challengeDescription) {
      throw new Error('Challenge description is required');
    }

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      throw new Error('No valid frames provided');
    }

    if (frameCount !== frames.length) {
      console.warn(`⚠️ Frame count mismatch: expected ${frameCount}, got ${frames.length}`);
    }

    console.log('📋 Request details:', {
      challenge: challengeDescription.substring(0, 100) + (challengeDescription.length > 100 ? '...' : ''),
      frameCount: frames.length,
      avgFrameSize: `${(frames.reduce((sum, f) => sum + f.length, 0) / frames.length / 1024).toFixed(1)}KB`,
      totalDataSize: `${(frames.reduce((sum, f) => sum + f.length, 0) / 1024 / 1024).toFixed(2)}MB`,
    });

    // Validate frame count (OpenAI has token limits)
    if (frames.length > 25) {
      console.log(`⚠️ Too many frames (${frames.length}), reducing to 20`);
      // Keep frames evenly spaced
      const step = Math.floor(frames.length / 20);
      const reducedFrames = frames.filter((_, index) => index % step === 0).slice(0, 20);
      console.log(`📉 Reduced from ${frames.length} to ${reducedFrames.length} frames`);
      frames.splice(0, frames.length, ...reducedFrames);
    }

    // Validate base64 format of frames
    const validFrames = frames.filter((frame) => {
      try {
        // Basic validation - check if it's valid base64
        atob(frame.substring(0, 100)); // Test decode first 100 chars
        return frame.length > 1000; // Reasonable minimum size
      } catch {
        return false;
      }
    });

    if (validFrames.length === 0) {
      throw new Error('No valid base64 frames found');
    }

    if (validFrames.length < frames.length) {
      console.warn(`⚠️ Some frames were invalid. Using ${validFrames.length}/${frames.length} frames`);
    }

    // Create vision messages
    const messages = createVisionMessages(validFrames, challengeDescription);

    console.log('🧠 Sending to OpenAI GPT-4 Vision...');
    console.log(`📊 Analysis payload: ${validFrames.length} frames`);

    // Call OpenAI GPT-4 Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Latest model with vision capabilities
      messages: messages,
      max_tokens: 600,
      temperature: 0.2, // Lower temperature for more consistent scoring
      response_format: { type: 'json_object' }, // Force JSON response
    });

    const aiResponse = response.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    console.log('📥 Raw AI response:', aiResponse);

    // Parse AI response
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
    } catch (error) {
      console.error('❌ Failed to parse AI response as JSON:', aiResponse);
      throw new Error('AI returned invalid JSON response');
    }

    // Validate and normalize the response
    const score = Math.max(0, Math.min(100, analysisResult.score || 0));
    const explanation = analysisResult.explanation || 'AI analysis completed';
    const completed = analysisResult.completed || false;
    const creativity = Math.max(0, Math.min(10, analysisResult.creativity || 0));
    const authenticity = Math.max(0, Math.min(10, analysisResult.authenticity || 0));
    const effort = Math.max(0, Math.min(10, analysisResult.effort || 0));

    // Calculate confidence based on various factors
    const confidence = Math.min(
      1.0,
      ((creativity + authenticity + effort) / 30) * 0.4 + // Quality factors (40%)
        (score / 100) * 0.4 + // Score factor (40%)
        (validFrames.length / 20) * 0.2, // Frame count factor (20%)
    );

    const result: AIChallengeResponse = {
      success: true,
      score,
      explanation: `${explanation} (Creativity: ${creativity}/10, Authenticity: ${authenticity}/10, Effort: ${effort}/10)`,
      confidence,
      framesAnalyzed: validFrames.length,
    };

    console.log('✅ AI evaluation completed:', {
      score: `${score}/100`,
      completed,
      confidence: `${Math.round(confidence * 100)}%`,
      creativity: `${creativity}/10`,
      authenticity: `${authenticity}/10`,
      effort: `${effort}/10`,
      framesAnalyzed: validFrames.length,
      tokensUsed: response.usage?.total_tokens || 'unknown',
    });

    console.groupEnd();

    return res.status(200).json(result);
  } catch (error) {
    console.error('💥 AI challenge check failed:', error);
    console.groupEnd();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific OpenAI errors
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      return res.status(500).json({
        success: false,
        score: 0,
        explanation: 'AI service temporarily unavailable (configuration issue)',
        confidence: 0,
        error: 'API_KEY_ERROR',
      });
    }

    if (errorMessage.includes('tokens') || errorMessage.includes('limit') || errorMessage.includes('too large')) {
      return res.status(400).json({
        success: false,
        score: 0,
        explanation: 'Video too complex for AI analysis (try shorter video or fewer frames)',
        confidence: 0,
        error: 'TOKEN_LIMIT_ERROR',
      });
    }

    if (errorMessage.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        score: 0,
        explanation: 'AI service temporarily busy, please try again',
        confidence: 0,
        error: 'RATE_LIMIT_ERROR',
      });
    }

    return res.status(500).json({
      success: false,
      score: 0,
      explanation: `AI evaluation failed: ${errorMessage}`,
      confidence: 0,
      error: errorMessage,
    });
  }
}
