// pages/api/chat/get-predefined.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Challenge {
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  category: string;
  day: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pathType } = req.body;

  if (!pathType || !['winter-arc', 'daily-side-quest'].includes(pathType)) {
    return res.status(400).json({ error: 'Valid pathType is required (winter-arc, daily-side-quest)' });
  }

  try {
    // Load the appropriate JSON file based on pathType
    const challengesPath = join(process.cwd(), 'src', 'data', 'challenges', `${pathType}.json`);

    let challengesData: Challenge[];

    try {
      const fileContent = readFileSync(challengesPath, 'utf8');
      challengesData = JSON.parse(fileContent);
    } catch (fileError) {
      console.error(`Failed to load ${pathType} challenges file:`, fileError);

      // Fallback: return sample challenges if file doesn't exist
      challengesData = generateFallbackChallenges(pathType);
    }

    // Validate and format the challenges
    const formattedChallenges = challengesData.map((challenge, index) => ({
      title: challenge.title || `Challenge ${index + 1}`,
      description: challenge.description || 'Complete this challenge to progress.',
      difficulty: challenge.difficulty || 'Beginner',
      estimatedTime: challenge.estimatedTime || '15-30 minutes',
      category: challenge.category || 'Practice',
      day: challenge.day || index + 1,
    }));

    res.status(200).json({
      challenges: formattedChallenges,
      pathType: pathType,
      totalCount: formattedChallenges.length,
    });
  } catch (error) {
    console.error('Error loading predefined challenges:', error);
    res.status(500).json({
      error: 'Failed to load challenges',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Fallback challenges if JSON files don't exist yet
function generateFallbackChallenges(pathType: string): Challenge[] {
  const winterArcChallenges: Challenge[] = [
    {
      title: 'Wake up at 6 AM',
      description: 'Start your day early to maximize productivity and establish discipline.',
      difficulty: 'Beginner',
      estimatedTime: 'Instant',
      category: 'Discipline',
      day: 1,
    },
    {
      title: 'Cold shower for 2 minutes',
      description: 'Build mental toughness with a cold shower. Start with 30 seconds if needed.',
      difficulty: 'Intermediate',
      estimatedTime: '2 minutes',
      category: 'Physical',
      day: 2,
    },
    {
      title: 'Read for 30 minutes',
      description: 'Expand your knowledge by reading something educational or inspiring.',
      difficulty: 'Beginner',
      estimatedTime: '30 minutes',
      category: 'Learning',
      day: 3,
    },
  ];

  const sideQuestChallenges: Challenge[] = [
    {
      title: 'Send a funny meme to a friend',
      description: "Brighten someone's day by sharing a meme that made you laugh.",
      difficulty: 'Beginner',
      estimatedTime: '5 minutes',
      category: 'Social',
      day: 1,
    },
    {
      title: 'Take a selfie in an unusual location',
      description: 'Find somewhere interesting and snap a creative selfie to share.',
      difficulty: 'Beginner',
      estimatedTime: '10 minutes',
      category: 'Creative',
      day: 2,
    },
    {
      title: 'Try a new coffee shop or restaurant',
      description: 'Explore your local area and discover a new favorite spot.',
      difficulty: 'Beginner',
      estimatedTime: '30 minutes',
      category: 'Social',
      day: 3,
    },
  ];

  // Generate 100 challenges by repeating and varying the base challenges
  const baseChallenges = pathType === 'winter-arc' ? winterArcChallenges : sideQuestChallenges;
  const challenges: Challenge[] = [];

  for (let day = 1; day <= 100; day++) {
    const baseChallenge = baseChallenges[(day - 1) % baseChallenges.length];
    challenges.push({
      ...baseChallenge,
      title: `${baseChallenge.title} (Day ${day})`,
      day: day,
    });
  }

  return challenges;
}

/*
File structure you'll need to create:

src/data/challenges/winter-arc.json:
[
  {
    "title": "Wake up at 6 AM",
    "description": "Start your day early to maximize productivity and establish discipline.",
    "difficulty": "Beginner",
    "estimatedTime": "Instant",
    "category": "Discipline",
    "day": 1
  },
  {
    "title": "Cold shower for 2 minutes", 
    "description": "Build mental toughness with a cold shower. Start with 30 seconds if needed.",
    "difficulty": "Intermediate",
    "estimatedTime": "2 minutes",
    "category": "Physical",
    "day": 2
  },
  ... (up to 100 challenges)
]

src/data/challenges/daily-side-quest.json:
[
  {
    "title": "Send a funny meme to a friend",
    "description": "Brighten someone's day by sharing a meme that made you laugh.",
    "difficulty": "Beginner", 
    "estimatedTime": "5 minutes",
    "category": "Social",
    "day": 1
  },
  ... (up to 100 challenges)
]
*/
