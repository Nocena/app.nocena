// src/pages/api/map/generate-challenges.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// COMPLETELY REDESIGNED EXAMPLES - Fun, wild, memorable, DIVERSE ACTIONS
const EXAMPLE_CHALLENGES = `
STUDY THESE VIBES - Make challenges that feel THIS alive:

TALKING/SOCIAL (use sparingly - only 20% of challenges):
✅ CAFE: "COFFEE HEIST - Order in a fake accent. Commit to it 100%. Make the barista laugh or you fail."
✅ STATUE: "STATUE GOSSIP - Ask the statue for dating advice. Wait for answers. React to their wisdom."

PHYSICAL/MOVEMENT (40% of challenges):
✅ PARK: "NINJA SPRINT - Sprint 20 meters in slow motion. Add dramatic sound effects. Be majestic."
✅ STREET: "INVISIBLE DOG - Walk an invisible dog. Pick up invisible poop. React to people staring."
✅ VIEWPOINT: "SUPERHERO LANDING - Jump and land in superhero pose. Hold it for 10 seconds. Be powerful."
✅ FOUNTAIN: "WATER DANCE - Mirror the fountain's water movements with your body. Become liquid."
✅ BENCH: "PARKOUR FAIL - Attempt to dramatically vault over the bench. Exaggerate the difficulty."

CREATIVE/ARTISTIC (20% of challenges):
✅ MONUMENT: "SHADOW ART - Use your hands to create shadow puppets on the monument. Make 3 animals."
✅ LIBRARY: "SPEED SKETCH - Draw the first thing you see in 15 seconds. Show the masterpiece proudly."
✅ CAFE: "NAPKIN ORIGAMI - Fold a napkin into the weirdest shape possible. Name your creation."

OBSERVATION/SENSORY (20% of challenges):
✅ PARK: "SMELL SAFARI - Find and smell 5 different things. Describe each one dramatically."
✅ RESTAURANT: "TEXTURE HUNT - Find 4 different textures around you. Film yourself touching each one."
✅ VIEWPOINT: "SOUND MAP - Close your eyes. Point to every sound you hear. Name them all."

KEY INSIGHTS:
- ROTATE challenge types - don't default to talking!
- Physical > Social > Creative > Sensory (in that order of frequency)
- Challenges have PERSONALITY and ATTITUDE
- They're SPECIFIC, not generic ("slow motion sprint" not "run creatively")
- They create STORIES people want to share
- They're slightly ABSURD but totally doable
- They make you LAUGH while reading them
- NO BORING WORDS: eliminate "perform", "engage", "capture", "document"
`;

