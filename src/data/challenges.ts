export enum ChallengeFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum ChallengeCategory {
  AI = 'AI',         // AI-generated challenges
  PUBLIC = 'public', // Business/sponsored challenges
  PRIVATE = 'private' // User-to-user challenges
}

export enum ChallengeCompletionMethod {
  IN_APP_RECORD = 'in_app_record', // In-app recording
  UPLOAD_VIDEO = 'upload_video'    // External video upload
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
  frequency?: ChallengeFrequency
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
          maxDurationSeconds: 30
        };
      case ChallengeFrequency.WEEKLY:
        return {
          completionMethod: ChallengeCompletionMethod.UPLOAD_VIDEO,
          maxDurationSeconds: 60
        };
      case ChallengeFrequency.MONTHLY:
        return {
          completionMethod: ChallengeCompletionMethod.UPLOAD_VIDEO,
          maxDurationSeconds: 180
        };
    }
  }
  
  // Public and private challenges use the same format as daily
  return {
    completionMethod: ChallengeCompletionMethod.IN_APP_RECORD,
    maxDurationSeconds: 30
  };
}

export const monthlyChallenges: Challenge[] = [
  { 
    title: 'Skill Mastery', 
    description: 'Pick a skill to learn and document your progress over the month, culminating in a showcase of your achievement.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY
  },
  { 
    title: 'Physical Breakthrough', 
    description: 'Set a significant physical goal (e.g., run a 5K, do 50 push-ups, master a yoga pose). Show your training and the moment you succeed.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY
  },
  { 
    title: 'Social Event', 
    description: 'Organize an interactive public gathering where strangers can join in on games and activities. Capture the event and people participating.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY
  },
  { 
    title: 'Adventure Seeker', 
    description: 'Take on a challenge outside your comfort zone (wild swimming, sleeping outdoors, climbing a local peak, etc.). Show the most challenging moment and your accomplishment.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY
  },
  { 
    title: 'Fear Conqueror', 
    description: 'Pick and confront a personal fear. Show yourself facing the fear and share what you learned from the experience.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY
  },
  { 
    title: 'Feel Alive', 
    description: 'Engage in an activity that makes you feel truly alive. Document the experience and explain why you chose it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.MONTHLY
  }
];

