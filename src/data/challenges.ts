export type Challenge = {
  title: string;
  description: string;
};

export const monthlyChallenges: Challenge[] = [
  { 
    title: 'January: Polar Bear Challenge', 
    description: 'Take a full immersion swim in an outdoor body of water during winter. Show your preparation, immersion, and reaction afterward.'
  },
  { 
    title: 'February: Love Ambassador', 
    description: 'Organize a "love event" where at least 10 strangers share what love means to them. Create a montage of their responses.'
  },
  { 
    title: 'March: Urban Marathon', 
    description: 'Visit and document 26 distinct neighborhoods or districts in your city in a single day, spending at least 10 minutes in each.'
  },
  { 
    title: 'April: Fool\'s Festival', 
    description: 'Organize a small public event with games or activities centered around playful foolishness. Get at least 15 participants.'
  },
  { 
    title: 'May: Nature Immersion', 
    description: 'Spend 24 consecutive hours in nature without digital technology. Document your experience and what you learned.'
  },
  { 
    title: 'June: Cultural Fusion', 
    description: 'Organize a public multicultural exchange with at least 5 people from different cultural backgrounds sharing elements of their culture.'
  },
  { 
    title: 'July: Peak Performance', 
    description: 'Reach the highest point in your region (mountain, hill, or tall building if urban). Document the entire journey from preparation to summit.'
  },
  { 
    title: 'August: Water Challenge', 
    description: 'Travel a significant distance (at least 5km) on water using a non-motorized vessel (kayak, paddleboard, etc.). Show your journey.'
  },
  { 
    title: 'September: Knowledge Quest', 
    description: 'Learn a complex skill from a master or expert in your city. Document your learning process and demonstrate your new skill.'
  },
  { 
    title: 'October: Fear Factor Extreme', 
    description: 'Face your biggest fear in a significant way. Document your preparation, the experience itself, and your reflection afterward.'
  },
  { 
    title: 'November: Kindness Campaign', 
    description: 'Perform 30 meaningful acts of kindness in 30 days, documenting each one. Create a final compilation showing the impact.'
  },
  { 
    title: 'December: Survival Challenge', 
    description: 'Survive for 48 hours using only $10 for all your needs (food, shelter, etc.). Document your strategies and experience.'
  }
];

