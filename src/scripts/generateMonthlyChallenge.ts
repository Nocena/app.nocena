// src/scripts/generateMonthlyChallenge.ts
import 'dotenv/config';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import webpush from 'web-push';
import axios from 'axios';
import { monthlyChallenges, ChallengeFrequency, ChallengeCategory } from '../data/challenges';
import { resetTimeBasedEarnings } from '../lib/api/dgraph';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:lustykjakub@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
);

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

interface MonthlyAIChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  createdAt: string;
  isActive: boolean;
  frequency: 'monthly';
  month: number;
  year: number;
}

// Function to get all user push subscriptions
export const getAllUserPushSubscriptions = async (): Promise<string[]> => {
  console.log('🔔 BULK: Fetching all user push subscriptions for bulk notification');

  const query = `
    query GetAllPushSubscriptions {
      queryUser {
        pushSubscription
      }
    }
  `;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.NEXT_PUBLIC_DGRAPH_API_KEY) {
    headers['X-Auth-Token'] = process.env.NEXT_PUBLIC_DGRAPH_API_KEY;
  }

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
      },
      {
        headers,
      },
    );

    if (response.data.errors) {
      console.error('🔔 BULK: GraphQL errors:', response.data.errors);
      throw new Error('Failed to fetch push subscriptions');
    }

    const users = response.data.data.queryUser || [];
    const pushSubscriptions = users
      .map((user: any) => user.pushSubscription)
      .filter((sub: string) => sub && sub.length > 0 && sub !== 'null' && sub.trim() !== '');

    console.log(
      `🔔 BULK: Found ${users.length} total users, ${pushSubscriptions.length} with valid push subscriptions`,
    );
    return pushSubscriptions;
  } catch (error) {
    console.error('🔔 BULK: Error fetching push subscriptions:', error);
    throw new Error('Failed to fetch user push subscriptions for bulk notification');
  }
};

// Function to get users with push subscriptions for cleanup tracking
const getUsersWithPushSubscriptions = async (): Promise<
  { id: string; username: string; pushSubscription: string }[]
> => {
  console.log('🔔 USERS: Fetching users with push subscriptions for detailed tracking');

  const query = `
    query GetUsersWithPushSubscriptions {
      queryUser {
        id
        username
        pushSubscription
      }
    }
  `;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.NEXT_PUBLIC_DGRAPH_API_KEY) {
    headers['X-Auth-Token'] = process.env.NEXT_PUBLIC_DGRAPH_API_KEY;
  }

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
      },
      {
        headers,
      },
    );

    if (response.data.errors) {
      console.error('🔔 USERS: GraphQL errors:', response.data.errors);
      return [];
    }

    const users = response.data.data.queryUser || [];
    const validUsers = users.filter(
      (user: any) => user.pushSubscription && user.pushSubscription.trim() !== '' && user.pushSubscription !== 'null',
    );

    console.log(`🔔 USERS: Found ${users.length} total users, ${validUsers.length} with valid push subscriptions`);
    return validUsers;
  } catch (error) {
    console.error('🔔 USERS: Error fetching users:', error);
    return [];
  }
};

class MonthlyChallengeGenerator {
  private async getRecentChallenges(): Promise<string[]> {
    if (!DGRAPH_ENDPOINT) {
      console.log('⚠️ DGRAPH_ENDPOINT not configured, skipping recent challenges check');
      return [];
    }

    const query = `
      query GetRecentMonthlyChallenges {
        queryAIChallenge(
          filter: { frequency: { eq: "monthly" } }
          order: { desc: createdAt }
          first: 10
        ) {
          title
          description
          createdAt
        }
      }
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.NEXT_PUBLIC_DGRAPH_API_KEY) {
      headers['X-Auth-Token'] = process.env.NEXT_PUBLIC_DGRAPH_API_KEY;
    }

    try {
      const response = await axios.post(
        DGRAPH_ENDPOINT,
        {
          query,
        },
        {
          headers,
        },
      );

      if (response.data.errors) {
        console.log('⚠️ Error fetching recent monthly challenges:', response.data.errors);
        return [];
      }

      const challenges = response.data.data?.queryAIChallenge || [];
      return challenges.map((c: any) => `${c.title}: ${c.description}`);
    } catch (error) {
      console.log('⚠️ Network error fetching recent monthly challenges:', error);
      return [];
    }
  }

  private async getUsedChallengeIds(): Promise<string[]> {
    if (!DGRAPH_ENDPOINT) {
      console.log('⚠️ DGRAPH_ENDPOINT not configured, skipping used challenges check');
      return [];
    }

    const query = `
      query GetUsedMonthlyChallenges {
        queryAIChallenge(
          filter: { frequency: { eq: "monthly" } }
          order: { desc: createdAt }
          first: 12
        ) {
          title
          description
        }
      }
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.NEXT_PUBLIC_DGRAPH_API_KEY) {
      headers['X-Auth-Token'] = process.env.NEXT_PUBLIC_DGRAPH_API_KEY;
    }

