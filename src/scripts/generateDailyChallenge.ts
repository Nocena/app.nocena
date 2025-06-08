import 'dotenv/config';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import webpush from 'web-push';
import axios from 'axios';

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

interface AIChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  createdAt: string;
  isActive: boolean;
  frequency: 'daily';
  day: number;
  year: number;
}

// NEW: Optimized function to get all user push subscriptions
export const getAllUserPushSubscriptions = async (): Promise<string[]> => {
  console.log('🔔 BULK: Fetching all user push subscriptions for bulk notification');

  // Since pushSubscription is @search(by: [exact]), we can't use regexp
  // Instead, we'll get all users and filter client-side for those with push subscriptions
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
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
    }, {
      headers,
    });

    console.log('🔔 BULK: Push subscriptions query response status:', response.status);

    if (response.data.errors) {
      console.error('🔔 BULK: GraphQL errors:', response.data.errors);
      throw new Error('Failed to fetch push subscriptions');
    }

    const users = response.data.data.queryUser || [];
    const pushSubscriptions = users
      .map((user: any) => user.pushSubscription)
      .filter((sub: string) => sub && sub.length > 0 && sub !== 'null' && sub.trim() !== ''); // Filter out any null/empty subscriptions

    console.log(`🔔 BULK: Found ${users.length} total users, ${pushSubscriptions.length} with valid push subscriptions`);
    return pushSubscriptions;
  } catch (error) {
    console.error('🔔 BULK: Error fetching push subscriptions:', error);
    throw new Error('Failed to fetch user push subscriptions for bulk notification');
  }
};

// NEW: Function to get users with push subscriptions for cleanup tracking
const getUsersWithPushSubscriptions = async (): Promise<{ id: string; username: string; pushSubscription: string }[]> => {
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
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
    }, {
      headers,
    });

    if (response.data.errors) {
      console.error('🔔 USERS: GraphQL errors:', response.data.errors);
      return [];
    }

    const users = response.data.data.queryUser || [];
    const validUsers = users.filter(
      (user: any) => user.pushSubscription && 
                     user.pushSubscription.trim() !== '' && 
                     user.pushSubscription !== 'null'
    );

    console.log(`🔔 USERS: Found ${users.length} total users, ${validUsers.length} with valid push subscriptions`);
    return validUsers;
  } catch (error) {
    console.error('🔔 USERS: Error fetching users:', error);
    return [];
  }
};

