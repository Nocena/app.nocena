export enum ChallengeFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum ChallengeCategory {
  AI = 'AI', // AI-generated challenges
  PUBLIC = 'public', // Business/sponsored challenges
  PRIVATE = 'private', // User-to-user challenges
}

export enum ChallengeCompletionMethod {
  IN_APP_RECORD = 'in_app_record', // In-app recording
  UPLOAD_VIDEO = 'upload_video', // External video upload
}

export interface Challenge {
  title: string;
  description: string;
  category?: ChallengeCategory;
  frequency?: ChallengeFrequency;
}

// Helper function to get completion method and duration based on challenge type
export function getChallengeCompletionParams(
  category: ChallengeCategory,
  frequency?: ChallengeFrequency,
): {
  completionMethod: ChallengeCompletionMethod;
  maxDurationSeconds: number;
} {
  // AI challenges have different formats based on frequency
  if (category === ChallengeCategory.AI && frequency) {
    switch (frequency) {
      case ChallengeFrequency.DAILY:
        return {
          completionMethod: ChallengeCompletionMethod.IN_APP_RECORD,
          maxDurationSeconds: 30,
        };
      case ChallengeFrequency.WEEKLY:
        return {
          completionMethod: ChallengeCompletionMethod.UPLOAD_VIDEO,
          maxDurationSeconds: 60,
        };
      case ChallengeFrequency.MONTHLY:
        return {
          completionMethod: ChallengeCompletionMethod.UPLOAD_VIDEO,
          maxDurationSeconds: 180,
        };
    }
  }

  // Public and private challenges use the same format as daily
  return {
    completionMethod: ChallengeCompletionMethod.IN_APP_RECORD,
    maxDurationSeconds: 30,
  };
}

export const monthlyChallenges: Challenge[] = [
  {
    title: 'Skill Mastery',
    description:
      'Pick a skill to learn and document your progress over the month, culminating in a showcase of your achievement.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY,
  },
  {
    title: 'Physical Breakthrough',
    description:
      'Set a significant physical goal (e.g., run a 5K, do 50 push-ups, master a yoga pose). Show your training and the moment you succeed.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY,
  },
  {
    title: 'Social Event',
    description:
      'Organize an interactive public gathering where strangers can join in on games and activities. Capture the event and people participating.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY,
  },
  {
    title: 'Adventure Seeker',
    description:
      'Take on a challenge outside your comfort zone (wild swimming, sleeping outdoors, climbing a local peak, etc.). Show the most challenging moment and your accomplishment.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY,
  },
  {
    title: 'Fear Conqueror',
    description:
      'Pick and confront a personal fear. Show yourself facing the fear and share what you learned from the experience.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY,
  },
  {
    title: 'Feel Alive',
    description:
      'Engage in an activity that makes you feel truly alive. Document the experience and explain why you chose it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY,
  },
];