    try {
      const response = await axios.post(
        DGRAPH_ENDPOINT,
        {
          query,
        },
        {
          headers,
        },
      );

      if (response.data.errors) {
        console.log('⚠️ Error fetching used monthly challenges:', response.data.errors);
        return [];
      }

      const challenges = response.data.data?.queryAIChallenge || [];
      // Create unique identifiers for used challenges based on title + description
      return challenges.map((c: any) => `${c.title}:${c.description}`);
    } catch (error) {
      console.log('⚠️ Network error fetching used monthly challenges:', error);
      return [];
    }
  }

  private getMonthlyPrompt(): string {
    return `You are the producer of "HUMANS: THE ULTIMATE REALITY SHOW" - the most popular intergalactic entertainment broadcast across 47 star systems. You're scouting Earth for the most creative, fearless, and entertaining humans to feature as contestants.

    LEGENDARY CONTESTANT AUDITIONS (study these epic human performances):
    - "WANDERER TRIAL: Travel to a completely different country. Document cultural immersion and adaptation challenges"
    - "PHYSICAL MASTERY ARC: Set a major fitness goal (5K run, 50 push-ups, advanced yoga pose). Film entire transformation journey"
    - "SKILL EVOLUTION SAGA: Master a completely new skill over 30 days. Showcase progression from beginner to competent performer"
    - "FEAR CONQUEST CHALLENGE: Identify and systematically overcome a significant personal fear. Document the psychological journey"
    - "SOCIAL IMPACT MISSION: Create something that positively affects your community. Show planning, execution, and results"
    - "CREATIVE BREAKTHROUGH PROJECT: Produce an original work of art, music, writing, or invention. Share the creative process"
    - "ADVENTURE DOCUMENTARY: Plan and execute an epic adventure. Create a mini-documentary of the entire experience"

    INTERGALACTIC ENTERTAINMENT STANDARDS:
    - 30-day character development arc (full month-long journey)
    - Massive creative potential and personal expression
    - Significant challenge requiring dedication and growth
    - Highly entertaining for audiences across multiple species
    - Showcases peak human potential and resilience
    - Creates transformational before/after comparison
    - Results in epic content worthy of galactic broadcast

    CONTESTANT CATEGORIES (rotate monthly themes for maximum viewership):
    🌟 ADVENTURE SEEKERS: Travel, exploration, extreme experiences, boundary-pushing
    💪 TRANSFORMATION WARRIORS: Physical challenges, skill mastery, personal evolution
    🎨 CREATIVE GENIUSES: Artistic projects, innovation, original content creation
    😱 FEAR CONQUERORS: Phobia elimination, comfort zone obliteration, courage building
    🌍 COMMUNITY CHAMPIONS: Social impact, helping others, positive change creation
    🧠 MIND EXPANDERS: Learning intensive skills, intellectual challenges, mental growth

    SHOW REQUIREMENTS:
    - Month-long story arc with multiple episodes/updates
    - Requires significant planning, resources, or life changes
    - Documents complete transformation journey
    - Pushes humans to their creative and personal limits
    - Creates viral-worthy content that other humans want to attempt
    - Demonstrates extraordinary human capabilities for galactic audiences

    EARTH SEASON: Summer

    Target audience reaction: "I NEED to try this challenge - this could change my entire life!"

    IMPORTANT! The humans should have no idea they are in a reality show! Stay secret.

    Respond in EXACTLY this format:
    Title: [SHOW EPISODE TITLE - sounds like epic reality TV challenge]
    Description: [Month-long transformation challenge with creative and growth potential, max 250 chars]`;
  }

  private async generateMonthlyChallenge(): Promise<{ title: string; description: string }> {
    try {
      // Get recent challenges for variety
      console.log('📚 Fetching recent monthly challenges for variety...');
      const recentChallenges = await this.getRecentChallenges();

      let recentChallengesText = '';
      if (recentChallenges.length > 0) {
        recentChallengesText = `
        
RECENT REALITY SHOW EPISODES (avoid repeating these themes):
${recentChallenges.map((challenge, index) => `${index + 1}. ${challenge}`).join('\n')}

IMPORTANT: Review the recent episodes above and create something DIFFERENT for maximum viewership. 
- If recent episodes focused on adventure seekers, try transformation warriors or creative geniuses
- If recent episodes were about physical challenges, try fear conquerors or community champions  
- If recent episodes involved skill mastery, try travel adventures or social impact missions
- Rotate contestant categories to maintain galactic audience engagement across all species!`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getMonthlyPrompt() + recentChallengesText,
          },
          {
            role: 'user',
            content:
              'Generate one monthly reality show challenge. Format: Title: [episode title]\nDescription: [challenge description]',
          },
        ],
        max_tokens: 400,
        temperature: 0.9,
      });

      const content = response.choices[0]?.message?.content || '';
      const lines = content.split('\n');

      let title = '';
      let description = '';

      for (const line of lines) {
        if (line.startsWith('Title:')) {
          title = line.replace('Title:', '').trim();
        } else if (line.startsWith('Description:')) {
          description = line.replace('Description:', '').trim();
        }
      }

      if (!title || !description) {
        throw new Error('Failed to parse title and description from AI response');
      }

      return { title, description };
    } catch (error) {
      console.error('Error generating monthly challenge:', error);
      throw error;
    }
  }

  private selectMonthlyChallenge(): { title: string; description: string } {
    // Select a random challenge from the monthly challenges array
    const randomIndex = Math.floor(Math.random() * monthlyChallenges.length);
    const selectedChallenge = monthlyChallenges[randomIndex];

    console.log(`🎯 Selected challenge ${randomIndex + 1} of ${monthlyChallenges.length}: ${selectedChallenge.title}`);

    return {
      title: selectedChallenge.title,
      description: selectedChallenge.description,
    };
  }

  private async selectUnusedMonthlyChallenge(): Promise<{ title: string; description: string }> {
    try {
      // Get used challenges
      console.log('📚 Fetching used challenges to avoid repetition...');
      const usedChallengeIds = await this.getUsedChallengeIds();

      // Filter out used challenges
      const availableChallenges = monthlyChallenges.filter((challenge) => {
        const challengeId = `${challenge.title}:${challenge.description}`;
        return !usedChallengeIds.includes(challengeId);
      });

      console.log(`📊 Available challenges: ${availableChallenges.length} of ${monthlyChallenges.length} total`);

      // If no unused challenges, reset and use all challenges
      if (availableChallenges.length === 0) {
        console.log('🔄 All challenges have been used! Resetting to use full list again.');
        return this.selectMonthlyChallenge();
      }

      // Select random unused challenge
      const randomIndex = Math.floor(Math.random() * availableChallenges.length);
      const selectedChallenge = availableChallenges[randomIndex];

      console.log(`🎯 Selected unused challenge: ${selectedChallenge.title}`);

      return {
        title: selectedChallenge.title,
        description: selectedChallenge.description,
      };
    } catch (error) {
      console.error('⚠️ Error selecting unused challenge, falling back to random selection:', error);
      return this.selectMonthlyChallenge();
    }
  }

  async generateChallengeForDate(date: Date = new Date(), useAI: boolean = false): Promise<MonthlyAIChallenge> {
    let title: string;
    let description: string;

    if (useAI) {
      console.log('🤖 Using AI to generate monthly challenge...');
      const challenge = await this.generateMonthlyChallenge();
      title = challenge.title;
      description = challenge.description;
    } else {
      console.log('📚 Using predefined monthly challenge list...');
      const challenge = await this.selectUnusedMonthlyChallenge();
      title = challenge.title;
      description = challenge.description;
    }

    const challenge: MonthlyAIChallenge = {
      id: uuidv4(),
      title,
      description,
      reward: 25, // Monthly challenges reward 25 Nocenix
      createdAt: new Date().toISOString(),
      isActive: true,
      frequency: 'monthly',
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };

    return challenge;
  }

  printChallengeForDgraph(challenge: MonthlyAIChallenge): void {
    console.log('\n=== Generated Monthly AI Challenge ===');
    console.log('Dgraph Mutation Object:');
    console.log(JSON.stringify(challenge, null, 2));

    console.log('\n=== Dgraph GraphQL Mutation ===');
    console.log(`
mutation AddAIChallenge($challenge: AddAIChallengeInput!) {
  addAIChallenge(input: [$challenge]) {
    aIChallenge {
      id
      title
      description
      frequency
      reward
      createdAt
      isActive
      month
      year
    }
  }
}
    `);

    console.log('Variables:');
    console.log(JSON.stringify({ challenge }, null, 2));
  }
}

