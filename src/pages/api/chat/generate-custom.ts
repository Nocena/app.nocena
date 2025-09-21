// pages/api/chat/generate-custom.ts

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Challenge {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  category: string;
  day: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { goal, count = 30 } = req.body;

  if (!goal || typeof goal !== 'string') {
    return res.status(400).json({ error: 'Goal is required and must be a string' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  // Limit count to prevent token overflow
  const limitedCount = Math.min(count, 50);

  try {
    const prompt = `Create ${limitedCount} daily challenges to help someone achieve this goal: "${goal}"

Please generate a comprehensive program with challenges that progressively build skills and habits. Structure each challenge as a JSON object with these fields:
- title: Brief, motivating title (max 50 characters)
- description: Clear, actionable description (max 150 characters)  
- estimatedTime: Time needed like "10-15 minutes", "30 minutes", "1 hour" (but remember each will be proven with a 30s video proof)
- category: Category like "Practice", "Learning", "Physical", "Mental", "Social", "Creative"
- day: Day number (1-${limitedCount})

Make the challenges:
1. Progressive - start easy, gradually increase difficulty
2. Varied - mix different types of activities 
3. Specific and actionable
4. Achievable in the given timeframe
5. Directly related to the goal

Return ONLY a valid JSON array of ${limitedCount} challenge objects, no other text.

Remember that you want to be creative - so for example with the guitar learning, you don't want to only give the user practice lessons everyday but give them fun and engaging tasks related to guitar maybe like some finger game to focus on finger mobility for one day or a for them to create a video of them playing air guitar in front of fans for them to have fun while learning.

Example format:
[
  {
    "title": "Learn 5 Basic Guitar Chords",
    "description": "Practice C, G, Am, F, and D chords for 15 minutes. Focus on clean finger placement. Submit final video proof of your progress.",
    "difficulty": "Beginner", 
    "estimatedTime": "15 minutes",
    "category": "Practice",
    "day": 1
  }
]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for better reliability and speed
      messages: [
        {
          role: 'system',
          content:
            'You are an expert coach and curriculum designer. You create progressive, achievable challenge programs that help people reach their goals. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: Math.min(8000, limitedCount * 120), // Dynamic token limit to prevent truncation
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI response length:', response.length);
    console.log('Response preview:', response.substring(0, 200) + '...' + response.substring(response.length - 200));

    // Try to parse the JSON response
    let challenges: Challenge[];
    try {
      challenges = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Full response:', response);

      // Fallback: try to extract JSON from response if it has extra text
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          challenges = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Second parse attempt failed:', secondParseError);

          // Try to fix truncated JSON
          let fixedJson = jsonMatch[0];

          // If it doesn't end with ], try to close it properly
          if (!fixedJson.trim().endsWith(']')) {
            // Find the last complete object
            const lastCompleteObject = fixedJson.lastIndexOf('}');
            if (lastCompleteObject > 0) {
              fixedJson = fixedJson.substring(0, lastCompleteObject + 1) + ']';
            }
          }

          // Remove trailing commas before closing brackets
          fixedJson = fixedJson.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');

          try {
            challenges = JSON.parse(fixedJson);
          } catch (finalParseError) {
            throw new Error('Invalid JSON response from OpenAI - could not fix automatically');
          }
        }
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    // Validate the response structure
    if (!Array.isArray(challenges) || challenges.length === 0) {
      throw new Error('Invalid challenges format');
    }

    // Ensure we have the right number of challenges
    if (challenges.length < limitedCount) {
      console.warn(`Generated ${challenges.length} challenges instead of ${limitedCount}`);
    }

    // Validate each challenge has required fields
    const validatedChallenges = challenges.slice(0, limitedCount).map((challenge, index) => ({
      title: challenge.title || `Challenge ${index + 1}`,
      description: challenge.description || 'Complete this challenge to progress toward your goal.',
      difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(challenge.difficulty)
        ? challenge.difficulty
        : 'Beginner',
      estimatedTime: challenge.estimatedTime || '15-30 minutes',
      category: challenge.category || 'Practice',
      day: challenge.day || index + 1,
    }));

    res.status(200).json({
      challenges: validatedChallenges,
      goal: goal,
      totalCount: validatedChallenges.length,
    });
  } catch (error) {
    console.error('Error generating challenges:', error);

    // Return a structured error response
    if (error instanceof Error) {
      res.status(500).json({
        error: 'Failed to generate challenges',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Failed to generate challenges',
        details: 'Unknown error occurred',
      });
    }
  }
}
