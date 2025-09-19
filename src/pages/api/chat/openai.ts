// pages/api/chat/openai.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

interface TTSRequest {
  text: string;
  voice?: 'nova' | 'shimmer' | 'echo' | 'fable' | 'onyx' | 'alloy';
  model?: 'tts-1' | 'tts-1-hd';
  speed?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key not configured');
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    // Check if this is a TTS request (has 'text' field) or chat request (has 'messages' field)
    if ('text' in req.body) {
      // Handle TTS request
      return await handleTTS(req, res, apiKey);
    } else if ('messages' in req.body) {
      // Handle chat completion request
      return await handleChat(req, res, apiKey);
    } else {
      return res.status(400).json({ error: 'Invalid request format' });
    }
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleChat(req: NextApiRequest, res: NextApiResponse, apiKey: string) {
  const { messages }: ChatRequest = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Validate message format
  for (const message of messages) {
    if (!message.role || !message.content || !['system', 'user', 'assistant'].includes(message.role)) {
      return res.status(400).json({ error: 'Invalid message format' });
    }
  }

  try {
    console.log('Sending chat completion request with', messages.length, 'messages');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use a faster, cheaper model for real-time chat
        messages: messages,
        max_tokens: 150, // Keep responses short for voice conversation
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Chat API error:', response.status, errorText);
      return res.status(500).json({ error: 'Chat completion failed' });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;

    if (!message) {
      console.error('No message in OpenAI response:', data);
      return res.status(500).json({ error: 'No response from AI' });
    }

    console.log('Chat completion successful, response length:', message.length);
    return res.status(200).json({ message });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleTTS(req: NextApiRequest, res: NextApiResponse, apiKey: string) {
  const { text, voice = 'nova', model = 'tts-1', speed = 1.0 }: TTSRequest = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (text.length > 4096) {
    return res.status(400).json({ error: 'Text too long (max 4096 characters)' });
  }

  try {
    console.log('Generating TTS for:', text.substring(0, 100) + '...');

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        speed,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', response.status, errorText);
      return res.status(500).json({ error: 'TTS generation failed' });
    }

    // Get the audio data as array buffer
    const audioBuffer = await response.arrayBuffer();

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Send the audio data
    console.log('TTS generation successful, audio size:', audioBuffer.byteLength);
    return res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
