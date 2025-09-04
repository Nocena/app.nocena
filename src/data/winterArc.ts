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

export const dailyChallenges: Challenge[] = [
  // --- PHASE 1: FOUNDATION (Days 1–25) ---
  {
    title: 'Hydration Kickoff',
    description: 'Winter soldiers don’t run on coffee alone. Down a glass of water and lock in.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Morning Stretch',
    description: 'Stretch like you’re waking up from cryosleep. The body’s first activation.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Push-Up Start',
    description: '10 push-ups. The entry toll to the Arc. Pay it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Breath Reset',
    description: '5 slow, deep breaths. In like steel, out like fire. Calm is power.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Sit Tall',
    description: 'Sit or stand with warrior posture for 30 seconds. Own the space.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Smile Check',
    description: 'Stare yourself down in the mirror. Then smile like you just won.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Plank Start',
    description: '20-second plank. The floor is the test, your core is the answer.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Affirm Out Loud',
    description: 'Say one powerful truth about yourself. Make it echo.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Jumping Jacks',
    description: '25 jumping jacks. Shake off the rust, prime the engine.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Gratitude Shot',
    description: 'Say one thing you’re grateful for. Lock gratitude = lock resilience.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Wall Sit Intro',
    description: '20-second wall sit. Legs on fire? That’s weakness leaving.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Read One Line',
    description: 'Open a book. Read one line of wisdom like it was meant for you.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Shadow Boxing',
    description: '20 seconds of air combat. Swing like your old habits are the enemy.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Balance Test',
    description: 'Stand on one leg for 15 seconds. Balance the body, balance the arc.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Quick Journal',
    description: 'Write down one goal like it’s prophecy.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Burpee Intro',
    description: '5 burpees. Just the warm-up, soldier.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Squat Set',
    description: '15 squats. Bend, rise, repeat. Foundations are built here.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Mirror Focus',
    description: 'Stare into your own eyes for 30 seconds. Meet your rival and ally.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Cold Splash',
    description: 'Ice-cold water to the face. Welcome to the Winter Arc.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'High Knees',
    description: '20 seconds of high knees. Move like you’re escaping weakness.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Stair Climb',
    description: 'Run up one flight of stairs. Ascend physically, ascend mentally.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Toe Touches',
    description: '15 toe touches. Reach for what’s out of range.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Laugh Break',
    description: 'Laugh out loud for 10 seconds. Joy is fuel too.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Write Gratitude',
    description: 'Write one sentence of gratitude like a shield.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Push-Up Count',
    description: 'As many push-ups as you can in 30 seconds. Show the fight.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },

  // --- PHASE 2: DISCIPLINE (Days 26–50) ---
  {
    title: 'Plank Minute',
    description: '1-minute plank. Stability under fire.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Burpee 10',
    description: '10 burpees straight. Explode through gravity.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Wall Sit Minute',
    description: '60-second wall sit. Let the burn baptize you.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Breathing Box',
    description: 'Box breathing: 4-4-4-4. Control the storm.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Push-Up Ladder',
    description: 'Climb from 3 push-ups to 12. Earn every step.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'One Page Rule',
    description: 'One full page of a book. Absorb it like secret code.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Squat Hold',
    description: 'Hold a 90° squat for 45 seconds. Freeze in strength.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Shadow Drill',
    description: '30 seconds of shadow boxing with footwork. Fight like you mean it.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Balance Advanced',
    description: 'One-leg balance, eyes closed, 15 seconds. Darkness reveals truth.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Healthy Snack',
    description: 'Eat fruit instead of junk. The small wins stack.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Step Outside',
    description: 'Step into daylight. Breathe the winter air like a reset button.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Book Quote',
    description: 'Read a quote aloud. Let wisdom sharpen your blade.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Push Beyond',
    description: 'Push-ups until failure. Film the last battle rep.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Hold The Line',
    description: 'Hold your breath safely as long as possible. Own the silence.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Plank Reach',
    description: 'Plank with forward arm reaches. Reach further, hold tighter.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Jump Squats',
    description: '15 explosive jump squats. Launch like rockets.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Affirmation Repeat',
    description: 'Chant your affirmation 10 times. Make it law.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Skill Practice',
    description: 'Show 30 seconds of skill practice. This is XP grind time.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Burpee Max',
    description: 'As many burpees as possible in 30 seconds. Go berserk.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Wall Push',
    description: '20 wall push-ups. Strength, even in simplicity.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Squat Max',
    description: '30-second squat blitz. Show endurance.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Push-Hold',
    description: 'Hold the bottom of a push-up for 20 seconds. Face gravity.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Tidy Up',
    description: 'Clean one small area. Order = clarity.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Step Count Boost',
    description: '100 marching steps. Move forward, literally.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Balance Hold',
    description: 'Squat balance for 30 seconds. Controlled discomfort.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },

  // --- PHASE 3: HARD MODE (Days 51–75) ---
  {
    title: 'Burpee 20',
    description: '20 burpees. No breaks. Prove stamina.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Push-Up 30',
    description: '30 push-ups. The grind begins.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Plank 90',
    description: '90 seconds. Hold. Shake. Endure.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Handstand Try',
    description: 'Attempt a wall handstand. Invert the world.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Cold Shower Start',
    description: '15 seconds of icy water. Baptism by frost.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Sprint Burst',
    description: '10-second sprint at max speed. Leave weakness behind.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Jump Rope',
    description: '30 seconds fast rope. Feet to fire rhythm.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Push-Up Clap',
    description: '5 clap push-ups. Explosive proof.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Pistol Try',
    description: 'Attempt a one-leg squat. Balance the chaos.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Plank Reach Out',
    description: 'Plank with 10 forward reaches. Extend your lock-in.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Pull-Up Set',
    description: '5 pull-ups. Rope yourself upward.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Wall Sit Hold',
    description: '90-second wall sit. Time under tension = respect.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Decline Push-Up',
    description: '10 push-ups with feet raised. Angles of power.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Balance Advanced',
    description: '30-second eyes-closed one-leg hold. Dark balance.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Burpee Sprint',
    description: '10 burpees, max speed. Endurance raid.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Side Plank Hold',
    description: '30 seconds each side. Oblique fire.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Diamond Push-Ups',
    description: '10 diamond push-ups. Core + triceps trial.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Box Jumps',
    description: '10 explosive jumps. Rise like storm.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Flexibility Test',
    description: 'Touch your toes, hold 15 seconds. Flex or fail.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Burpee Explosive',
    description: '10 tuck-jump burpees. Sky’s the limit.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Plank Drag',
    description: 'Plank drag an object 10 times. Core crucible.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Archer Push-Up',
    description: '5 archer push-ups. Left, right, discipline.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Pull-Up Max',
    description: 'Max pull-ups, no kipping. Pure pull.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Cold Face Dip',
    description: 'Bowl of ice water. Face in. Embrace frost.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Hand Release Push-Up',
    description: '10 hand-release push-ups. Down to zero, rise stronger.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },

  // --- PHASE 4: PEAK ARC (Days 76–100) ---
  {
    title: 'Burpee 30',
    description: '30 burpees. Full send.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Push-Up 50',
    description: '50 push-ups, no mercy. Steel chest.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Plank 2 Minutes',
    description: '120-second plank. Mental fortress.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Wall Sit 2 Minutes',
    description: '2 minutes of leg fire. Own the burn.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Handstand Hold',
    description: '15-second handstand. World upside down, you steady.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Ice Shower',
    description: '30 seconds under cold water. Arc unlocked.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Sprint Hill',
    description: '15-second uphill sprint. Dominate gravity.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'One-Arm Push-Up Try',
    description: 'Attempt a one-arm push-up. Show grit.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Pistol Full',
    description: 'Complete one pistol squat. Precision + power.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Pull-Up 10',
    description: '10 strict pull-ups. Clean. Warrior standard.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Burpee Max Out',
    description: '60 seconds, full burpee send. Boss battle.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Plank Weighted',
    description: 'Plank with weight on back. Carry the load.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Plyometric Push-Ups',
    description: '10 push-ups launching off the ground. Explosive arc.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Balance Extreme',
    description: '45 seconds eyes closed, one-leg stance. Inner storm.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Cold Outdoor Air',
    description: 'Step outside in winter air, light clothes. Endure.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Burpee 40',
    description: '40 burpees. Arc breaking point.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Push-Up 75',
    description: '75 push-ups. Legendary status.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Plank 3 Minutes',
    description: '3 minutes of stillness under strain. Hero mode.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Pull-Up 15',
    description: '15 pull-ups, strict. Final pull to mastery.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
  {
    title: 'Final Lock-In',
    description: 'Speak your Winter Arc lesson aloud. Seal the arc.',
    category: ChallengeCategory.AI,
    frequency: ChallengeFrequency.DAILY,
  },
];
