// src/scripts/generateWeeklyChallenge.ts
import 'dotenv/config';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import webpush from 'web-push';
import axios from 'axios';
import { weeklyChallenges, ChallengeFrequency, ChallengeCategory } from '../data/challenges';
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

interface WeeklyAIChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  createdAt: string;
  isActive: boolean;
  frequency: 'weekly';
  week: number;
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

class WeeklyChallengeGenerator {
  private async getRecentChallenges(): Promise<string[]> {
    if (!DGRAPH_ENDPOINT) {
      console.log('⚠️ DGRAPH_ENDPOINT not configured, skipping recent challenges check');
      return [];
    }

    const query = `
      query GetRecentWeeklyChallenges {
        queryAIChallenge(
          filter: { frequency: { eq: "weekly" } }
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
        console.log('⚠️ Error fetching recent weekly challenges:', response.data.errors);
        return [];
      }

      const challenges = response.data.data?.queryAIChallenge || [];
      return challenges.map((c: any) => `${c.title}: ${c.description}`);
    } catch (error) {
      console.log('⚠️ Network error fetching recent weekly challenges:', error);
      return [];
    }
  }

  private async getUsedChallengeIds(): Promise<string[]> {
    if (!DGRAPH_ENDPOINT) {
      console.log('⚠️ DGRAPH_ENDPOINT not configured, skipping used challenges check');
      return [];
    }

    const query = `
      query GetUsedWeeklyChallenges {
        queryAIChallenge(
          filter: { frequency: { eq: "weekly" } }
          order: { desc: createdAt }
          first: 50
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
        console.log('⚠️ Error fetching used weekly challenges:', response.data.errors);
        return [];
      }

      const challenges = response.data.data?.queryAIChallenge || [];
      // Create unique identifiers for used challenges based on title + description
      return challenges.map((c: any) => `${c.title}:${c.description}`);
    } catch (error) {
      console.log('⚠️ Network error fetching used weekly challenges:', error);
      return [];
    }
  }

  private getWeeklyPrompt(): string {
    return `You are an advanced alien researcher conducting comprehensive behavioral studies on human subjects through your Earth observation app "Nocena". Your weekly experiments are designed to understand human social dynamics, creativity, and adaptability.

    SUCCESSFUL HUMAN BEHAVIORAL EXPERIMENTS (reference these patterns):
    - "EXPERIMENT 47-VIRAL: Replicate human viral behavior patterns with personal modifications. Document cultural transmission mechanisms"
    - "STUDY 23-NUTRITION: Subject receives randomized ingredient combination from peer. Observe creative problem-solving under resource constraints"
    - "PROTOCOL 18-SOCIAL: Display unexpected signage in high-traffic areas. Measure human curiosity and interaction responses" 
    - "TEST 31-BALANCE: Construct elevated rope apparatus. Study human persistence and physical adaptation over multiple attempts"
    - "RESEARCH 9-EXPLORATION: Investigate underground human infrastructure. Document discovery patterns and environmental interaction"
    - "FIELD STUDY 12-SURVIVAL: Establish temporary habitat in natural environment. Observe human adaptation to primitive conditions"
    - "EXPERIMENT 88-TRUST: Navigate environment with sensory deprivation while receiving peer guidance. Test social cooperation mechanisms"

    ALIEN RESEARCH PARAMETERS:
    - Multi-day observation period (2-7 Earth rotations)
    - Requires preparation, collaboration, or specialized environments  
    - Documents complete behavioral sequence, not isolated moments
    - Tests human limits: creativity, social bonds, physical adaptation
    - Generates data worth transmitting to the home planet
    - Creates memorable experiences that strengthen human pack bonding

    RESEARCH CATEGORIES (rotate for comprehensive species analysis):
    🛸 SOCIAL DYNAMICS: Group behavior, public interaction, viral transmission studies
    🌍 SURVIVAL INSTINCTS: Primitive skills, environmental adaptation, resource management
    🎨 CREATIVITY PROTOCOLS: Artistic expression, problem-solving, innovation capacity  
    🏃 PHYSICAL LIMITS: Endurance testing, skill acquisition, fear response analysis
    🧠 COGNITIVE MAPPING: Learning patterns, memory systems, decision-making processes
    🤝 COOPERATION STUDIES: Trust exercises, collaboration patterns, leadership emergence

    EXPERIMENT REQUIREMENTS:
    - Extended observation window with multiple data points
    - Involves human social networks or environmental challenges
    - Documents the full journey from hypothesis to conclusion
    - Pushes subjects beyond comfort parameters
    - Creates shareable behavioral records for peer analysis
    - Demonstrates advanced human capabilities for species evaluation

    SEASONAL VARIABLE: Summer thermal period - optimal for outdoor studies, social gathering observations

    IMPORTANT! Don't let your subjects know that you are conducting research on them! Stay secret.

    Expected subject response: "This experiment is going to be fascinating to experience and document!"

    Respond in EXACTLY this format:
    Title: [EXPERIMENT DESIGNATION - sounds like alien research project]
    Description: [Multi-phase behavioral study with observation parameters, max 200 chars]`;
  }