class DailyChallengeGenerator {
  private async getRecentChallenges(): Promise<string[]> {
    if (!DGRAPH_ENDPOINT) {
      console.log('⚠️ DGRAPH_ENDPOINT not configured, skipping recent challenges check');
      return [];
    }

    const query = `
      query GetRecentChallenges {
        queryAIChallenge(
          filter: { frequency: { eq: "daily" } }
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
      const response = await axios.post(DGRAPH_ENDPOINT, {
        query,
      }, {
        headers,
      });

      if (response.data.errors) {
        console.log('⚠️ Error fetching recent challenges:', response.data.errors);
        return [];
      }

      const challenges = response.data.data?.queryAIChallenge || [];
      return challenges.map((c: any) => `${c.title}: ${c.description}`);
    } catch (error) {
      console.log('⚠️ Network error fetching recent challenges:', error);
      return [];
    }
  }

  private getDailyPrompt(): string {
    return `You are a mysterious mind of a organization from the future briefing their agents on daily missions to get ready for harder tasks comming.

    PERFECT EXAMPLES (study the vibe and try to match it):
    - "TASK TOUGH: Shower in cold water or even better - do a cold plunge. No nudity ofc!"
    - "CODE PHOENIX: Wake up at 4am and get your day started well with a nutritious breakfast. The missions ahead of you are for no weak!"
    - "OPERATION IRON CORE: Do maximum pull-ups in 30 seconds in a busy public area. The HQ wants to see your strenght!"
    - "MISSION BALANCE: Walk a narrow ledge/curb for 30 seconds without falling. All agents must perform well to demostrate your readiness."
    - "PROJECT FEARLESS: Approach a stranger and ask for life advice. Learn some usefull skills."
    - "PROTOCOL ELEVATION: Climb to highest safe point you can reach in 30 seconds. Film the view - spot danger."
    - "OPERATION ENDURANCE: Hold a plank position for 30 seconds in an unusual public location."
    - "MISSION VELOCITY: Sprint 100 meters as fast as possible. You never know in this world when you will need your speed."
    
    FOCUS ON (rotate between these categories for variety):
    - Physical challenges (strength, speed, balance, endurance) - pushups, sprints, planks, climbing
    - Social confidence building (talking to strangers, public activities) - ask for advice, compliments, directions
    - Skill demonstrations (climbing, balancing, etc.) - balance beam, rope climbing, obstacle navigation
    - Mental toughness (doing difficult things in public) - cold exposure, public speaking, uncomfortable situations
    - Mind growth (books, podcasts, skills) - learning new facts, practicing skills, creative challenges
    
    30-SECOND FILM REQUIREMENTS:
    - Action starts immediately
    - Shows clear effort/skill being demonstrated
    - Has measurable outcome (reps, time, success/fail)
    - Builds real capability
    - Exciting to watch and attempt

    The result for the challenged should be: "Holly shit, I have actually done this!" So he wants to share it with his friends.
    
    AVOID: Weather-specific activities, complex crafts, impossible skills, anything requiring special equipment.
    
    Current season: Summer (so no snow challenges)
    
    Title: [Mission codename]
    Description: [Universal 30-second challenge focusing on strength/confidence/skills, max 150 chars]`;
  }

  private async generateDailyChallenge(): Promise<{ title: string; description: string }> {
    try {
      // Get recent challenges for variety
      console.log('📚 Fetching recent challenges for variety...');
      const recentChallenges = await this.getRecentChallenges();

      let recentChallengesText = '';
      if (recentChallenges.length > 0) {
        recentChallengesText = `
        
RECENT CHALLENGES (avoid repeating these topics/types):
${recentChallenges.map((challenge, index) => `${index + 1}. ${challenge}`).join('\n')}

IMPORTANT: Look at the recent challenges above and generate something DIFFERENT. 
- If recent challenges focused on physical strength, try social confidence or skill demonstration
- If recent challenges were about talking to strangers, try physical endurance or mental toughness  
- If recent challenges involved climbing/balancing, try speed/agility or mind growth
- Mix up the challenge types to keep users engaged with variety!`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getDailyPrompt() + recentChallengesText,
          },
          {
            role: 'user',
            content: 'Generate one daily challenge. Format: Title: [codename]\nDescription: [challenge description]',
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
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
      console.error('Error generating challenge:', error);
      throw error;
    }
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  async generateChallengeForDate(date: Date = new Date()): Promise<AIChallenge> {
    const { title, description } = await this.generateDailyChallenge();

    const challenge: AIChallenge = {
      id: uuidv4(),
      title,
      description,
      reward: 1, // Always 1 for daily challenges
      createdAt: new Date().toISOString(),
      isActive: true,
      frequency: 'daily',
      day: this.getDayOfYear(date),
      year: date.getFullYear(),
    };

    return challenge;
  }

  printChallengeForDgraph(challenge: AIChallenge): void {
    console.log('\n=== Generated Daily AI Challenge ===');
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
      day
      year
    }
  }
}
    `);

    console.log('Variables:');
    console.log(JSON.stringify({ challenge }, null, 2));
  }
}