// Function to send push notifications for monthly challenges
const sendPushNotifications = async (challenge: MonthlyAIChallenge): Promise<void> => {
  console.log('🔔 Starting monthly challenge push notification process...');

  try {
    const pushSubscriptions = await getAllUserPushSubscriptions();

    if (pushSubscriptions.length === 0) {
      console.log('📱 No users with push subscriptions found');
      return;
    }

    console.log(`📱 Found ${pushSubscriptions.length} push subscriptions`);

    const payload = JSON.stringify({
      title: 'New month - new challenge',
      body: `${challenge.title}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'monthly-challenge',
      renotify: true,
      requireInteraction: true, // Monthly challenges require more attention
      vibrate: [500, 200, 500, 200, 500],
      data: {
        type: 'monthly-challenge',
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        url: '/home',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'I want to compete!',
          icon: '/icons/icon-192x192.png',
        },
        {
          action: 'dismiss',
          title: 'Maybe later...',
        },
      ],
    });

    let successCount = 0;
    let failureCount = 0;
    const invalidSubscriptions: string[] = [];

    console.log('🚀 Sending monthly challenge push notifications...');
    console.log(`📢 Message: "${challenge.title} - Your monthly transformation awaits!"`);

    const batchSize = 10;
    for (let i = 0; i < pushSubscriptions.length; i += batchSize) {
      const batch = pushSubscriptions.slice(i, i + batchSize);

      console.log(
        `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pushSubscriptions.length / batchSize)}`,
      );

      const batchPromises = batch.map(async (pushSubscription, index) => {
        try {
          const subscription = JSON.parse(pushSubscription);
          await webpush.sendNotification(subscription, payload);
          successCount++;
          console.log(`✅ Sent notification ${i + index + 1}/${pushSubscriptions.length}`);
        } catch (error: any) {
          failureCount++;
          console.error(`❌ Failed to send notification ${i + index + 1}:`, error?.message || error);

          // If the subscription is invalid (410 Gone), mark it for removal
          if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
            console.log(`🗑️ Invalid subscription detected, marking for cleanup`);
            invalidSubscriptions.push(pushSubscription);
          }
        }
      });

      await Promise.allSettled(batchPromises);

      if (i + batchSize < pushSubscriptions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n📊 Monthly challenge push notification results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📱 Total attempted: ${pushSubscriptions.length}`);
    console.log(`🗑️ Invalid subscriptions found: ${invalidSubscriptions.length}`);

    // Clean up invalid subscriptions if any found
    if (invalidSubscriptions.length > 0) {
      console.log(`\n🧹 Cleaning up ${invalidSubscriptions.length} invalid subscriptions...`);
      await cleanupInvalidSubscriptions(invalidSubscriptions);
    }

    console.log('\n🎯 Monthly challenge push notification broadcast completed!');
  } catch (error) {
    console.error('❌ Error in monthly challenge push notification process:', error);
  }
};