  private async generateWeeklyChallenge(): Promise<{ title: string; description: string }> {
    try {
      // Get recent challenges for variety
      console.log('📚 Fetching recent weekly challenges for variety...');
      const recentChallenges = await this.getRecentChallenges();

      let recentChallengesText = '';
      if (recentChallenges.length > 0) {
        recentChallengesText = `
        
RECENT WEEKLY EXPERIMENTS (avoid repeating these patterns):
${recentChallenges.map((challenge, index) => `${index + 1}. ${challenge}`).join('\n')}

IMPORTANT: Analyze the recent experiments above and generate something DIFFERENT. 
- If recent experiments focused on social dynamics, try survival instincts or creativity protocols
- If recent experiments were about physical limits, try cognitive mapping or cooperation studies  
- If recent experiments involved exploration, try social experiments or artistic challenges
- Vary the experiment types to maintain comprehensive species analysis!`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getWeeklyPrompt() + recentChallengesText,
          },
          {
            role: 'user',
            content:
              'Generate one weekly behavioral experiment. Format: Title: [experiment designation]\nDescription: [experiment description]',
          },
        ],
        max_tokens: 300,
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
      console.error('Error generating weekly challenge:', error);
      throw error;
    }
  }

  private selectWeeklyChallenge(): { title: string; description: string } {
    // Select a random challenge from the weekly challenges array
    const randomIndex = Math.floor(Math.random() * weeklyChallenges.length);
    const selectedChallenge = weeklyChallenges[randomIndex];

    console.log(`🎯 Selected challenge ${randomIndex + 1} of ${weeklyChallenges.length}: ${selectedChallenge.title}`);

    return {
      title: selectedChallenge.title,
      description: selectedChallenge.description,
    };
  }

  private async selectUnusedWeeklyChallenge(): Promise<{ title: string; description: string }> {
    try {
      // Get used challenges
      console.log('📚 Fetching used challenges to avoid repetition...');
      const usedChallengeIds = await this.getUsedChallengeIds();

      // Filter out used challenges
      const availableChallenges = weeklyChallenges.filter((challenge) => {
        const challengeId = `${challenge.title}:${challenge.description}`;
        return !usedChallengeIds.includes(challengeId);
      });

      console.log(`📊 Available challenges: ${availableChallenges.length} of ${weeklyChallenges.length} total`);

      // If no unused challenges, reset and use all challenges
      if (availableChallenges.length === 0) {
        console.log('🔄 All challenges have been used! Resetting to use full list again.');
        return this.selectWeeklyChallenge();
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
      return this.selectWeeklyChallenge();
    }
  }

  private getWeekOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  }

  async generateChallengeForDate(date: Date = new Date(), useAI: boolean = false): Promise<WeeklyAIChallenge> {
    let title: string;
    let description: string;

    if (useAI) {
      console.log('🤖 Using AI to generate weekly challenge...');
      const challenge = await this.generateWeeklyChallenge();
      title = challenge.title;
      description = challenge.description;
    } else {
      console.log('📚 Using predefined weekly challenge list...');
      const challenge = await this.selectUnusedWeeklyChallenge();
      title = challenge.title;
      description = challenge.description;
    }

    const challenge: WeeklyAIChallenge = {
      id: uuidv4(),
      title,
      description,
      reward: 5,
      createdAt: new Date().toISOString(),
      isActive: true,
      frequency: 'weekly',
      week: this.getWeekOfYear(date),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };

    return challenge;
  }

  printChallengeForDgraph(challenge: WeeklyAIChallenge): void {
    console.log('\n=== Generated Weekly AI Challenge ===');
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
      week
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

// Function to send push notifications for weekly challenges
const sendPushNotifications = async (challenge: WeeklyAIChallenge): Promise<void> => {
  console.log('🔔 Starting weekly challenge push notification process...');

  try {
    const pushSubscriptions = await getAllUserPushSubscriptions();

    if (pushSubscriptions.length === 0) {
      console.log('📱 No users with push subscriptions found');
      return;
    }

    console.log(`📱 Found ${pushSubscriptions.length} push subscriptions`);

    const payload = JSON.stringify({
      title: 'New weekly challenge!',
      body: `${challenge.title}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'weekly-challenge',
      renotify: true,
      requireInteraction: false,
      vibrate: [300, 100, 300, 100, 300],
      data: {
        type: 'weekly-challenge',
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        url: '/home',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'Want to try?',
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

    console.log('🚀 Sending weekly challenge push notifications...');
    console.log(`📢 Message: "${challenge.title} - Your weekly mission awaits!"`);

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
        }
      });

      await Promise.allSettled(batchPromises);

      if (i + batchSize < pushSubscriptions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n📊 Weekly challenge push notification results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📱 Total attempted: ${pushSubscriptions.length}`);
  } catch (error) {
    console.error('❌ Error in weekly challenge push notification process:', error);
  }
};

// Function to save the weekly challenge to Dgraph database
export const saveWeeklyChallengeToDatabase = async (challenge: WeeklyAIChallenge): Promise<boolean> => {
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
          week
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
    console.log('💾 Saving weekly challenge to database...');

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
      console.log('✅ Weekly challenge saved successfully!');
      console.log('📝 Challenge ID:', savedChallenge.id);
      console.log('🛸 Title:', savedChallenge.title);
      return true;
    } else {
      console.error('❌ No challenge returned from mutation');
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving weekly challenge to database:', error);
    return false;
  }
};

// Main execution
async function main() {
  const generator = new WeeklyChallengeGenerator();

  try {
    // You can change this flag to switch between AI generation and predefined challenges
    const useAI = false; // Set to true to use OpenAI, false to use predefined challenges

    console.log('🚀 Starting Weekly Challenge Process...\n');

    // Step 1: Reset weekly earnings for all users
    console.log('💰 Resetting weekly earnings counters for all users...');
    try {
      await resetTimeBasedEarnings('weekly');
      console.log('✅ Weekly earnings reset completed successfully!\n');
    } catch (error) {
      console.error('❌ Failed to reset weekly earnings:', error);
      console.log('⚠️ Continuing with challenge generation despite earnings reset failure...\n');
    }

    // Step 2: Generate and process the weekly challenge
    console.log('🛸 Generating Weekly AI Challenge...');
    console.log(`📚 Total weekly challenges available: ${weeklyChallenges.length}`);
    console.log(`🤖 Using ${useAI ? 'AI generation' : 'predefined challenges'}\n`);

    const weeklyChallenge = await generator.generateChallengeForDate(new Date(), useAI);
    generator.printChallengeForDgraph(weeklyChallenge);

    // Step 3: Save to database
    console.log('\n💾 Saving challenge to database...');
    const saved = await saveWeeklyChallengeToDatabase(weeklyChallenge);

    if (saved) {
      console.log('\n✅ Weekly challenge generated and saved successfully!');

      // Step 4: Send push notifications
      console.log('\n🔔 Sending push notifications to users...');
      await sendPushNotifications(weeklyChallenge);

      console.log('\n🎉 Weekly challenge process completed successfully!');
      console.log('\n📋 Summary:');
      console.log('   ✅ Weekly earnings reset');
      console.log('   ✅ Challenge generated');
      console.log('   ✅ Challenge saved to database');
      console.log('   ✅ Push notifications sent');
    } else {
      console.log('\n⚠️ Challenge generated but failed to save to database');
      console.log('You can manually save using the mutation above');
    }
  } catch (error) {
    console.error('❌ Error in weekly challenge process:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { WeeklyChallengeGenerator };
export type { WeeklyAIChallenge };