export const dailyChallenges: Challenge[] = [
  // SOCIAL DARES (95 challenges)
  { title: 'High Five Chain', description: 'Get 5 consecutive high fives from strangers in 30 seconds. Must show each reaction!' },
  { title: 'Compliment Cascade', description: 'Give genuine compliments to 3 strangers and capture their reactions (with permission).' },
  { title: 'Dance Contagion', description: 'Start dancing in public and get at least one stranger to join you (even briefly).' },
  { title: 'Human Statue', description: 'Freeze in a dramatic pose in a busy area for 30 seconds. Capture people\'s reactions.' },
  { title: 'Stranger Selfie', description: 'Convince a stranger to take a creative selfie with you (get permission first).' },
  { title: 'Accent Challenge', description: 'Order something at a shop/cafe in an accent completely different from your own.' },
  { title: 'Reverse Direction', description: 'Walk against the flow of pedestrian traffic for 30 seconds without colliding with anyone.' },
  { title: 'Phone a Friend', description: 'Call an old friend you haven\'t spoken to in months and catch up for 30 seconds.' },
  { title: 'Flash Choir', description: 'Start singing in public and try to get at least one person to join in.' },
  { title: 'Stranger Directions', description: 'Ask a stranger for directions to an obvious landmark that\'s visible from where you\'re standing.' },
  { title: 'Power Pose', description: 'Strike superhero poses in 3 different public locations within 30 seconds.' },
  { title: 'Public Limbo', description: 'Create an impromptu limbo bar in public and get at least one person to go under it.' },
  { title: 'Invisible Tug-of-War', description: 'Start an invisible tug-of-war and convince at least one stranger to join the other end.' },
  { title: 'Laugh Outbreak', description: 'Start laughing loudly in public and see if you can get others to laugh with you.' },
  { title: 'Secret Handshake', description: 'Create a complicated handshake and teach it to a willing stranger.' },
  { title: 'Eye Contact Contest', description: 'Have a 15-second staring contest with a willing stranger. Who will blink first?' },
  { title: 'Wave Chain', description: 'Wave enthusiastically at strangers until at least 3 people wave back.' },
  { title: 'Conga Line', description: 'Start a conga line in public and get at least 2 strangers to join.' },
  { title: 'Mirror Mirror', description: 'Secretly mirror a stranger\'s movements until they notice (respectfully, not mockingly).' },
  { title: 'Quick Poll', description: 'Ask 5 strangers the same unusual but innocent question and compare their answers.' },
  { title: 'Smile Campaign', description: 'Make at least 7 people smile in 30 seconds without speaking.' },
  { title: 'Interpretive Dance', description: 'Perform an interpretive dance based on something in your environment. Get a reaction!' },
  { title: 'Random Applause', description: 'Start applauding for no reason in public and get others to join in.' },
  { title: 'Tourist Trick', description: 'Pretend to be a tourist and ask locals about obvious landmarks. Record their helpful responses!' },
  { title: 'Thumb Wrestler', description: 'Challenge a stranger to a thumb wrestling match. Best 2 out of 3!' },
  { title: 'Spontaneous Celebration', description: 'Start celebrating as if you just received amazing news and get strangers to congratulate you.' },
  { title: 'Imaginary Friend', description: 'Have a full conversation with an imaginary friend in public. Capture onlookers\' reactions.' },
  { title: 'Slow-Mo Heroes', description: 'Walk in dramatic slow motion with at least one stranger joining you.' },
  { title: 'Freeze Tag', description: 'Play a quick game of freeze tag with at least 2 willing strangers.' },
  { title: 'Human Mirror', description: 'Stand back-to-back with a stranger and try to mimic each other\'s movements while facing away.' },
  { title: 'Public Proposal', description: 'Stage a fake (but convincing) marriage proposal in public with a willing participant.' },
  { title: 'Invisible Basketball', description: 'Start an invisible basketball game and get a stranger to play with you.' },
  { title: 'Fist Bump Frenzy', description: 'Get 10 fist bumps from different strangers in 30 seconds.' },
  { title: 'Signature Collector', description: 'Get 3 strangers to sign your "autograph book" as if they were celebrities.' },
  { title: 'International Greeter', description: 'Say hello to strangers in 5 different languages. Document their responses.' },
  { title: 'Synchronize Watches', description: 'Approach strangers to urgently "synchronize watches" for a "mission."' },
  { title: 'Stranger\'s Choice', description: 'Let 3 different strangers each tell you to do something (appropriate) and do it immediately.' },
  { title: 'Hat Swap', description: 'Convince a stranger wearing a hat to swap headwear with you for 30 seconds.' },
  { title: 'Flash Debate', description: 'Start a friendly 30-second debate with a stranger on a light-hearted topic.' },
  { title: 'Fake Celebrity', description: 'Pretend to be a minor celebrity and see if you can get a stranger to "recognize" you.' },
  { title: 'Fortune Teller', description: 'Set up as an impromptu fortune teller and read a stranger\'s palm or fortune.' },
  { title: 'Stranger\'s Story', description: 'Get a stranger to tell you an interesting story from their life in 30 seconds.' },
  { title: 'Group Photo', description: 'Gather at least 5 strangers for a group photo pretending you\'re all old friends.' },
  { title: 'Quick Interview', description: 'Conduct a mock TV interview with a willing stranger about their day.' },
  { title: 'Silent Communication', description: 'Have a 30-second "conversation" with a stranger using only gestures, no words.' },
  { title: 'Public Confession', description: 'Make a harmless, humorous "public confession" and get reactions.' },
  { title: 'Stranger\'s Advice', description: 'Ask 3 different strangers for advice on the same minor life decision. Compare answers!' },
  { title: 'Group Hug', description: 'Organize a group hug with at least 3 willing strangers.' },
  { title: 'Personal Hype', description: 'Get a stranger to hype you up/introduce you as if you\'re about to give a major performance.' },
  { title: 'Instant Best Friend', description: 'Approach a stranger and interact as if you\'ve been best friends for years.' },
  { title: 'Paper Airplane Messages', description: 'Write nice messages on paper airplanes and fly them to strangers.' },
  { title: 'Name Game', description: 'Meet 5 new people and memorize all their names. Recite them at the end of your video.' },
  { title: 'Fast Friends', description: 'Find a stranger and ask 3 progressively deeper questions to become quick friends.' },
  { title: 'Human Chain', description: 'Create a human chain across a public space with at least 4 willing strangers.' },
  { title: 'Whisper Challenge', description: 'Play the whisper challenge with 2 strangers, passing a message down the line.' },
  { title: 'Public Karaoke', description: 'Sing a popular song in public and get at least one person to sing along with you.' },
  { title: 'Stranger\'s Talent', description: 'Find a stranger willing to demonstrate a talent or skill they possess.' },
  { title: 'Human Knot', description: 'Form a human knot with at least 3 strangers and try to untangle yourselves.' },
  { title: 'Air Band', description: 'Start an "air band" in public and recruit at least 2 strangers to join your band.' },
  { title: 'Rock Paper Scissors Tournament', description: 'Challenge 5 different strangers to quick rock-paper-scissors matches.' },
  { title: 'Stranger\'s Language', description: 'Find someone who speaks a language you don\'t know and learn 3 phrases from them.' },
  { title: 'Surprise Party', description: 'Convince at least 3 strangers to help you throw a 30-second "surprise party" for another stranger.' },
  { title: 'Improv Scene', description: 'Create a 30-second improvised scene with at least one willing stranger.' },
  { title: 'Confidence Boost', description: 'Give confidence-boosting pep talks to 3 strangers. Record their reactions.' },
  { title: 'Stranger\'s Secret', description: 'Get 3 strangers to whisper a harmless secret into your ear.' },
  { title: 'Joke Exchange', description: 'Exchange jokes with 3 different strangers. Who has the best one?' },
  { title: 'Back Story', description: 'Approach a stranger and start a conversation as if you\'re continuing from yesterday.' },
  { title: 'Reverse Introduction', description: 'Get 3 strangers to introduce themselves to you instead of the other way around.' },
  { title: 'Restaurant Hop', description: 'Visit 3 restaurants in 30 seconds and ask each host for their dinner recommendation.' },
  { title: 'Rapid Fire Compliments', description: 'Give 10 different compliments to 10 different people in 30 seconds.' },
  { title: 'Language Barrier', description: 'Pretend you don\'t speak the local language and communicate with a stranger using only gestures.' },
  { title: 'Partner Swap', description: 'Approach a couple and ask to "borrow" one person for your 30-second video.' },
  { title: 'Counting Chorus', description: 'Get a group of at least 5 strangers to count loudly from 1 to 10 together.' },
  { title: 'Mystery Box', description: 'Carry a box and ask strangers to reach in without looking. Fill it with something harmless but surprising.' },
  { title: 'Stranger\'s Pose', description: 'Ask 3 strangers to show you their best pose and mimic them perfectly.' },
  { title: 'Guess My Job', description: 'Ask 5 strangers to guess what you do for a living based just on looking at you.' },
  { title: 'Photo Director', description: 'Direct 3 strangers to pose for an artistic photo following your specific instructions.' },
  { title: 'Accent Adaptor', description: 'Speak to 3 different strangers in 3 different accents. See if they notice the changes.' },
  { title: 'Spontaneous Dating', description: 'Create an impromptu "speed dating" setup and get at least 2 strangers to participate.' },
  { title: 'Workout Buddy', description: 'Start exercising in public and get at least 2 strangers to join your "workout class."' },
  { title: 'Poetry Slam', description: 'Recite a spontaneous poem about a stranger (with their permission) in a public place.' },
  { title: 'Hand Holding Chain', description: 'Create a hand-holding chain with at least 4 strangers crossing a street or space together.' },
  { title: 'Playground Adults', description: 'Get 3 adults to join you in using playground equipment meant for children.' },
  { title: 'Wake Up Call', description: 'Pretend to wake up confused in a public place and ask strangers what year it is.' },
  { title: 'Stranger\'s Orders', description: 'Let 3 strangers each give you a simple command that you must follow immediately.' },
  { title: 'Memory Test', description: 'Meet a stranger, exchange 5 facts about yourselves, then test each other\'s memory.' },
  { title: 'Cheerleading Squad', description: 'Create an impromptu cheerleading routine and get at least 2 strangers to join.' },
  { title: 'Cultural Exchange', description: 'Find someone from another culture and exchange a tradition, phrase, or custom.' },
  { title: 'Finger Pyramid', description: 'Create a finger pyramid (touching index fingers) with at least 3 strangers simultaneously.' },
  { title: 'Public Pranking', description: 'Pull a harmless prank on a friend in public and capture strangers\' reactions.' },
  { title: 'Stranger\'s Outfit', description: 'Compliment 5 strangers on specific elements of their outfit. Get their reactions!' },
  { title: 'Trust Fall', description: 'Perform a trust fall with a willing stranger (safely and with warning).' },
  { title: 'Human Clock', description: 'Get 12 strangers to represent hours on a clock and stand in the correct positions.' },
  { title: 'Invisible Gift', description: 'Give "invisible gifts" to 5 strangers and record their reactions and "thank yous."' },
  
  // ADVENTURE & DARING CHALLENGES (90 challenges)
  { title: 'Urban Summit', description: 'Climb the highest accessible point in your immediate area (stairs, hill, etc.) and shout "I made it!"' },
  { title: 'Wrong Way', description: 'Take the first path, alley, or street you\'ve never traveled before and discover what\'s there.' },
  { title: 'Puddle Jumper', description: 'Find and jump over (or into) the biggest puddle you can find today.' },
  { title: 'Snack Roulette', description: 'Go into a store and buy the weirdest snack you can find. Try it on camera.' },
  { title: 'Free Fall', description: 'Find something at least 3 meters high (wall, platform, etc.) and safely jump off it.' },
  { title: 'Counter Culture', description: 'Do something that goes against the social norm (safely and respectfully).' },
  { title: 'Hidden Passage', description: 'Find and traverse a "shortcut" you\'ve never used before in your city.' },
  { title: 'Roll the Dice', description: 'Let a dice roll decide what you do next - show your dice and your spontaneous activity.' },
  { title: 'Upside Down', description: 'Do a handstand or headstand against a wall in a public place.' },
  { title: 'Balance Beam', description: 'Walk along a narrow wall, curb, or rail for at least 10 meters without falling.' },
  { title: 'Secret Agent', description: 'Follow a stranger (at a respectful distance) for 1 minute without being noticed. NO CREEPING.' },
  { title: 'Barefoot Explorer', description: 'Remove your shoes and walk barefoot through 3 different urban textures.' },
  { title: 'Cold Plunge', description: 'Submerge yourself in cold water (fountain, lake, ocean, etc.) for at least 5 seconds.' },
  { title: 'Free Ride', description: 'Convince someone with a bicycle, scooter, or skateboard to let you borrow it for 20 seconds.' },
  { title: 'Speed Demons', description: 'Challenge a stranger to a spontaneous 10-second race.' },
  { title: 'Phone Swap', description: 'Convince a stranger to briefly swap phones with you to take each other\'s selfies.' },
  { title: 'Food Fusion', description: 'Combine two completely different foods and eat the creation on camera.' },
  { title: 'Get Carried', description: 'Convince someone to carry you for at least 5 steps (safely).' },
  { title: 'Crowd Surfing', description: 'Get at least 3 people to "crowd surf" you horizontally for a few seconds.' },
  { title: 'Human Pyramid', description: 'Form a human pyramid with at least 2 other willing participants.' },
  { title: 'Stranger\'s Sunglasses', description: 'Borrow and wear a stranger\'s sunglasses for your 30-second clip.' },
  { title: 'Urban Cave', description: 'Find and explore a small urban "cave" (underpass, alcove, etc.) you\'ve never entered before.' },
  { title: 'Parkour Basics', description: 'Perform a basic parkour move (safety roll, precision jump, etc.) in an urban setting.' },
  { title: 'Tree Climber', description: 'Climb a tree in a public place and wave to passersby from above.' },
  { title: 'Fountain Splash', description: 'Splash water from a public fountain without getting completely soaked.' },
  { title: 'Door Dasher', description: 'Enter and exit 5 different public buildings within 30 seconds.' },
  { title: 'Reverse Shopping', description: 'Go through a store in reverse, walking backward the entire time.' },
  { title: 'Car Horn Symphony', description: 'Get 3 different drivers to honk their horns in sequence (without causing traffic issues).' },
  { title: 'Urban Wildlife', description: 'Track and document an urban animal (squirrel, bird, etc.) for 30 seconds.' },
  { title: 'Roof Access', description: 'Legally access a rooftop you\'ve never been on and show the view.' },
  { title: 'Weather Embracer', description: 'Whatever the weather, embrace it fully – dance in rain, make snow angels, sun worship, etc.' },
  { title: 'Tunnel Echo', description: 'Find a tunnel or underpass and create the most impressive echo you can.' },
  { title: 'Water Crossing', description: 'Cross a body of water without using a bridge (stepping stones, shallow wade, etc.).' },
  { title: 'Public Napper', description: 'Find an unusual but comfortable public place to take a 10-second "power nap."' },
  { title: 'Coin Flip Decision', description: 'Make every decision for 30 seconds based on coin flips. Show the results!' },
  { title: 'Urban Camouflage', description: 'Blend in so well with your environment that you\'re hard to spot in the video.' },
  { title: 'Floor is Lava', description: 'Cross a public space pretending the floor is lava (don\'t touch the ground!).' },
  { title: 'Stranger\'s Photo', description: 'Ask a stranger to take your photo in 5 different poses in 30 seconds.' },
  { title: 'Backward Day', description: 'Walk backward for 100 steps in a public place without colliding with anything.' },
  { title: 'Invisible Obstacle', description: 'Navigate an "invisible obstacle course" in public, jumping and dodging imaginary barriers.' },
  { title: 'Wrong Order', description: 'Order something that clearly isn\'t on the menu at a food establishment.' },
  { title: 'Payphone Hunter', description: 'Find a payphone or public phone and make a call (even if just to your own phone).' },
  { title: 'Animal Walk', description: 'Cross a public space walking like 3 different animals. Capture reactions!' },
  { title: 'Urban Archaeology', description: 'Dig up (or pretend to excavate) something in a public space as if you\'re an archaeologist.' },
  { title: 'Public Transportation Challenge', description: 'Use 3 different forms of public transportation within 30 minutes.' },
  { title: 'Stair Master', description: 'Run up and down the longest staircase you can find without stopping.' },
  { title: 'Stranger\'s Dare', description: 'Ask 3 strangers to each dare you to do something (appropriate), then do all three.' },
  { title: 'Free Fall Feeling', description: 'Create the sensation of free-falling (safely) in a public place.' },
  { title: 'Invisible Car', description: 'Pretend to drive an invisible car through a pedestrian area, with sound effects.' },
  { title: 'Wall Runner', description: 'Run up a wall and attempt a parkour wall flip (safely or modified for your ability).' },
  { title: 'Trash Can Basketball', description: 'Make 3 "basketball shots" into public trash cans from increasing distances.' },
  { title: 'One Wheel Wonder', description: 'Find someone with a unicycle, skateboard, or similar and attempt to ride it (with permission).' },
  { title: 'Tight Rope Walker', description: 'Walk a "tight rope" (curb, painted line, etc.) for 20 meters without stepping off.' },
  { title: 'Urban Fishing', description: 'Pretend to fish in an urban water feature. See if anyone asks what you\'re catching!' },
  { title: 'Invisible Box', description: 'Perform the "invisible box" trick where you pretend to step onto an invisible box.' },
  { title: 'Food Challenger', description: 'Try the spiciest or most unusual food item at a local restaurant.' },
  { title: 'Random Bus', description: 'Get on the next public bus that arrives, regardless of its destination. Ride for one stop.' },
  { title: 'Barrier Jumper', description: 'Jump over 5 different barriers or obstacles in an urban environment (safely and legally).' },
  { title: 'Sign Climber', description: 'Climb onto a public sign or monument (if safe and legal) and strike a pose.' },
  { title: 'Bathroom Break', description: 'Find and rate the 3 most unusual public bathrooms in your immediate area.' },
  { title: 'Urban Scavenger', description: 'Find 5 specific items in an urban environment within 30 seconds.' },
  { title: 'Cart Racer', description: 'Race a shopping cart (or similar) down a (safe) slope or around a parking lot.' },
  { title: 'Bubble Invasion', description: 'Fill a public space with bubbles and capture people\'s reactions.' },
  { title: 'Quick Change', description: 'Change your outfit completely in a public place (while remaining decent) in under 30 seconds.' },
  { title: 'Blind Navigator', description: 'Navigate through a public space blindfolded for 30 seconds (with a spotter for safety).' },
  { title: 'Revolving Door Loop', description: 'Go through a revolving door at least 5 times consecutively.' },
  { title: 'Rain Dance', description: 'Perform a "rain dance" in public – if it actually rains, bonus points!' },
  { title: 'Elevator Entertainer', description: 'Entertain people in an elevator for one full ride with a performance of your choice.' },
  { title: 'Hidden Message', description: 'Leave hidden messages in 3 public places for strangers to find.' },
  { title: 'Mannequin Challenge', description: 'Freeze completely in a busy public place and hold it for 30 seconds.' },
  { title: 'Penny Stacker', description: 'Stack at least 10 coins in a precarious public location without them falling.' },
  { title: 'Invisible Tennis', description: 'Play an intense match of "invisible tennis" in a public place. Get a stranger to join!' },
  { title: 'Rolling Down Hill', description: 'Find a (safe, grassy) hill in an urban area and roll all the way down it.' },
  { title: 'Ceiling Toucher', description: 'Touch the ceiling in 5 different public buildings in 30 minutes.' },
  { title: 'Shadow Chaser', description: 'Chase your shadow for 30 seconds in a public place, trying different moves to "escape" it.' },
  { title: 'Mirror World', description: 'Visit a location with many mirrors and create an interesting "infinity" effect.' },
  { title: 'Escalator Salmon', description: 'Walk up a down escalator or down an up escalator (safely, without disrupting others).' },
  { title: 'Coin Collector', description: 'Find 5 coins on the ground in public places within 30 minutes.' },
  { title: 'Plant Whisperer', description: 'Have a full, earnest conversation with a plant in a public place.' },
  { title: 'Railing Slider', description: 'Slide down a handrail or railing (safely) in a public place.' },
  { title: 'Leap of Faith', description: 'Take a dramatic leap from one safe platform to another in a public space.' },
  { title: 'Sound Explorer', description: 'Create 5 different unusual sounds using only objects found in your environment.' },
  { title: 'Public Exercise', description: 'Do an unusual exercise routine in a public place for 30 seconds.' },
  { title: 'Spontaneous Tour Guide', description: 'Give a completely improvised 30-second tour of a public place to strangers.' },
  { title: 'Hidden Entrance', description: 'Find and use an unusual or little-known entrance to a public building.' },
  
  // CREATIVITY & EXPRESSION CHALLENGES (90 challenges)
  { title: 'Chalk Takeover', description: 'Create a colorful chalk message/drawing in a public space (where permitted).' },
  { title: 'Trash Transformation', description: 'Turn a piece of litter into art or something useful on the spot.' },
  { title: 'Unplanned Percussion', description: 'Create a 20-second beat using only objects found around you.' },
  { title: 'Public Poetry', description: 'Write a quick poem about what you see and recite it to at least one stranger.' },
  { title: 'Sound Safari', description: 'Recreate 3 urban sounds using only your voice, have a stranger guess what they are.' },
  { title: 'Photo Bomb', description: 'Subtly (and respectfully) photo bomb someone\'s picture with permission to show the result.' },
  { title: 'Invisible Object', description: 'Pretend to pass around an invisible object with at least 2 strangers.' },
  { title: 'Quick Disguise', description: 'Transform your appearance in 30 seconds using only items you find around you.' },
  { title: 'Air Artist', description: 'Create an elaborate "air drawing" and get a stranger to guess what you drew.' },
  { title: 'Slow Motion', description: 'Cross a busy area in dramatic slow motion without breaking character.' },
  { title: 'Shadow Puppets', description: 'Create an elaborate shadow puppet show on a wall using just your hands and a light source.' },
  { title: 'Street Florist', description: 'Create a beautiful bouquet using only plants and flowers found in public spaces (no picking from gardens).' },
  { title: 'Human Jukebox', description: 'Offer to sing any song requested by strangers – attempt at least 3 different songs.' },
  { title: 'Invisible Orchestra', description: 'Conduct an "invisible orchestra" in public and get at least one person to join your ensemble.' },
  { title: 'Urban Color Hunt', description: 'Find objects representing all colors of the rainbow in an urban environment within 30 seconds.' },
  { title: 'Street Mime', description: 'Perform as a mime for 30 seconds in a public space, interacting with passersby.' },
  { title: 'Environmental Art', description: 'Create a small piece of art using only natural materials found in your immediate environment.' },
  { title: 'Dance Styles', description: 'Perform 5 different dance styles in 30 seconds in a public place.' },
  { title: 'Found Object Music', description: 'Create a musical instrument from objects found in your environment and play a short tune.' },
  { title: 'Portrait Artist', description: 'Draw a quick portrait of a willing stranger in a public place.' },
  { title: 'Improvised Song', description: 'Create and perform a song about what\'s happening around you in real-time.' },
  { title: 'Stranger\'s Voice', description: 'Interview a stranger and then tell their story using their voice and mannerisms.' },
  { title: 'Public Catwalk', description: 'Turn a public walkway into a fashion runway and strut your stuff for 30 seconds.' },
  { title: 'Voice Effects', description: 'Narrate what\'s happening around you using 5 different voice effects or accents.' },
  { title: 'Leaf Art', description: 'Create a recognizable image or pattern using only fallen leaves.' },
  { title: 'Sign Language', description: 'Learn and perform a simple phrase in sign language in a public place.' },
  { title: 'Light Painting', description: 'Create a "light painting" in the dark using a phone or flashlight.' },
  { title: 'Public Storyteller', description: 'Tell an impromptu 30-second story to at least 3 strangers.' },
  { title: 'Architecture Critic', description: 'Give an impromptu architectural critique of a building in your city.' },
  { title: 'Color Coordinator', description: 'Arrange objects you find in a public space by color to create a rainbow or gradient.' },
  { title: 'Water Calligraphy', description: 'Write a message using water and a finger or brush on a dry surface.' },
  { title: 'Pattern Hunter', description: 'Find and document 5 different patterns in your urban environment within 30 seconds.' },
  { title: 'Stick Art', description: 'Create a small sculpture or design using only sticks and twigs found nearby.' },
  { title: 'Voice Projection', description: 'Project your voice to be heard at least 20 meters away in a public space.' },
  { title: 'Pop-up Installation', description: 'Create a small, temporary art installation in a public space using found objects.' },
  { title: 'Interpretive Pedestrian', description: 'Cross a street or public space in an extremely unique or interpretive way.' },
  { title: 'Symmetry Creator', description: 'Create a perfectly symmetrical design using objects found in your environment.' },
  { title: 'Voice-Over Narrator', description: 'Narrate the actions of people in public (respectfully) as if it\'s a nature documentary.' },
  { title: 'Urban Canvas', description: 'Use a public space as your "canvas" and create a design using your movement (tracked on video).' },
  { title: 'Sound Collage', description: 'Create a 30-second "sound collage" by recording different urban sounds.' },
  { title: 'Mannequin Pose-Off', description: 'Pose exactly like mannequins in a store window (without disturbing the display).' },
  { title: 'Quick Portrait', description: 'Get 3 strangers to pose for rapid-fire portrait photos in creative poses.' },
  { title: 'Urban Alphabet', description: 'Find objects in your environment that form each letter of your name.' },
  { title: 'Paper Airplane Message', description: 'Write an uplifting message on a paper airplane and launch it in a public space.' },
  { title: 'Headline Creator', description: 'Create an outrageous newspaper headline about what\'s happening around you and "report" it.' },
  { title: 'Found Poem', description: 'Create a poem using only text you find in your environment (signs, advertisements, etc.).' },
  { title: 'DIY Instrument', description: 'Make a musical instrument from urban materials and play a recognizable tune.' },
  { title: 'Photo Series', description: 'Create a 5-photo series that tells a story about your location in 30 seconds.' },
  { title: 'Body Percussion', description: 'Create a 30-second rhythm using only body percussion and get someone to dance to it.' },
  { title: 'Shape Hunter', description: 'Find 5 perfect geometric shapes in your urban environment within 30 seconds.' },
  { title: 'Urban Choreographer', description: 'Create a dance that incorporates 3 elements of the urban landscape around you.' },
  { title: 'Living Statue', description: 'Pose as a living statue for 30 seconds in a busy area and capture people\'s reactions.' },
  { title: 'Reflection Art', description: 'Create an interesting image using reflections in windows, puddles, or mirrors.' },
  { title: 'Forced Perspective', description: 'Create 3 different forced perspective photo illusions in your environment.' },
  { title: 'Urban Beat', description: 'Create a beat using only sounds from your urban environment (no instruments).' },
  { title: 'Hands-Free Challenge', description: 'Complete a simple task without using your hands, in a creative way.' },
  { title: 'Cartoon Voice', description: 'Interact with at least 3 strangers using only a cartoon character voice.' },
  { title: 'Urban Collage', description: 'Create a quick collage using only items found in your immediate environment.' },
  { title: 'Text Hunter', description: 'Find text in your environment that unintentionally forms a funny or meaningful message.' },
  { title: 'Spontaneous Haiku', description: 'Create and recite a haiku about your current location to at least one stranger.' },
  { title: 'Sound Effects', description: 'Add live sound effects to everyday actions happening around you.' },
  { title: 'Hidden Face', description: 'Take creative photos where your face is hidden behind objects in the environment.' },
  { title: 'Photo Challenge', description: 'Get 3 strangers to each take a creative photo of you following your specific instructions.' },
  { title: 'Color Story', description: 'Tell a 30-second story using only objects of a specific color in your environment.' },
  { title: 'Sidewalk Gallery', description: 'Create a temporary "art gallery" on a sidewalk using found objects arranged deliberately.' },
  { title: 'Pocket Exhibition', description: 'Create an "art exhibition" using only items you have in your pockets or bag.' },
  { title: 'Urban Echo', description: 'Find a space with interesting acoustics and use it to create unusual sounds.' },
  { title: 'Sticker Story', description: 'If you have stickers, create a small story using them in a public space (removable only).' },
  { title: 'Typography Safari', description: 'Find 10 different and interesting examples of typography in your environment.' },
  { title: 'Reverse Song', description: 'Sing a popular song backwards in public and see if anyone recognizes it.' },
  { title: 'Nature in City', description: 'Find and artistically document 5 examples of nature reclaiming urban spaces.' },
  { title: 'Body Letters', description: 'Use your body to form all the letters needed to spell your name.' },
  { title: 'Monochrome Challenge', description: 'Collect and arrange objects of a single color from your environment.' },
  { title: 'Road Calligraphy', description: 'Use your walking path to "write" a word or draw a shape (tracked on your video).' },
  { title: 'Hand Art', description: 'Create an interesting image or pattern using just handprints (on a safe, appropriate surface).' },
  { title: 'One-minute Makeover', description: 'Give a willing participant a quick "makeover" using only items found around you.' },
  { title: 'Rock Balancing', description: 'Create a balanced stack of rocks or urban objects that seems to defy gravity.' },
  { title: 'Time-lapse Creator', description: 'Create a simple 30-second time-lapse of a busy urban area.' },
  { title: 'Voice Transformer', description: 'Have a conversation with strangers while progressively changing your voice throughout.' },
  { title: 'Finger Dancer', description: 'Create an elaborate dance using only your fingers as the dancers on a flat surface.' },
  { title: 'Cloud Interpreter', description: 'Find shapes in the clouds and get at least 2 strangers to tell you what they see.' },
  { title: 'Shadow Creator', description: 'Create interesting shadows using your body and the available light.' },
  { title: 'Balloon Artist', description: 'If you have a balloon, create a simple balloon animal or object in public.' },
  { title: 'Hidden Talent', description: 'Demonstrate a hidden talent in public and get reactions from at least 3 people.' },
  { title: 'Mouth Musician', description: 'Create a 30-second song using only sounds you can make with your mouth.' },
  { title: 'Improvised Concert', description: 'Turn everyday objects around you into instruments and perform a short "concert".' },
  
  // KINDNESS & CONNECTION CHALLENGES (90 challenges)
  { title: 'Flower Gift', description: 'Find or buy a flower and give it to a stranger with a kind message.' },
  { title: 'Pedestrian Helper', description: 'Help 3 people cross a street, carry groceries, or with another simple task.' },
  { title: 'Street Performer Boost', description: 'Find a street performer, join their audience, and get 3 others to watch too.' },
  { title: 'Joy Outbreak', description: 'Make at least 3 strangers laugh or smile within 30 seconds.' },
  { title: 'Spontaneous Gift', description: 'Give away something you have on you to a stranger who might appreciate it.' },
  { title: 'Gratitude Express', description: 'Thank a service worker (barista, bus driver, etc.) in an elaborate, memorable way.' },
  { title: 'Chair Puller', description: 'Pull out chairs for 3 different people in 30 seconds (with permission).' },
  { title: 'Door Holder', description: 'Hold the door for at least 5 people entering a building, with a unique greeting for each.' },
  { title: 'Sidewalk Sweep', description: 'Clean up a small area of a public space for 30 seconds.' },
  { title: 'Tip Booster', description: 'Leave an unusually generous tip for a small purchase and capture the reaction.' },
  { title: 'Public Defender', description: 'Stand up for someone being treated unfairly in public (when safe to do so).' },
  { title: 'Happiness Patrol', description: 'Offer free high-fives to everyone who passes you for 30 seconds.' },
  { title: 'Water Provider', description: 'Give away bottles of water to people who look like they need refreshment.' },
  { title: 'Conversation Starter', description: 'Start conversations with 3 people who look lonely or bored.' },
  { title: 'Secret Note', description: 'Leave a positive, anonymous note for someone to find.' },
  { title: 'Photo Volunteer', description: 'Offer to take photos for 3 groups of tourists you see struggling with selfies.' },
  { title: 'Micro-Library', description: 'Leave a book you\'ve enjoyed in a public place with a note inviting someone to read it.' },
  { title: 'Pay It Forward', description: 'Pay for a stranger\'s coffee, toll, or small item and ask them to pay it forward.' },
  { title: 'Umbrella Sharer', description: 'Share your umbrella with a stranger caught in the rain.' },
  { title: 'Surprise Performer', description: 'Perform a song, poem, or dance specifically to cheer up someone who looks sad.' },
  { title: 'Plant Caretaker', description: 'Water plants in a public space that look like they need some care.' },
  { title: 'Lost & Found Creator', description: 'Create a small "lost & found" for items you notice left behind in a public space.' },
  { title: 'Encouragement Patrol', description: 'Find people exercising and cheer them on enthusiastically for 30 seconds.' },
  { title: 'Litter Collector', description: 'Pick up at least 10 pieces of litter in a public space in 30 seconds.' },
  { title: 'Food Sharer', description: 'Share food you have with someone who looks hungry (person or animal, as appropriate).' },
  { title: 'Digital Detox Helper', description: 'Create a "phone-free zone" and invite strangers to put down their devices and interact.' },
  { title: 'Language Helper', description: 'Help someone who is struggling with the local language to communicate.' },
  { title: 'Business Promoter', description: 'Promote a small local business to at least 5 people in 30 seconds.' },
  { title: 'Pet Complimenter', description: 'Compliment the pets of 5 different people you pass in 30 seconds.' },
  { title: 'Welcome Party', description: 'Create an impromptu "welcome party" for someone arriving at an airport, station, etc.' },
  { title: 'Street Librarian', description: 'Recommend books to at least 3 strangers based on a quick conversation about their interests.' },
  { title: 'Heritage Sharer', description: 'Share something about your cultural heritage with 3 strangers.' },
  { title: 'Genuine Question', description: 'Ask a genuine, thoughtful question to 3 different strangers and listen to their answers.' },
  { title: 'Tour Guide for Locals', description: 'Give a quick tour of a well-known local landmark to someone who lives in the area.' },
  { title: 'Quick Fix', description: 'Fix something small that\'s broken in a public space (with permission if required).' },
  { title: 'Direction Genius', description: 'Help 3 people find their way in 30 seconds, even if they didn\'t ask for directions.' },
  { title: 'Line Entertainer', description: 'Entertain people waiting in a long line for 30 seconds.' },
  { title: 'Street Therapist', description: 'Listen to a stranger\'s problem and offer sincere advice or encouragement.' },
  { title: 'Appreciation Notes', description: 'Write quick notes of appreciation for 3 service workers and give them directly.' },
  { title: 'Shopping Helper', description: 'Help someone carry groceries or packages to their car or home.' },
  { title: 'Translation Service', description: 'If you speak multiple languages, offer free translation help in a tourist area.' },
  { title: 'Coupon Fairy', description: 'Give coupons or discount codes you aren\'t going to use to strangers who can use them.' },
  { title: 'Public Thanks', description: 'Publicly thank someone who often goes unnoticed for their work.' },
  { title: 'Lost Item Finder', description: 'Help someone find something they\'ve lost in a public space.' },
  { title: 'Spare Change Collector', description: 'Collect spare change from willing donors and give it to someone in need.' },
  { title: 'Bike Pump Provider', description: 'If you have access to one, offer to pump up bicycle tires for cyclists in a park or bike path.' },
  { title: 'Plant Gifter', description: 'Give away a small plant or seeds to a stranger with care instructions.' },
  { title: 'Phone Charger', description: 'Offer your portable charger or charging cable to someone with a dying phone battery.' },
  { title: 'Small Business Reviewer', description: 'Write a positive online review for a local small business while you\'re there.' },
  { title: 'Grocery Divider', description: 'Let someone with fewer items go ahead of you in a checkout line.' },
  { title: 'Performer Tipper', description: 'Leave a generous tip for a street performer and encourage others to do the same.' },
  { title: 'Community Board Creator', description: 'Create a small, temporary community message board in a public space (where permitted).' },
  { title: 'Weather Protector', description: 'Help someone protect themselves or their belongings from sudden weather changes.' },
  { title: 'Train Seat Offerer', description: 'Give up your seat on public transportation to someone who needs it more.' },
  { title: 'Dog Walker', description: 'Offer to walk a stranger\'s dog for a few minutes (with their supervision).' },
  { title: 'Stress Reliever', description: 'Create a quick "stress relief" station in public with simple activities for passersby.' },
  { title: 'Bird Feeder', description: 'Create a small, temporary bird feeder in a public park using appropriate food.' },
  { title: 'Traffic Director', description: 'Help direct traffic or pedestrians during a busy time (when appropriate and safe).' },
  { title: 'Water Fountain Fixer', description: 'Clean a public drinking fountain before using it.' },
  { title: 'WiFi Sharer', description: 'Share your mobile hotspot with someone who needs internet access.' },
  { title: 'Sports Includer', description: 'Invite someone watching from the sidelines to join in a public sports game.' },
  { title: 'Gratitude Circle', description: 'Create a quick "gratitude circle" with strangers, each sharing one thing they\'re grateful for.' },
  { title: 'Shoelace Alerter', description: 'Politely inform people if their shoelaces are untied to prevent accidents.' },
  { title: 'Shopping Cart Returner', description: 'Return stray shopping carts to their proper place in a parking lot.' },
  { title: 'Accessibility Helper', description: 'Make a public space more accessible by removing obstacles or holding doors.' },
  { title: 'Prayer Offerer', description: 'Respectfully offer to pray for or with people in need of spiritual support.' },
  { title: 'Map Creator', description: 'Draw a helpful map for a lost tourist showing local landmarks and destinations.' },
  { title: 'Local Guide', description: 'Give insider tips to tourists about hidden gems in your city.' },
  { title: 'Photographer For Hire', description: 'Offer free "professional" photos to couples or families you see in a scenic spot.' },
  { title: 'Celebration Starter', description: 'Help a stranger celebrate a personal achievement or special day.' },
  { title: 'Food Server', description: 'Help serve food at a busy restaurant or cafe for a few minutes (with permission).' },
  { title: 'Toy Repair', description: 'Fix a child\'s broken toy in a park or public space (with parent\'s permission).' },
  { title: 'Medicine Cabinet', description: 'Offer basic first aid supplies (bandages, pain relievers, etc.) to someone in need.' },
  { title: 'Mood Booster', description: 'Compliment at least 10 different people within 30 seconds.' },
  { title: 'Wish Granter', description: 'Ask 3 strangers what small wish you could grant them today, then try to fulfill one.' },
  { title: 'Meetup Creator', description: 'Create a spontaneous "meetup" for people with a shared interest in a public space.' },
  { title: 'Line Placeholder', description: 'Offer to hold someone\'s place in line while they run a quick errand.' },
  { title: 'Car Helper', description: 'Help someone clean snow off their car, change a tire, or with another car issue.' },
  { title: 'Inclusion Specialist', description: 'Include someone who\'s being left out in a public activity or conversation.' },
  { title: 'Solar Charger', description: 'Create a small public solar charging station (if you have portable solar chargers).' },
  { title: 'Feedback Giver', description: 'Give genuine, constructive feedback to a street performer or artist.' },
  { title: 'First-Timer Helper', description: 'Help someone who\'s clearly using a service or facility for the first time.' },
  { title: 'Map Marker', description: 'Mark interesting spots on a tourist\'s map that aren\'t in the guidebooks.' },
  { title: 'Comfort Provider', description: 'Provide comfort to someone who appears distressed in a public place (respectfully).' }
];