// Function to clean up invalid push subscriptions by subscription value
const cleanupInvalidSubscriptions = async (invalidSubscriptions: string[]): Promise<void> => {
  if (!DGRAPH_ENDPOINT || invalidSubscriptions.length === 0) {
    return;
  }

  console.log('🧹 Starting cleanup of invalid push subscriptions...');

  // Get users with these invalid subscriptions so we can update them
  const users = await getUsersWithPushSubscriptions();
  const userIdsToCleanup = users
    .filter((user) => invalidSubscriptions.includes(user.pushSubscription))
    .map((user) => user.id);

  if (userIdsToCleanup.length === 0) {
    console.log('🧹 No users found to cleanup');
    return;
  }

  const mutation = `
    mutation CleanupInvalidSubscriptions($userIds: [ID!]) {
      updateUser(
        input: {
          filter: { id: { in: $userIds } },
          set: { pushSubscription: null }
        }
      ) {
        numUids
      }
    }
  `;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.NEXT_PUBLIC_DGRAPH_API_KEY) {
    headers['X-Auth-Token'] = process.env.NEXT_PUBLIC_DGRAPH_API_KEY;
  }

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { userIds: userIdsToCleanup },
      },
      {
        headers,
      },
    );

    if (response.data.errors) {
      console.error('❌ Error cleaning up invalid subscriptions:', response.data.errors);
    } else {
      console.log(`✅ Cleaned up ${response.data.data?.updateUser?.numUids || 0} invalid subscriptions`);
    }
  } catch (error) {
    console.error('❌ Network error cleaning up subscriptions:', error);
  }
};