export const weeklyChallenges: Challenge[] = [
  // Creative Expression Challenges
  {
    title: 'Viral Remix',
    description: 'Recreate a viral internet trend with your own creative twist.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Rap Recap',
    description:
      'Summarize your year in a 30-second rap while doing an unexpected activity (e.g., cooking, walking backward, juggling).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Street Art Creator',
    description:
      "Design and create a temporary public art piece (e.g., chalk, removable installation, interactive art). Capture the process and people's reactions.",
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Mystery Meal',
    description:
      'Ask a friend to create a mystery grocery box with 5 random ingredients and cook a dish using all of them. Show the unboxing, the cooking, and the final result.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Public Performance',
    description:
      'Perform a creative act (dance, music, spoken word, etc.) in a public space and capture the performance.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Art Gallery',
    description:
      'Set up a temporary outdoor "art gallery" (e.g., printed photos, quirky art pieces, sketches, etc.). Capture the event and passersby experiencing the exhibit.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },

  // Social Interaction Challenges
  {
    title: 'Stranger Dinner Date',
    description:
      'Sit next to a stranger in a public space (e.g., park bench, bus stop, train) and set up an impromptu "dinner date" (e.g., bring a small table, drink, food). Or add your own creative twist.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Flash Kitchen',
    description: 'Cook something and invite a stranger to taste it. Capture their reaction and feedback.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Tour Guide',
    description: 'Give a tour to tourists or newcomers in your city, showcasing interesting spots and local insights.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Interactive Experiment',
    description:
      'Create an interactive experience for strangers (e.g., a "Free Compliments" booth, a "Would You Rather" question board). Capture your setup and people engaging with it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Unexpected Offering',
    description:
      'Stand in a busy public place with a sign that says something unexpected (e.g., "Free High-Fives," "Tell Me a Joke"). Capture people\'s reactions.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Secret Talent Show',
    description:
      'Find 3 strangers willing to demonstrate a unique talent or skill on the spot. Host a mini talent show and participate as well.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Dance Circle',
    description:
      'Start a dance circle and get at least 5 different people to take turns showing off their moves in the center.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Dance Lesson',
    description:
      'Learn a dance move combo from a stranger and then teach it to another stranger. Show the learning and teaching process.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Street Wisdom',
    description: 'Ask at least 5 strangers for their best life advice and compile it into a video edit.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Welcome Party',
    description:
      'Create an impromptu "welcome party" for someone or a group of people arriving at an airport or station.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },

  // Adventure & Exploration Challenges
  {
    title: 'Slackline Star',
    description: 'Set up a slackline (or a rope between trees) and try learning to balance and walk on it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Cave Explorer',
    description: 'Safely explore an urban "cave" (e.g., tunnel, large drain, underpass).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Camping',
    description: 'Camp overnight in nature (in a legal and safe location).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Sunrise Seeker',
    description:
      'Capture the sunrise from a notable location in your area. Show your journey to get there and the moment the sun appears.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },

  // Personal Growth & Resilience Challenges
  {
    title: 'Future Self Project',
    description:
      'Implement a positive change that moves you toward becoming better. Document the process and progress.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Community Support',
    description: 'Find a way to contribute to your city or community. Document what you did and the impact.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Local Hero',
    description: 'Visit a local independent business. Show what makes it unique and interview the owner.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Cold Exposure',
    description: "Challenge yourself with some type of cold plunge (be careful if you're new to it).",
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Fire Starter',
    description:
      'Start a fire without matches or a lighter in a safe, legal outdoor setting. Cook something simple over it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
  {
    title: 'Blindfolded Challenge',
    description:
      'Navigate from one specific point to another (at least 200 meters apart) while blindfolded, with a friend guiding verbally.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY,
  },
];

export const dailyChallenges: Challenge[] = [
  // 🌆 City & Exploration Challenges
  {
    title: 'Best View Brew',
    description: 'Have a coffee in a cafe with the best view in town.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Busy Spot',
    description: 'Show the busiest spot in the city.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Giant Statue',
    description: 'Show the biggest statue you can find nearby.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Yellow Car Hunt',
    description: 'Find a yellow car.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Oldest Building',
    description: 'Show the oldest building in your city you can find.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Interesting Architecture',
    description: 'Find a building with unique or cool architecture.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Cool Shadow',
    description: 'Find an interesting or artistic shadow.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Street Art Hunt',
    description: 'Find and share a piece of impressive street art.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Favorite Place',
    description: 'Show your favorite place in your city and tell us why you love it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Water Feature',
    description: 'Find a fountain, pond, or other interesting water feature or body of water.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Night Lights',
    description: 'Record a cool spot in your city at night',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },

  // 👟 Style & Personal Items
  {
    title: 'Eccentric Socks',
    description: 'Wear some fun or unusual socks today.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Dressed to Impress',
    description: 'Dress up fancy for work or your daily tasks.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Watch Check',
    description: 'Show us what watch you are wearing today.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Silly Wallpaper',
    description: 'Change your phone or computer wallpaper to something silly for the day.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Backwards Fashion',
    description: 'Wear all your cloathing on backwards today (even just for a bit).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Shoe Selfie',
    description: 'Share the shoes you’re wearing today.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },

  // 🧠 Creative & Thoughtful Moments
  {
    title: 'Bookstore Humor',
    description: 'Open a random book and find a cool or funny sentence.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'New Language',
    description: 'Learn a sentence in a language you don not know.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Kind Note Drop',
    description: 'Write a kind message on a sticky note and leave it somewhere public.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Gratitude Snack',
    description: 'Share your favorite snack and why you love it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Smoothie Time',
    description: 'Make a smoothie and share your recipe.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Book Recommendation',
    description: 'Share your favorite book and what makes it special.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },

  // 💪 Movement & Physical Play
  {
    title: 'Balance Challenge',
    description: 'Try to balance on one foot for 10 seconds.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Jump Squat Challenge',
    description: 'Do as many jump squats as possible in 15 seconds.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Urban Gym',
    description: 'Use your city as a gym—bench dips, stair sprints, pull-ups on playgrounds, etc.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Barefoot Walk',
    description: 'Walk barefoot outside for a short while (safely).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Touch Grass',
    description: 'Literally go outside and touch some grass.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'High Five Mirror',
    description: 'High five yourself in the mirror.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },

  // ✍️ Quick & Fun Challenges
  {
    title: 'Non-dominant Hand',
    description: 'Write a full sentence using your non-dominant hand.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Last Song Played',
    description: 'Share the last song you listened to.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Urban Nature Care',
    description: 'Water a plant in a public place that looks thirsty.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Unexpected Collection',
    description: 'Show off a random collection (pens, stickers, receipts—anything).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Window View',
    description: 'Show whatever’s outside your window right now.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Local Oddity',
    description: 'Find something quirky, weird, or out of place in your area and share it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Walk a New Street',
    description: 'Take a stroll down a street you’ve never walked before.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Coin Flip Decision',
    description: 'Make a small decision today based on a coin flip.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
];