// UPDATED: Enhanced function to send push notifications using new bulk method
const sendPushNotifications = async (challenge: AIChallenge): Promise<void> => {
  console.log('🔔 Starting push notification process...');

  try {
    // Get all push subscriptions using the new optimized method
    const pushSubscriptions = await getAllUserPushSubscriptions();

    if (pushSubscriptions.length === 0) {
      console.log('📱 No users with push subscriptions found');
      return;
    }

    console.log(`📱 Found ${pushSubscriptions.length} push subscriptions`);

    // Create an engaging notification payload
    const payload = JSON.stringify({
      title: '🎯 New Daily Challenge!',
      body: `${challenge.title} - Ready for your mission?`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'daily-challenge',
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        type: 'daily-challenge',
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        url: '/home',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'Take Challenge',
          icon: '/icons/icon-192x192.png',
        },
        {
          action: 'dismiss',
          title: 'Later',
        },
      ],
    });

    let successCount = 0;
    let failureCount = 0;
    const invalidSubscriptions: string[] = [];

    console.log('🚀 Sending push notifications...');
    console.log(`📢 Message: "${challenge.title} - Ready for your mission?"`);

    // Send notifications in batches to avoid overwhelming the push service
    const batchSize = 10;
    for (let i = 0; i < pushSubscriptions.length; i += batchSize) {
      const batch = pushSubscriptions.slice(i, i + batchSize);
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pushSubscriptions.length / batchSize)}`);

      const batchPromises = batch.map(async (pushSubscription, index) => {
        try {
          // Parse the push subscription JSON
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

      // Wait for batch to complete
      await Promise.allSettled(batchPromises);
      
      // Small delay between batches
      if (i + batchSize < pushSubscriptions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n📊 Push notification results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📱 Total attempted: ${pushSubscriptions.length}`);
    console.log(`🗑️ Invalid subscriptions found: ${invalidSubscriptions.length}`);

    // Clean up invalid subscriptions if any found
    if (invalidSubscriptions.length > 0) {
      console.log(`\n🧹 Cleaning up ${invalidSubscriptions.length} invalid subscriptions...`);
      await cleanupInvalidSubscriptions(invalidSubscriptions);
    }

    console.log('\n🎯 Push notification broadcast completed!');

  } catch (error) {
    console.error('❌ Error in push notification process:', error);
  }
};

// UPDATED: Function to clean up invalid push subscriptions by subscription value
const cleanupInvalidSubscriptions = async (invalidSubscriptions: string[]): Promise<void> => {
  if (!DGRAPH_ENDPOINT || invalidSubscriptions.length === 0) {
    return;
  }

  console.log('🧹 Starting cleanup of invalid push subscriptions...');

  // Get users with these invalid subscriptions so we can update them
  const users = await getUsersWithPushSubscriptions();
  const userIdsToCleanup = users
    .filter(user => invalidSubscriptions.includes(user.pushSubscription))
    .map(user => user.id);

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
    const response = await axios.post(DGRAPH_ENDPOINT, {
      query: mutation,
      variables: { userIds: userIdsToCleanup },
    }, {
      headers,
    });

    if (response.data.errors) {
      console.error('❌ Error cleaning up invalid subscriptions:', response.data.errors);
    } else {
      console.log(`✅ Cleaned up ${response.data.data?.updateUser?.numUids || 0} invalid subscriptions`);
    }
  } catch (error) {
    console.error('❌ Network error cleaning up subscriptions:', error);
  }
};

// Function to save the daily challenge to Dgraph database
export const saveDailyChallengeToDatabase = async (challenge: AIChallenge): Promise<boolean> => {
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
          day
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
    console.log('💾 Saving daily challenge to database...');

    const response = await axios.post(DGRAPH_ENDPOINT, {
      query: mutation,
      variables: { challenge },
    }, {
      headers,
    });

    if (response.data.errors) {
      console.error('❌ Dgraph mutation error:', response.data.errors);
      return false;
    }

    const savedChallenge = response.data.data?.addAIChallenge?.aIChallenge?.[0];
    if (savedChallenge) {
      console.log('✅ Daily challenge saved successfully!');
      console.log('📝 Challenge ID:', savedChallenge.id);
      console.log('🎯 Title:', savedChallenge.title);
      return true;
    } else {
      console.error('❌ No challenge returned from mutation');
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving challenge to database:', error);
    return false;
  }
};

// Main execution
async function main() {
  const generator = new DailyChallengeGenerator();

  try {
    console.log('🚀 Generating Daily AI Challenge...\n');

    const dailyChallenge = await generator.generateChallengeForDate();
    generator.printChallengeForDgraph(dailyChallenge);

    // Save to database
    console.log('\n💾 Saving to database...');
    const saved = await saveDailyChallengeToDatabase(dailyChallenge);

    if (saved) {
      console.log('\n✅ Daily challenge generated and saved successfully!');

      // Send push notifications
      console.log('\n🔔 Sending push notifications to users...');
      await sendPushNotifications(dailyChallenge);

      console.log('\n🎉 Daily challenge process completed successfully!');
    } else {
      console.log('\n⚠️ Challenge generated but failed to save to database');
      console.log('You can manually save using the mutation above');
    }
  } catch (error) {
    console.error('❌ Error generating challenge:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { DailyChallengeGenerator };
export type { AIChallenge };