// Function to save the monthly challenge to Dgraph database
export const saveMonthlyChallengeToDatabase = async (challenge: MonthlyAIChallenge): Promise<boolean> => {
  if (!DGRAPH_ENDPOINT) {
    console.error('DGRAPH_ENDPOINT is not configured');
    return false;
  }

  const mutation = `
    mutation AddAIChallenge($challenge: AddAIChallengeInput!) {
      addAIChallenge(input: [$challenge]) {
        aIChallenge {
          id
          title
          description
          frequency
          reward
          createdAt
          isActive
          month
          year
        }
      }
    }
  `;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.NEXT_PUBLIC_DGRAPH_API_KEY) {
    headers['X-Auth-Token'] = process.env.NEXT_PUBLIC_DGRAPH_API_KEY;
  }

  try {
    console.log('💾 Saving monthly challenge to database...');

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { challenge },
      },
      {
        headers,
      },
    );

    if (response.data.errors) {
      console.error('❌ Dgraph mutation error:', response.data.errors);
      return false;
    }

    const savedChallenge = response.data.data?.addAIChallenge?.aIChallenge?.[0];
    if (savedChallenge) {
      console.log('✅ Monthly challenge saved successfully!');
      console.log('📝 Challenge ID:', savedChallenge.id);
      console.log('🎬 Title:', savedChallenge.title);
      return true;
    } else {
      console.error('❌ No challenge returned from mutation');
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving monthly challenge to database:', error);
    return false;
  }
};

// Main execution
async function main() {
  const generator = new MonthlyChallengeGenerator();

  try {
    // You can change this flag to switch between AI generation and predefined challenges
    const useAI = false; // Set to true to use OpenAI, false to use predefined challenges

    console.log('🚀 Starting Monthly Challenge Process...\n');

    // Step 1: Reset monthly earnings for all users
    console.log('💰 Resetting monthly earnings counters for all users...');
    try {
      await resetTimeBasedEarnings('monthly');
      console.log('✅ Monthly earnings reset completed successfully!\n');
    } catch (error) {
      console.error('❌ Failed to reset monthly earnings:', error);
      console.log('⚠️ Continuing with challenge generation despite earnings reset failure...\n');
    }

    // Step 2: Generate and process the monthly challenge
    console.log('🎬 Generating Monthly AI Challenge...');
    console.log(`📚 Total monthly challenges available: ${monthlyChallenges.length}`);
    console.log(`🤖 Using ${useAI ? 'AI generation' : 'predefined challenges'}\n`);

    const monthlyChallenge = await generator.generateChallengeForDate(new Date(), useAI);
    generator.printChallengeForDgraph(monthlyChallenge);

    // Step 3: Save to database
    console.log('\n💾 Saving challenge to database...');
    const saved = await saveMonthlyChallengeToDatabase(monthlyChallenge);

    if (saved) {
      console.log('\n✅ Monthly challenge generated and saved successfully!');

      // Step 4: Send push notifications
      console.log('\n🔔 Sending push notifications to users...');
      await sendPushNotifications(monthlyChallenge);

      console.log('\n🎉 Monthly challenge process completed successfully!');
      console.log('\n📋 Summary:');
      console.log('   ✅ Monthly earnings reset');
      console.log('   ✅ Challenge generated');
      console.log('   ✅ Challenge saved to database');
      console.log('   ✅ Push notifications sent');
    } else {
      console.log('\n⚠️ Challenge generated but failed to save to database');
      console.log('You can manually save using the mutation above');
    }
  } catch (error) {
    console.error('❌ Error in monthly challenge process:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { MonthlyChallengeGenerator };
export type { MonthlyAIChallenge };