const POI_PROMPTS: Record<string, string> = {
  cafe: `Generate a WILD 30-second challenge for a CAFE/COFFEE SHOP.

FOCUS ON:
- Ridiculous ordering methods (accents, singing, rhyming, compliments-only)
- Unusual coffee experiments (taste tests with eyes closed, smell competitions)
- Social weirdness (interviewing other customers about life, coffee philosophy debates)
- Creative menu hacks (inventing drink names, asking for "secret menu")

AVOID: Generic "order and describe" or "talk to barista" - BE SPECIFIC AND WEIRD`,

  park: `Generate a WILD 30-second challenge for a PARK/GARDEN.

FOCUS ON:
- Animal interactions (befriend birds, interview squirrels, explain life to a tree)
- Physical absurdity (slow-motion sprint, backwards walking tour, ninja moves)
- Nature roleplay (become a park ranger, wildlife photographer, tree inspector)
- Sensory overload (find smells, collect sounds, taste the air descriptions)

AVOID: Generic "find leaves" or "nature documentary" - MAKE IT ABSURD`,

  monument: `Generate a WILD 30-second challenge for a MONUMENT/HISTORIC SITE.

FOCUS ON:
- Time travel scenarios (interview from past/future, explain modern slang to statue)
- Absurd theories (conspiracy theories about monument, secret purpose reveals)
- Dramatic roleplay (monument's inner thoughts, historical figure hot takes)
- Modern mashups (monument reviews Tiktok, what would they post on Instagram)

AVOID: Generic "explain history" or "interview monument" - MAKE IT SPECIFIC`,

  fountain: `Generate a WILD 30-second challenge for a FOUNTAIN.

FOCUS ON:
- Bizarre wishes (most useless superpower, weirdest food combination)
- Water choreography (interpret water, dance battle with fountain, water commentary)
- Fake science (explain fountain physics incorrectly, water conspiracy theories)
- Dramatic performances (fountain opera, water sports commentary, aquatic poetry)

AVOID: Generic "make a wish" or "forced perspective" - GET CREATIVE`,

  artwork: `Generate a WILD 30-second challenge for PUBLIC ART/SCULPTURE.

FOCUS ON:
- Conversation topics (ask for life advice, dating tips, career guidance)
- Absurd interpretation (what's their Spotify playlist, Instagram bio, dating profile)
- Behind the scenes (interview about art gossip, their secret life after hours)
- Pose battles (copy pose but add emotion: angry, scared, excited versions)

AVOID: Generic "mimic pose" or "interpret meaning" - MAKE IT FUNNY`,

  viewpoint: `Generate a WILD 30-second challenge for a VIEWPOINT/SCENIC SPOT.

FOCUS ON:
- Movie moments (action hero entrance, romantic comedy meet-cute, villain reveal)
- Ridiculous tourism (worst tour guide ever, fake historical facts, made-up legends)
- Rating systems (rate the view in weird categories: scariness, kissability, dragon-friendliness)
- Time-lapses (speed through emotions, weather predictions, prophecies)

AVOID: Generic "capture view" or "movie narration" - BE SPECIFIC`,

  playground: `Generate a WILD 30-second challenge for a PLAYGROUND.

FOCUS ON:
- Adult absurdity (serious business meeting on swings, job interview on slide)
- Invented sports (create Olympic sport with equipment, commentate it)
- Age roleplay (90-year-old on monkey bars, baby on swing, teenager angst)
- Equipment mashups (wrong ways to use stuff, equipment reviews like products)

AVOID: Generic "use equipment" or "childhood joy" - MAKE IT WEIRD`,

  library: `Generate a WILD 30-second challenge for a LIBRARY.

FOCUS ON:
- Dramatic readings (death scene, breakup, superhero origin from random book)
- Book mashups (combine two random titles, create fake book trailers)
- Silent chaos (dramatic mime performance, silent film acting, gesture conversation)
- Book personalities (if this shelf was a person, book speed dating)

AVOID: Generic "read dramatically" - BE ULTRA SPECIFIC`,

  statue: `Generate a WILD 30-second challenge for a STATUE.

FOCUS ON:
- Deep conversations (therapy session, confession booth, life coaching)
- Hot takes (statue's opinion on TikTok, dating apps, modern music)
- Gossip (what statue knows about other statues, statue drama, secrets)
- Daily life (statue's morning routine, favorite food, biggest fear)

AVOID: Generic "interview statue" - MAKE THE QUESTIONS WEIRD`,

  street: `Generate a WILD 30-second challenge for a STREET/PUBLIC AREA.

FOCUS ON:
- Invisible scenarios (invisible friend argument, invisible pet, invisible sale)
- Character acting (foreign tourist lost, time traveler confused, robot malfunction)
- Commentary chaos (sports commentary on walking, nature doc on pigeons)
- Random acts (compliment spree, high-five mission, dance-off with lamp post)

AVOID: Generic "performance" or "tour guide" - MAKE IT SPECIFIC`,

  bench: `Generate a WILD 30-second challenge for a BENCH.

FOCUS ON:
- Sponsored content (fake ad for bench, unboxing video, product review)
- Confessional (bench therapy, bench secrets, bench as relationship counselor)
- Dramatic scenes (breakup with bench, proposal to bench, bench betrayal)
- Bench personality (interview bench about life, bench has hot takes, bench gossip)

AVOID: Generic "monologue" - GIVE IT A TWIST`,

  random: `Generate a WILD 30-second challenge for ANY PUBLIC LOCATION.

FOCUS ON:
- Universal absurdity (invisible scenarios, fake personalities, made-up rules)
- Social experiments (compliment strangers creatively, unusual questions, observations)
- Physical comedy (slow motion, backwards, interpretive dance about emotions)
- Roleplay (characters, time periods, different ages, occupations)

AVOID: Generic anything - THIS IS YOUR CHANCE TO GO WILD`,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { poiType, poiName, distance } = req.body;

    if (!poiType || !poiName || distance === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = POI_PROMPTS[poiType] || POI_PROMPTS['random'];

    const systemPrompt = `You are a chaos agent creating MEMORABLE challenges for an adventure app.

${EXAMPLE_CHALLENGES}

${prompt}

POI Name: "${poiName}"
Distance: ${Math.round(distance)}m

RULES FOR AMAZING CHALLENGES:
1. Be SPECIFIC not generic ("order in pirate accent" not "order creatively")
2. Add PERSONALITY and ATTITUDE to every challenge
3. Make people LAUGH while reading it
4. Create a STORY people want to share
5. Be slightly ABSURD but totally doable in 30 seconds
6. Use ACTIVE, FUN language (ban: perform, engage, capture, document, express)
7. Give CLEAR, WEIRD instructions
8. Add unexpected TWISTS

BANNED PHRASES (too boring):
- "Engage your audience"
- "Capture the moment"
- "Express yourself"
- "Showcase your"
- "Demonstrate your"
- "Share your experience"

GOOD PHRASES (exciting):
- "Commit to the bit"
- "Make someone laugh"
- "Own the absurdity"
- "Fake it till you make it"
- "Channel your inner [character]"
- "React like [emotion]"

Format your response EXACTLY as:
Title: [SHORT PUNCHY NAME - 2-4 WORDS MAX]
Description: [30-second challenge that makes people smile, max 140 chars]
Reward: [number 1-10 based on social courage + absurdity level]`;

    console.log(`🎨 Generating FUN challenge for ${poiType} at ${poiName}...`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate one wildly fun challenge that people will actually want to do.' },
      ],
      max_tokens: 150,
      temperature: 1.3, // Increased for more creativity
      top_p: 0.95,
      presence_penalty: 0.8, // Higher to force more unique ideas
      frequency_penalty: 0.5,
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse the response
    const lines = content.split('\n').filter((line: string) => line.trim());
    let title = '';
    let description = '';
    let reward = 80;

    for (const line of lines) {
      if (line.startsWith('Title:')) {
        title = line.replace('Title:', '').trim();
      } else if (line.startsWith('Description:')) {
        description = line.replace('Description:', '').trim();
      } else if (line.startsWith('Reward:')) {
        const rewardMatch = line.match(/\d+/);
        if (rewardMatch) {
          reward = parseInt(rewardMatch[0]);
        }
      }
    }

    if (!title || !description) {
      console.warn('Failed to parse AI response, using fallback');
      return res.status(200).json({
        title: 'COFFEE HEIST',
        description: 'Order in a fake accent. Commit 100%. Make the barista laugh or fail the mission',
        reward: 85,
        fallback: true,
      });
    }

    // Adjust reward based on distance
    const distanceMultiplier = distance > 1000 ? 1.5 : distance > 500 ? 1.2 : 1;
    reward = Math.round(reward * distanceMultiplier);

    console.log(`✅ Generated: ${title}`);

    return res.status(200).json({ title, description, reward, fallback: false });
  } catch (error) {
    console.error('Error generating AI challenge:', error);
    return res.status(500).json({
      error: 'Failed to generate challenge',
      title: 'INVISIBLE PET',
      description: 'Walk an invisible dog. Pick up invisible poop. Wave at people who stare',
      reward: 90,
      fallback: true,
    });
  }
}