export const weeklyChallenges: Challenge[] = [
  // Creative Expression Challenges
  { 
    title: 'Viral Remix', 
    description: 'Recreate a viral internet trend with your own creative twist.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Rap Recap', 
    description: 'Summarize your year in a 30-second rap while doing an unexpected activity (e.g., cooking, walking backward, juggling).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Street Art Creator', 
    description: 'Design and create a temporary public art piece (e.g., chalk, removable installation, interactive art). Capture the process and people\'s reactions.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Mystery Meal', 
    description: 'Ask a friend to create a mystery grocery box with 5 random ingredients and cook a dish using all of them. Show the unboxing, the cooking, and the final result.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Public Performance', 
    description: 'Perform a creative act (dance, music, spoken word, etc.) in a public space and capture the performance.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Art Gallery', 
    description: 'Set up a temporary outdoor "art gallery" (e.g., printed photos, quirky art pieces, sketches, etc.). Capture the event and passersby experiencing the exhibit.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  
  // Social Interaction Challenges
  { 
    title: 'Stranger Dinner Date', 
    description: 'Sit next to a stranger in a public space (e.g., park bench, bus stop, train) and set up an impromptu "dinner date" (e.g., bring a small table, drink, food). Or add your own creative twist.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Flash Kitchen', 
    description: 'Cook something and invite a stranger to taste it. Capture their reaction and feedback.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Tour Guide', 
    description: 'Give a tour to tourists or newcomers in your city, showcasing interesting spots and local insights.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Interactive Experiment', 
    description: 'Create an interactive experience for strangers (e.g., a "Free Compliments" booth, a "Would You Rather" question board). Capture your setup and people engaging with it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Unexpected Offering', 
    description: 'Stand in a busy public place with a sign that says something unexpected (e.g., "Free High-Fives," "Tell Me a Joke"). Capture people\'s reactions.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Secret Talent Show', 
    description: 'Find 3 strangers willing to demonstrate a unique talent or skill on the spot. Host a mini talent show and participate as well.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Dance Circle', 
    description: 'Start a dance circle and get at least 5 different people to take turns showing off their moves in the center.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Dance Lesson', 
    description: 'Learn a dance move combo from a stranger and then teach it to another stranger. Show the learning and teaching process.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Street Wisdom', 
    description: 'Ask at least 5 strangers for their best life advice and compile it into a video edit.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Welcome Party', 
    description: 'Create an impromptu "welcome party" for someone or a group of people arriving at an airport or station.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  
  // Adventure & Exploration Challenges
  { 
    title: 'Slackline Star', 
    description: 'Set up a slackline (or a rope between trees) and try learning to balance and walk on it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Cave Explorer', 
    description: 'Safely explore an urban "cave" (e.g., tunnel, large drain, underpass).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Camping', 
    description: 'Camp overnight in nature (in a legal and safe location).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Sunrise Seeker', 
    description: 'Capture the sunrise from a notable location in your area. Show your journey to get there and the moment the sun appears.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  
  // Personal Growth & Resilience Challenges
  { 
    title: 'Future Self Project', 
    description: 'Implement a positive change that moves you toward becoming better. Document the process and progress.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Community Support', 
    description: 'Find a way to contribute to your city or community. Document what you did and the impact.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Local Hero', 
    description: 'Visit a local independent business. Show what makes it unique and interview the owner.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Cold Exposure', 
    description: 'Challenge yourself with some type of cold plunge (be careful if you\'re new to it).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Fire Starter', 
    description: 'Start a fire without matches or a lighter in a safe, legal outdoor setting. Cook something simple over it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  },
  { 
    title: 'Blindfolded Challenge', 
    description: 'Navigate from one specific point to another (at least 200 meters apart) while blindfolded, with a friend guiding verbally.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.WEEKLY
  }
];

export const dailyChallenges: Challenge[] = [
  // Social Interaction
  { 
    title: 'Talent Swap', 
    description: 'Teach a stranger a simple skill (e.g., whistling) and have them teach you something in return.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Stranger\'s Game', 
    description: 'Play a 30-second game (e.g., thumb war, rock-paper-scissors) with a stranger.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Secret Handshake', 
    description: 'Create a complicated handshake and teach it to a willing stranger.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Floor is Lava', 
    description: 'Convince 3 strangers to play "The Floor is Lava" with you in a public space.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Wave Chain', 
    description: 'Wave enthusiastically at strangers and get as many as possible to wave back.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Unusual Compliment', 
    description: 'Compliment a stranger in a crowded place on something odd (e.g., "Your shoes remind me of a sunset").',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Best Friend Act', 
    description: 'Approach a stranger and interact as if you\'ve know them for years.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Trust Fall', 
    description: 'Perform a trust fall with a friend or a willing stranger.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  
  // Physical Challenges
  { 
    title: 'Urban Gym', 
    description: 'Use your city as a gym and do as many different exercises as possible (e.g., bench dips, stair sprints, playground pull-ups).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Jump Squat Challenge', 
    description: 'Do as many jump squats as possible in 30 seconds while yelling something silly.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Burpee Blasters', 
    description: 'Perform full burpees (squat, plank, push-up, jump) for 30 seconds without stopping.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Parkour Basics', 
    description: 'Learn and perform 3 basic parkour moves in an urban environment.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Handstand/Headstand', 
    description: 'Do a handstand or headstand against a wall in a public place.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Stair Dash', 
    description: 'Run up and down the longest staircase you can find without stopping.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Trash Can Shots', 
    description: 'Make 3 "basketball shots" into public trash cans from increasing distances.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Obstacle Jumps', 
    description: 'Jump over 5 different barriers or obstacles in an urban environment.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Hula Hoop Hero', 
    description: 'Hula hoop for 30 seconds straight.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Unusual Exercise', 
    description: 'Perform an unusual exercise routine in a public place for 30 seconds.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Group Workout', 
    description: 'Start exercising in public and try to get someone to join you.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  
  // Exploration/Adventure
  { 
    title: 'Urban Explorer', 
    description: 'Find and access an abandoned or rarely visited location in your city.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Street Art Hunt', 
    description: 'Find and share an impressive piece of street art in your area.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'High Altitude Picnic', 
    description: 'Have a picnic at the highest accessible point in your city.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Mindfulness Spot', 
    description: 'Find an unexpectedly peaceful spot in a busy area.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Sunset Salute', 
    description: 'Catch the sunset at an epic spot and give it a 10-second dramatic salute.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Peak Shout', 
    description: 'Climb the highest accessible point in your area (e.g., stairs, hill) and shout "I made it!"',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Echo Maker', 
    description: 'Find a tunnel or underpass and create the most impressive echo possible.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Street Performer Hunt', 
    description: 'Find a street performer in your area.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Urban Climb', 
    description: 'Climb a safe urban structure (e.g., a bridge, a wall).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Monument Pose', 
    description: 'Climb onto a public sign or monument (if safe and legal) and strike a pose.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Quick Change', 
    description: 'Change your outfit in a public place (while remaining decent) in under 30 seconds.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  
  // Creative/Performance-Based
  { 
    title: 'Random Object Ad', 
    description: 'Create a hilarious 30-second ad for a random household item.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Slow Motion Drama', 
    description: 'Film a mundane action in slow motion with dramatic narration.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Talent Act Finale', 
    description: 'Perform a 30-second talent act with a dramatic finale.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Guess the Movie', 
    description: 'Act out a movie scene in 30 seconds for others to guess.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Bookstore Humor', 
    description: 'Visit a bookstore, open a random book, and find the funniest sentence.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Ice Cube Challenge', 
    description: 'Try balancing an ice cube on your nose.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Throwback Recreate', 
    description: 'Recreate an old photo or memory, showing the original and modern version.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Balloon Artist', 
    description: 'Create a balloon animal or object and gift it to a stranger.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  
  // Miscellaneous
  { 
    title: 'Fountain Swimmer', 
    description: 'Swim in a public fountain.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Puddle Jump', 
    description: 'Find and jump over (or into) the biggest puddle you can find.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Floor is Lava Solo', 
    description: 'Cross a public space pretending the floor is lava.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Tree Climb', 
    description: 'Climb a tree.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Hill Roll', 
    description: 'Find a safe grassy hill in an urban area and roll down.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Rail Slide', 
    description: 'Slide down a handrail or railing.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Rope Swing', 
    description: 'Find or tie a rope to a sturdy tree branch and swing on it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Chalk Game', 
    description: 'Draw a chalk game and play it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'New Language', 
    description: 'Learn a sentence in a language you don\'t know.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Food Challenge', 
    description: 'Eat the spiciest or most unusual dish at a local restaurant.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Food Fusion', 
    description: 'Combine two completely different foods and eat the creation.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Skateboard Try', 
    description: 'Try skateboarding, borrowing one from a willing stranger if needed.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Barefoot Walk', 
    description: 'Walk barefoot outside.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Hidden Messages', 
    description: 'Leave hidden motivational messages in 3 public places for strangers to find.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Plant Caretaker', 
    description: 'Water plants in a public space that look like they need care.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Message Board', 
    description: 'Create a small, temporary community message board in a public space (where permitted).',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Power Nap', 
    description: 'Find an unusual public place to take a short "power nap."',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Weirdest Item', 
    description: 'Show the weirdest or most unique thing in your house.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  },
  { 
    title: 'Urban Time-Lapse', 
    description: 'Create a 30-second time-lapse of a busy urban area.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY
  }
];