export const weeklyChallenges: Challenge[] = [
  // SOCIAL & PERFORMANCE WEEKLY CHALLENGES (14 challenges)
  { 
    title: 'Stranger Symphony', 
    description: 'Create an impromptu "band" with at least 3 strangers, each playing makeshift instruments. Perform a 30-second "song" together in public.'
  },
  { 
    title: 'Flash Mob Starter', 
    description: 'Start a small flash mob in a public place. Begin dancing and get at least 5 strangers to join you within 30 seconds.'
  },
  { 
    title: 'Public Speech', 
    description: 'Give an impromptu 30-second motivational speech in a public place (park, square, etc.) with at least 5 listeners.'
  },
  { 
    title: 'Free Hugs Champion', 
    description: 'Make a "Free Hugs" sign and collect hugs from at least 10 different strangers (with clear consent).'
  },
  { 
    title: 'Dance Lesson', 
    description: 'Learn a dance move from a stranger and then teach it to another stranger. Show the learning and teaching process.'
  },
  { 
    title: 'Secret Talent Show', 
    description: 'Find 3 strangers willing to demonstrate a unique talent or skill on the spot. Host a mini talent show.'
  },
  { 
    title: 'Speed Dating Host', 
    description: 'Organize an impromptu 1-minute "speed dating" or "speed friending" event with at least 4 strangers.'
  },
  { 
    title: 'Human Chain', 
    description: 'Create a human chain of at least 8 people holding hands across a public space or street (safely).'
  },
  { 
    title: 'Silent Disco', 
    description: 'Start a "silent disco" where everyone dances to their own music. Get at least 5 strangers to join you.'
  },
  { 
    title: 'Open Mic Creator', 
    description: 'Set up an impromptu "open mic" in a public space and convince at least 3 strangers to perform.'
  },
  { 
    title: 'Public Karaoke', 
    description: 'Set up a karaoke session in a public place and get at least 5 strangers to sing.'
  },
  { 
    title: 'Street Theater', 
    description: 'Create a short theatrical scene in public with at least 3 strangers as actors.'
  },
  { 
    title: 'Dance Circle', 
    description: 'Start a dance circle and get at least 8 different people to take turns showing off moves in the center.'
  },
  { 
    title: 'Human Sculpture', 
    description: 'Direct at least 6 people to form a human sculpture/tableau in a public place.'
  },
  
  // ADVENTURE & DARE WEEKLY CHALLENGES (15 challenges)
  { 
    title: 'Free Ride Champion', 
    description: 'Hitchhike a ride in the most interesting vehicle you can find. Show your approach, the vehicle, and the driver (with permission).'
  },
  { 
    title: 'Urban Explorer', 
    description: 'Find and access an abandoned or rarely visited location in your city. Show how you got in and what you discovered.'
  },
  { 
    title: 'Rooftop Victory', 
    description: 'Legally access the rooftop of one of the tallest buildings in your area. Show the ascent and the view from the top.'
  },
  { 
    title: 'Cold Plunge Pro', 
    description: 'Take a full body plunge into cold water (ocean, lake, river) and stay in for at least 30 seconds. Show your reaction!'
  },
  { 
    title: 'Night Mission', 
    description: 'Complete a challenge after midnight in a safely accessible but unusual location. Show the location\'s unique nighttime qualities.'
  },
  { 
    title: 'Sunrise Seeker', 
    description: 'Watch the sunrise from an exceptional vantage point that requires effort to reach. Show your journey and the sunrise moment.'
  },
  { 
    title: 'Urban Camping', 
    description: 'Set up a small camp (tent or sleeping bag) in an unexpected urban location for at least 30 minutes (where legal).'
  },
  { 
    title: 'Fear Factor', 
    description: 'Face a personal fear and record yourself overcoming it. Explain what the fear is and show yourself conquering it.'
  },
  { 
    title: 'Fountain Swimmer', 
    description: 'Take a swim in a public fountain (where legal and safe). Show your entry and reaction.'
  },
  { 
    title: 'Food Challenge', 
    description: 'Eat the spiciest or most unusual dish at a local restaurant. Show your reaction and review.'
  },
  { 
    title: 'Border Crosser', 
    description: 'Cross from one district, neighborhood, or jurisdiction to another using an unusual method of transportation.'
  },
  { 
    title: 'Cave Explorer', 
    description: 'Find and explore an urban "cave" (tunnel, large drain, underpass) safely. Document what you discover.'
  },
  { 
    title: 'High Altitude Picnic', 
    description: 'Have a picnic at the highest accessible point in your city. Show the journey and the meal with a view.'
  },
  { 
    title: 'Water Crossing', 
    description: 'Cross a body of water without using a bridge or boat. Show your method and the crossing.'
  },
  { 
    title: 'Animal Encounter', 
    description: 'Safely encounter and interact with an unusual urban or wild animal. Document the interaction.'
  },
  
  // CREATIVITY & SKILL WEEKLY CHALLENGES (12 challenges)
  { 
    title: 'Street Art Creator', 
    description: 'Create a substantial piece of temporary street art (chalk, removable installation, etc.) that takes at least 30 minutes to complete.'
  },
  { 
    title: 'Flash Kitchen', 
    description: 'Cook a local specialty dish outdoors in a public space and share it with at least 3 strangers. Show cooking and reactions.'
  },
  { 
    title: 'Music Video', 
    description: 'Create a 30-second music video with at least 3 locations and 5 strangers making cameo appearances.'
  },
  { 
    title: 'Parkour Basics', 
    description: 'Learn and perform 3 basic parkour moves from a practiced traceur or through self-teaching in an urban environment.'
  },
  { 
    title: 'Street Performance', 
    description: 'Perform a song, dance, or act on a busy street for at least 10 minutes. Show the performance and audience reactions.'
  },
  { 
    title: 'Foreign Language', 
    description: 'Learn how to introduce yourself and ask 3 basic questions in a language you don\'t speak. Use it with a native speaker.'
  },
  { 
    title: 'Blindfolded Challenge', 
    description: 'Navigate from one specific point to another (at least 200 meters apart) while blindfolded, with a friend guiding verbally.'
  },
  { 
    title: 'Human Statue Pro', 
    description: 'Become a human statue for 30 minutes in a busy area. Create a character and hold the pose with minimal movement.'
  },
  { 
    title: 'Urban Sculpture', 
    description: 'Create a significant public sculpture using only found objects. Document the creation process and final piece.'
  },
  { 
    title: 'Guerrilla Gardening', 
    description: 'Plant flowers or vegetables in an abandoned or neglected urban space. Transform it into something beautiful.'
  },
  { 
    title: 'Fire Starter', 
    description: 'Start a fire without matches or a lighter in a safe, legal outdoor setting. Cook something simple over it.'
  },
  { 
    title: 'Street Magic', 
    description: 'Learn and perform 3 magic tricks for strangers on the street. Capture their reactions of wonder.'
  },
  
  // CONNECTION & IMPACT WEEKLY CHALLENGES (13 challenges)
  { 
    title: 'Stranger Dinner', 
    description: 'Organize an impromptu dinner or picnic with at least 3 people you didn\'t know before today. Share food and conversation.'
  },
  { 
    title: 'Local Hero', 
    description: 'Find a community service opportunity and volunteer for at least 2 hours. Show what you did and who you helped.'
  },
  { 
    title: 'Tour Guide', 
    description: 'Become a tour guide for a group of at least 3 tourists or newcomers to your area. Give them a 15+ minute tour.'
  },
  { 
    title: 'Secret Santa', 
    description: 'Buy 5 small, thoughtful gifts and give them to strangers who look like they could use a boost.'
  },
  { 
    title: 'Community Cleanup', 
    description: 'Organize a mini cleanup of a public area with at least 3 other participants. Show before, during, and after.'
  },
  { 
    title: 'Skill Share', 
    description: 'Teach a skill you\'re good at to at least 3 interested strangers in a public space. Show the teaching and learning.'
  },
  { 
    title: 'Generosity Challenge', 
    description: 'Spend a day performing as many acts of kindness as possible with $20. Document each act and recipient reaction.'
  },
  { 
    title: 'Cardboard Shelter', 
    description: 'Build a functional cardboard shelter and sleep in it overnight. Document the building process and your experience.'
  },
  { 
    title: 'Public Class', 
    description: 'Organize and teach a free class in a public park on any subject you know well. Get at least 5 students to attend.'
  },
  { 
    title: 'Homeless Helper', 
    description: 'Spend 3 hours helping at a homeless shelter or directly assisting homeless individuals. Document your experience.'
  },
  { 
    title: 'Memory Maker', 
    description: 'Help a stranger create a special memory. Plan and execute a memorable experience for someone you just met.'
  },
  { 
    title: 'Lost Item Finder', 
    description: 'Help at least 3 different people find items they\'ve lost, either by physically searching or by creating "lost" posters.'
  },
  { 
    title: 'Random Celebration', 
    description: 'Throw a mini celebration for a complete stranger (with their permission). Decorate, bring cake or candles, sing, etc.'
  }
];