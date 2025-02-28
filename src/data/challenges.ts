export type Challenge = {
  title: string;
  description: string;
};

export const dailyChallenges: Challenge[] = [
  // URBAN EXPLORATION & ADVENTURE (70)
  { title: 'Urban Explorer', description: 'Find and capture an abandoned or overlooked spot in your city that most people walk past without noticing.' },
  { title: 'Dawn Patrol', description: 'Catch the sunrise from anywhere in your area and capture the moment.' },
  { title: 'Dusk Hunter', description: 'Capture the sunset from your favorite local spot.' },
  { title: 'High Point', description: 'Find the highest accessible point near you and document the view.' },
  { title: 'Low Point', description: 'Find the lowest point in your area (basement, valley, underground) and document it.' },
  { title: 'Urban Wildlife', description: 'Find and document local wildlife in an urban setting (birds, squirrels, insects, etc.).' },
  { title: 'Hidden Art', description: 'Locate a piece of street art or public art that is not widely known.' },
  { title: 'Water Seeker', description: 'Find a body of water (fountain, stream, puddle) in your urban environment.' },
  { title: 'Boundary Crosser', description: 'Stand at the border between two neighborhoods or districts and document the differences.' },
  { title: 'Stairway Climber', description: 'Find and climb an interesting staircase in a public place.' },
  { title: 'Alley Adventure', description: 'Explore an alley or side street you have never been down before.' },
  { title: 'Rooftop View', description: 'Access a publicly available rooftop and capture the view.' },
  { title: 'Urban Oasis', description: 'Find a peaceful spot in the middle of a busy area.' },
  { title: 'Night Explorer', description: 'Capture something interesting in your neighborhood after dark.' },
  { title: 'Bridge Crossing', description: 'Cross a bridge in your area on foot and document the journey.' },
  { title: 'Public Transport Safari', description: 'Ride public transportation and document your journey from the window.' },
  { title: 'Historic Spot', description: 'Find and document a historical marker or site in your area.' },
  { title: 'Urban Waterfall', description: 'Find water flowing in an urban setting (drain, fountain, etc.).' },
  { title: 'Tunnel Vision', description: 'Find and walk through a tunnel or underpass in your area.' },
  { title: 'Clockwatcher', description: 'Find an interesting public clock or timepiece in your area.' },
  { title: 'Boundary Stone', description: 'Find a marker that indicates a boundary (property line, city limit, etc.).' },
  { title: 'Elevated Perspective', description: 'Get at least 3 floors above ground level and capture the view.' },
  { title: 'Morning Dew', description: 'Find and document something covered in dew or morning moisture.' },
  { title: 'Reflection Hunter', description: 'Find an interesting reflection in windows, puddles, or other surfaces.' },
  { title: 'Shadow Seeker', description: 'Create an interesting shadow and document it.' },
  { title: 'Weather Witness', description: 'Document today\'s weather in a creative way.' },
  { title: 'Skyline Capture', description: 'Find a spot where you can see your city\'s skyline and document it.' },
  { title: 'Public Seating', description: 'Find the most interesting public bench or seat in your area.' },
  { title: 'Flora Hunter', description: 'Find and document an interesting plant growing in an urban setting.' },
  { title: 'Architectural Detail', description: 'Find and document an interesting architectural detail on a building.' },
  { title: 'Urban Sounds', description: 'Record the sounds of your city from an interesting location.' },
  { title: 'Corner Explorer', description: 'Stand at a street corner you have never been to before.' },
  { title: 'Car-Free Zone', description: 'Find a public space where cars are not allowed and document it.' },
  { title: 'Light Chaser', description: 'Find an interesting play of light and shadow in an urban setting.' },
  { title: 'Pattern Finder', description: 'Document an interesting pattern in the urban environment (tiles, bricks, etc.).' },
  { title: 'Urban Texture', description: 'Find and document an interesting texture in your urban environment.' },
  { title: 'Boundary Walker', description: 'Stand at a boundary between two different areas (neighborhoods, properties, etc.).' },
  { title: 'Street Musician Spot', description: 'Find a place where street musicians perform (with or without musicians present).' },
  { title: 'Public Art', description: 'Find and document a piece of public art (sculpture, mural, installation).' },
  { title: 'Window Shopping', description: 'Find the most interesting store window display in your area.' },
  { title: 'Local Landmark', description: 'Visit and document a well-known landmark in your area.' },
  { title: 'Micro Park', description: 'Find the smallest park or green space in your area.' },
  { title: 'Secret Garden', description: 'Find a hidden or secluded garden or green space.' },
  { title: 'Urban Decay', description: 'Document something in your urban environment that shows signs of age or decay.' },
  { title: 'Future City', description: 'Find something in your environment that looks futuristic.' },
  { title: 'Vintage Vibes', description: 'Find something in your environment that looks like it is from the past.' },
  { title: 'Door Knocker', description: 'Find an interesting door or entrance in a public space.' },
  { title: 'Secret Passage', description: 'Find a path, alley, or shortcut that is not obvious to most people.' },
  { title: 'Ghost Sign', description: 'Find an old, faded advertisement painted on a building.' },
  { title: 'Street Letter', description: 'Find an interesting letter form on a sign, license plate, or other text in your environment.' },
  { title: 'Color Hunter', description: 'Find 3 different things in your immediate environment that are the same color.' },
  { title: 'Public Phone', description: 'Find a public phone booth or remnant of one.' },
  { title: 'Mailbox Mission', description: 'Find the most interesting mailbox or post box in your area.' },
  { title: 'Transit Tracker', description: 'Document public transportation in action (bus, train, subway, etc.).' },
  { title: 'Bike Route', description: 'Find and document a bike lane or cycling route in your area.' },
  { title: 'Pedestrian Path', description: 'Find a pathway designed specifically for pedestrians.' },
  { title: 'Boundary Marker', description: 'Find something that marks a boundary (fence, wall, sign, etc.).' },
  { title: 'Urban Fossil', description: 'Find something in the urban environment that is obsolete but still exists.' },
  { title: 'Traffic Watcher', description: 'Find a spot to safely observe and document traffic patterns.' },
  { title: 'Urban Cave', description: 'Find a sheltered or cave-like space in the urban environment.' },
  { title: 'Abandoned Object', description: 'Find something that has been abandoned or forgotten in a public space.' },
  { title: 'Painted Street', description: 'Find a street, crosswalk, or public space with decorative painting.' },
  { title: 'City Compass', description: 'Show which way is north without using your phone and explain how you figured it out.' },
  { title: 'Power Spot', description: 'Find electrical infrastructure in your city (transformer, power lines, etc.).' },
  { title: 'Underground Glimpse', description: 'Find a spot where you can see or access what is below street level.' },
  { title: 'Forgotten Space', description: 'Find a public space that seems forgotten or rarely used.' },
  { title: 'Morning Light', description: 'Capture how morning light interacts with buildings or objects in your city.' },
  { title: 'Evening Shadows', description: 'Document the long shadows created in the evening hours.' },
  { title: 'Urban Symmetry', description: 'Find and document something perfectly symmetrical in your urban environment.' },
  
  // SOCIAL INTERACTIONS & COMMUNITY (50)
  { title: 'Stranger Compliment', description: 'Give a genuine compliment to a willing stranger and capture their reaction (with permission).' },
  { title: 'Local Expert', description: 'Ask a local person for a recommendation about the area and document their response (with permission).' },
  { title: 'Language Exchange', description: 'Learn how to say "hello" in a language you do not speak from someone who knows it (with permission).' },
  { title: 'Street Performance', description: 'Find a street performer and document their art (with permission).' },
  { title: 'Community Board', description: 'Find a community bulletin board and document an interesting notice.' },
  { title: 'Local Business', description: 'Visit a local independent business you have never been to before.' },
  { title: 'Community Garden', description: 'Find a community garden or shared growing space in your area.' },
  { title: 'Public Forum', description: 'Find a place where public discussions or meetings are held.' },
  { title: 'Book Exchange', description: 'Find a public book exchange or free library.' },
  { title: 'Pet Encounter', description: 'Meet someone walking their pet and ask if you can say hello (with permission).' },
  { title: 'Smile Exchange', description: 'Exchange smiles with a stranger (with permission to record).' },
  { title: 'Random Kindness', description: 'Do something kind for a stranger that can be completed in 30 seconds.' },
  { title: 'Helpful Gesture', description: 'Help someone with a small task (hold a door, carry something, etc.) with their permission.' },
  { title: 'Market Visit', description: 'Visit a farmers market or local market and document something interesting.' },
  { title: 'Food Truck', description: 'Find a food truck or street food vendor in your area.' },
  { title: 'Public Gathering', description: 'Find a place where people naturally gather in your area.' },
  { title: 'Cafe Culture', description: 'Visit a local cafe and document the atmosphere.' },
  { title: 'Game Spot', description: 'Find a place where people play games in public (chess tables, courts, etc.).' },
  { title: 'Chalk Message', description: 'Write a positive message with chalk in a public space (where permitted).' },
  { title: 'Dog Walker Route', description: 'Find a popular dog-walking spot in your area with dogs present.' },
  { title: 'High Five', description: 'Get a high five from a willing stranger.' },
  { title: 'Direction Asker', description: 'Ask someone for directions to a local landmark and document their response (with permission).' },
  { title: 'Photo Favor', description: 'Ask someone to take your photo in front of something interesting (besides your selfie).' },
  { title: 'Local Tip', description: 'Ask a local resident for a tip about the area and document what you learn (with permission).' },
  { title: 'Street Interview', description: 'Ask someone what they like most about the area (with permission).' },
  { title: 'Store Greeter', description: 'Have a brief, friendly conversation with someone working at a local store (with permission).' },
  { title: 'Pet Spotter', description: 'Find and document people walking their pets (from a respectful distance).' },
  { title: 'Bike Meetup', description: 'Find a place where cyclists gather or a popular cycling route with cyclists present.' },
  { title: 'Running Route', description: 'Find a popular running or jogging route in your area with runners present.' },
  { title: 'Public Workspace', description: 'Find people working in a public space (cafe, library, park).' },
  { title: 'Local News', description: 'Ask someone what is new in the neighborhood (with permission).' },
  { title: 'Shop Local', description: 'Buy something from a local independent business and show what you purchased.' },
  { title: 'Community Service', description: 'Find an organization that provides services to the community.' },
  { title: 'Public Opinion', description: 'Ask someone a question about your city and document their answer (with permission).' },
  { title: 'Public Exercise', description: 'Find people exercising in a public space (yoga in the park, group runs, etc.).' },
  { title: 'Fist Bump', description: 'Get a fist bump from a willing stranger.' },
  { title: 'Coffee Conversation', description: 'Have a brief conversation with someone at a cafe or coffee shop (with permission).' },
  { title: 'Local Legend', description: 'Ask someone about a local legend or story about the area (with permission).' },
  { title: 'Street Musician', description: 'Listen to a street musician and document their performance (with permission).' },
  { title: 'Public Space', description: 'Find a well-used public space and document how people are using it.' },
  { title: 'Random Question', description: 'Ask a stranger an interesting but appropriate question (with permission).' },
  { title: 'Eye Contact', description: 'Make eye contact with a willing participant for 10 seconds (with permission).' },
  { title: 'Local Character', description: 'Document a well-known local character or personality (with permission).' },
  { title: 'Busker Appreciation', description: 'Show appreciation for a street performer (applause, tip, etc.) with their permission.' },
  { title: 'Networking', description: 'Introduce yourself to someone new in a social setting (with permission).' },
  { title: 'Wave Hello', description: 'Wave hello to someone and see if they wave back (with permission to record).' },
  { title: 'Public Toast', description: 'Make a toast with a friend or acquaintance in a public place.' },
  { title: 'Team Effort', description: 'Collaborate with someone to complete a simple task that takes under 30 seconds.' },
  { title: 'Thank You Note', description: 'Write a thank you note and give it to someone on camera (with permission).' },
  
  // CREATIVITY & EXPRESSION (55)
  { title: 'Shadow Art', description: 'Create and photograph a shadow artwork using your body or found objects.' },
  { title: 'Urban Composition', description: 'Create a balanced visual composition using elements in your immediate urban environment.' },
  { title: 'Color Match', description: 'Find something in your environment that exactly matches the color of your clothing.' },
  { title: 'Forced Perspective', description: 'Create a forced perspective photo that plays with size and distance.' },
  { title: 'Found Face', description: 'Find something in your environment that looks like a face (pareidolia).' },
  { title: 'Texture Rubbing', description: 'Create a quick rubbing of an interesting texture using paper and a pencil.' },
  { title: 'Improvised Instrument', description: 'Make a brief sound/music using objects you find in your immediate environment.' },
  { title: 'Environmental Portrait', description: 'Take a portrait that incorporates elements of your surroundings.' },
  { title: 'Nature Arrangement', description: 'Create a small arrangement using natural materials you find nearby.' },
  { title: 'Sound Collection', description: 'Find and record an interesting sound in your environment.' },
  { title: 'Urban Still Life', description: 'Arrange found objects into a quick still life composition.' },
  { title: 'Street Typography', description: 'Find interesting letters or typography in your environment.' },
  { title: 'Symmetry Hunter', description: 'Find and document something perfectly symmetrical in your environment.' },
  { title: 'Chalk Art', description: 'Create a small piece of chalk art in a public space (where permitted).' },
  { title: 'Color Story', description: 'Find 3 objects of the same color in your immediate vicinity.' },
  { title: 'Found Poetry', description: 'Find 3 words in your environment and connect them into a simple phrase.' },
  { title: 'Environmental Frame', description: 'Use elements in your environment to create a natural frame for your subject.' },
  { title: 'Miniature Scene', description: 'Create a miniature scene using small objects you find near you.' },
  { title: 'Shape Collector', description: 'Find 3 different shapes in your immediate environment.' },
  { title: 'Sound Mimicry', description: 'Try to mimic a sound you hear in your environment.' },
  { title: 'Public Dance', description: 'Do a short dance in a public space.' },
  { title: 'Street Haiku', description: 'Write and recite a haiku inspired by your surroundings.' },
  { title: 'Rhythm Finder', description: 'Find a repeated pattern or rhythm in your environment and document it.' },
  { title: 'Cloud Imagination', description: 'Find shapes in the clouds and describe what you see.' },
  { title: 'Coin Art', description: 'Arrange coins into a simple design in a public place.' },
  { title: 'Leaf Arrangement', description: 'Create a simple design using fallen leaves found nearby.' },
  { title: 'Window Reflection', description: 'Capture an interesting reflection in a window or glass surface.' },
  { title: 'Paper Transformation', description: 'Transform a piece of paper into something interesting in 30 seconds.' },
  { title: 'Monochrome Moment', description: 'Document something in your environment using a black and white filter.' },
  { title: 'Public Singing', description: 'Sing a short song or hum a tune in a public space.' },
  { title: 'Sidewalk Message', description: 'Leave a positive message in a public space (chalk, arranged objects, etc.).' },
  { title: 'Spontaneous Speech', description: 'Give a 30-second impromptu speech about something you see.' },
  { title: 'Found Sculpture', description: 'Find something in your environment that looks like sculpture.' },
  { title: 'Line Drawing', description: 'Create a quick continuous line drawing of something in your environment.' },
  { title: 'Trash Transformation', description: 'Transform a piece of trash into something artistic or useful.' },
  { title: 'Finger Frame', description: 'Use your fingers to create a frame around something interesting.' },
  { title: 'Echo Test', description: 'Find a space with interesting acoustics and test the echo.' },
  { title: 'Natural Paintbrush', description: 'Use a natural object (leaf, stick, etc.) to create a simple drawing or mark.' },
  { title: 'Pocket Gallery', description: 'Create a tiny art gallery using small objects from your pockets or bag.' },
  { title: 'Word Association', description: 'Find 3 words in your environment and explain how they connect to each other.' },
  { title: 'Stone Stacking', description: 'Create a small stack of stones or objects (where permitted).' },
  { title: 'Sound Wave', description: 'Visualize a sound around you by drawing what you hear.' },
  { title: 'Public Performance', description: 'Perform a short skit or scene in a public space.' },
  { title: 'Mirror Image', description: 'Create a symmetrical arrangement of objects you find near you.' },
  { title: 'Wind Art', description: 'Create something that moves with the wind using materials you find nearby.' },
  { title: 'Light Drawing', description: 'Use a light source to "draw" in the air while recording.' },
  { title: 'Invisible Orchestra', description: 'Pretend to play an invisible instrument in a public space.' },
  { title: 'Outdoor Gallery', description: 'Create a temporary exhibition of found objects nearby.' },
  { title: 'Shadow Puppet', description: 'Create a shadow puppet using your hands or objects.' },
  { title: 'Street Portrait', description: 'Draw a quick portrait on paper in a public setting.' },
  { title: 'Alphabet Photography', description: 'Find an object that looks like a letter and document it.' },
  { title: 'Urban Camouflage', description: 'Try to blend in with your environment for a creative photo.' },
  { title: 'Reflection Self-Portrait', description: 'Create a self-portrait using reflective surfaces around you.' },
  { title: 'Urban Color Palette', description: 'Find 5 different colors in your immediate urban environment.' },
  
  // CHALLENGES & GAMES (40)
  { title: 'Balance Challenge', description: 'Balance on one foot for 30 seconds in a public space.' },
  { title: 'Coin Flip Decision', description: 'Make a spontaneous decision based on a coin flip on camera.' },
  { title: 'Rock Paper Scissors', description: 'Play rock paper scissors with a willing participant.' },
  { title: 'Hopscotch', description: 'Play hopscotch on a sidewalk or create your own hopscotch grid.' },
  { title: 'Memory Challenge', description: 'Look at a scene for 10 seconds, turn away, and recall as many details as possible.' },
  { title: 'Backwards Walking', description: 'Walk backwards for 30 steps in a safe, open area.' },
  { title: 'Coin Stacking', description: 'Stack coins in a public space and see how high you can go in 30 seconds.' },
  { title: 'Limbo Challenge', description: 'Do the limbo under a branch, sign, or other object without touching it.' },
  { title: 'Blind Drawing', description: 'Draw something in your environment without looking at your paper for 30 seconds.' },
  { title: 'Speed Challenge', description: 'Do 10 jumping jacks in a public space.' },
  { title: 'Counting Game', description: 'Count how many of a specific object you can find in 30 seconds.' },
  { title: 'Alphabet Hunt', description: 'In 30 seconds, find objects that start with as many letters of the alphabet as possible.' },
  { title: 'Mirror Challenge', description: 'Mirror the movements of someone else in a public space (with their permission).' },
  { title: 'Stone Skipping', description: 'Skip a stone on water (if near a suitable body of water).' },
  { title: 'Target Practice', description: 'Throw a small object into a target (trash can, circle drawn with chalk, etc.).' },
  { title: 'Freeze Frame', description: 'Freeze in an interesting pose in a public space for 15 seconds.' },
  { title: 'Word Chain', description: 'Find 3 words in your environment and connect them in a word chain.' },
  { title: 'Obstacle Course', description: 'Navigate a simple obstacle course using objects in your immediate environment.' },
  { title: 'Treasure Hunt', description: 'Find 3 small "treasures" in your immediate environment (interesting rocks, leaves, etc.).' },
  { title: 'Shadow Tag', description: 'Try to step on the shadows of objects without stepping on your own shadow.' },
  { title: 'Chair Challenge', description: 'Sit in 3 different public seating options within 30 seconds.' },
  { title: 'Step Counter', description: 'Count how many steps it takes to walk around a small defined area.' },
  { title: 'Follow the Leader', description: 'Have someone lead you on a spontaneous 30-second journey.' },
  { title: 'Simon Says', description: 'Play a quick game of Simon Says with a willing participant.' },
  { title: 'I Spy', description: 'Play I Spy with someone and document the object they choose.' },
  { title: 'Coin Toss', description: 'Toss a coin into a fountain or designated spot (if appropriate).' },
  { title: 'Mime Time', description: 'Mime an activity for 30 seconds in a public space.' },
  { title: 'Fitness Minute', description: 'Do 30 seconds of exercise in a public space.' },
  { title: 'Penny Challenge', description: 'Place a penny heads-up for someone else to find for good luck.' },
  { title: 'Hand Clap Game', description: 'Play a hand clap game with a willing participant.' },
  { title: 'Stretch Break', description: 'Do 3 different stretches in a public space.' },
  { title: 'Finger Counting Game', description: 'Play an "odd or even" finger counting game with someone.' },
  { title: 'Standing Long Jump', description: 'Do a standing long jump and mark your distance.' },
  { title: 'Bubble Blowing', description: 'Blow bubbles in a public space.' },
  { title: 'Paper Airplane', description: 'Make and fly a paper airplane outdoors.' },
  { title: 'Hula Hoop', description: 'Do the hula hoop motion with or without an actual hula hoop for 30 seconds.' },
  { title: 'Thumb War', description: 'Have a thumb war with a willing participant.' },
  { title: 'Air Drawing', description: 'Draw something in the air and have someone guess what it is.' },
  { title: 'Double High Five', description: 'Do a double high five with someone.' },
  { title: 'Quick Chase', description: 'Playfully chase a friend for 10 seconds in an open area.' },
  
  // OBSERVATION & MINDFULNESS (45)
  { title: 'Cloud Watcher', description: 'Spend 30 seconds watching and describing the clouds.' },
  { title: 'Bird Listener', description: 'Close your eyes for 15 seconds and identify any bird sounds you hear.' },
  { title: 'Texture Touch', description: 'Find and document 3 different textures in your immediate environment.' },
  { title: 'Deep Breath', description: 'Take 5 deep breaths in a peaceful setting and describe how you feel.' },
  { title: 'Wind Direction', description: 'Determine which way the wind is blowing using natural indicators.' },
  { title: 'People Watching', description: 'Observe and document the flow of people in a public space for 30 seconds.' },
  { title: 'Sound Map', description: 'Close your eyes for 15 seconds and describe all the sounds around you.' },
  { title: 'Color Meditation', description: 'Focus on a single color for 30 seconds and find all instances of it in your immediate environment.' },
  { title: 'Slow Motion', description: 'Perform a simple action in extreme slow motion for 30 seconds.' },
  { title: 'Tree Study', description: 'Spend 30 seconds observing a tree and document what you notice.' },
  { title: 'Barefoot Moment', description: 'Feel the ground with your bare feet (in a safe, clean area) for 30 seconds.' },
  { title: 'Eye Level Change', description: 'View your environment from a different eye level (crouching, lying down, etc.).' },
  { title: 'Smell Map', description: 'Document the different smells you encounter in your immediate area.' },
  { title: 'Water Watching', description: 'Spend 30 seconds observing water (fountain, stream, puddle) and describe the patterns.' },
  { title: 'Weather Feeling', description: 'Describe how the current weather feels on your skin.' },
  { title: 'Detail Detective', description: 'Find a small detail in your environment that most people would miss.' },
  { title: 'Light and Shadow', description: 'Observe how light and shadow interact in your immediate environment.' },
  { title: 'Sound Isolation', description: 'Focus on a single sound in your environment and describe it in detail.' },
  { title: 'Sky Gazing', description: 'Spend 30 seconds looking at the sky and describe what you see.' },
  { title: 'Peripheral Vision', description: 'Test your peripheral vision by focusing on a central point and noting what you can see at the edges.' },
  { title: 'Counting Meditation', description: 'Count your breaths for 30 seconds while sitting still.' },
  { title: 'Leaf Study', description: 'Examine a leaf in detail and document what you observe.' },
  { title: 'Stone Feeling', description: 'Hold a stone or rock and describe how it feels in your hand.' },
  { title: 'Temperature Contrast', description: 'Find two surfaces with distinctly different temperatures and document the contrast.' },
  { title: 'Wind Feeling', description: 'Close your eyes and focus on the feeling of wind or air on your skin for 30 seconds.' },
  { title: 'Silence Seeker', description: 'Find the quietest spot you can and spend 30 seconds there.' },
  { title: 'Balance Stone', description: 'Balance a small stone on another stone or object.' },
  { title: 'Puddle Reflection', description: 'Find a puddle and observe what reflects in it.' },
  { title: 'Sky Color', description: 'Observe and describe the exact color of the sky.' },
  { title: 'Ground Texture', description: 'Document the texture of the ground beneath your feet.' },
  { title: 'Shape Meditation', description: 'Focus on a single geometric shape and find examples of it in your environment.' },
  { title: 'Sound Rhythm', description: 'Listen for rhythmic sounds in your environment (traffic lights, crosswalk signals, etc.).' },
  { title: 'Insect Observer', description: 'Find and observe an insect for 30 seconds.' },
  { title: 'Plant Detail', description: 'Examine and document a small detail of a plant.' },
  { title: 'Eye Contact', description: 'Make eye contact with yourself in a reflective surface for 15 seconds.' },
  { title: 'Walking Meditation', description: 'Take 30 deliberate, mindful steps, focusing on each movement.' },
  { title: 'Sound Layers', description: 'Try to identify at least 3 different layers of sound in your environment.' },
  { title: 'Time Awareness', description: 'Try to count exactly 30 seconds without looking at a clock.' },
  { title: 'Temperature Awareness', description: 'Document how the temperature changes as you move from sun to shade.' },
  { title: 'Movement Flow', description: 'Observe and document how people or objects move through a space for 30 seconds.' },
  { title: 'Seasonal Change', description: 'Find and document signs of the current season in your immediate environment.' },
  { title: 'Micro Observation', description: 'Find something tiny and observe it in great detail for 30 seconds.' },
  { title: 'Cloud Movement', description: 'Observe cloud movement for 30 seconds and describe the patterns.' },
  { title: 'Sensory Deprivation', description: 'Cover one sense (like ears or eyes) for 30 seconds and describe how it changes your awareness.' },
  { title: 'Color Gradient', description: 'Find a natural color gradient in your immediate environment.' },
  
  // FOOD & DRINK (35)
  { title: 'Local Taste', description: 'Try a food or drink from a local vendor you have never visited before.' },
  { title: 'Outdoor Coffee', description: 'Enjoy a coffee or tea in an outdoor setting.' },
  { title: 'Water Taste Test', description: 'Compare the taste of water from two different sources on camera.' },
  { title: 'Street Food', description: 'Find and try a street food item.' },
  { title: 'Picnic Spot', description: 'Find an ideal spot for a picnic and document why it is perfect.' },
  { title: 'Fruit Finder', description: 'Find and document fresh fruit being sold in your area.' },
  { title: 'Bread Aroma', description: 'Find a bakery and document the aroma and atmosphere of fresh bread.' },
  { title: 'Drink with a View', description: 'Enjoy a beverage while taking in a nice view.' },
  { title: 'Food Truck', description: 'Find a food truck and show their menu or specialties.' },
  { title: 'Market Fresh', description: 'Visit a market and find the freshest looking produce.' },
  { title: 'Sweet Treat', description: 'Find and enjoy a local sweet treat on camera.' },
  { title: 'Spice Encounter', description: 'Find a source of aromatic spices and document the scent and appearance.' },
  { title: 'Beverage Pairing', description: 'Show a drink that pairs well with your current surroundings and explain why.' },
  { title: 'Coffee Art', description: 'Find a cafe that creates latte art and document an example.' },
  { title: 'Water Source', description: 'Find a public water source (drinking fountain, etc.) and take a drink.' },
  { title: 'Outdoor Dining', description: 'Find a place where people dine outdoors and document the atmosphere.' },
  { title: 'Local Specialty', description: 'Find a food that is a specialty of your local area.' },
  { title: 'Tea Time', description: 'Take a moment to enjoy a cup of tea and show your surroundings.' },
  { title: 'International Flavor', description: 'Find a food establishment offering cuisine from another country.' },
  { title: 'Food Aroma', description: 'Find a place with enticing food aromas and describe what you smell.' },
  { title: 'Juice Bar', description: 'Find a place that sells fresh juice or smoothies.' },
  { title: 'Herb Spotter', description: 'Find fresh herbs being grown or sold in your area.' },
  { title: 'Ice Cream Moment', description: 'Enjoy an ice cream or frozen treat in a public space.' },
  { title: 'Farmer Meeting', description: 'At a market, talk to someone who grew or made what you are buying (with permission).' },
  { title: 'Comfort Food', description: 'Find a place that serves comfort food and show why it is comforting.' },
  { title: 'Unique Beverage', description: 'Find and try a beverage you have never had before.' },
  { title: 'Food Share', description: 'Share a snack with someone (with their permission).' },
  { title: 'Vegetarian Option', description: 'Find a place offering interesting vegetarian food options.' },
  { title: 'Seasonal Taste', description: 'Find a food or drink that is specific to the current season.' },
  { title: 'Food Art', description: 'Document food that is presented in an artistic way.' },
  { title: 'Breakfast Spot', description: 'Find a popular spot for breakfast or brunch.' },
  { title: 'Lunch Break', description: 'Have lunch in an unusual location and document the experience.' },
  { title: 'Communal Dining', description: 'Find a place where people dine communally or at shared tables.' },
  { title: 'Food Tour', description: 'Visit a food market or hall and show three different interesting foods.' },
  { title: 'Kitchen Voyeur', description: 'Find a restaurant with an open kitchen where you can watch the chefs.' },
  { title: 'Food Critic', description: 'Try a local food item and give a 30-second review on camera.' },
  { title: 'Colorful Plate', description: 'Find a meal or snack with at least 3 different vibrant colors.' },
  { title: 'Hidden Gem', description: 'Find a small, lesser-known eatery and show what makes it special.' },
  { title: 'Street Corner Snack', description: 'Enjoy a quick snack at a busy street corner and describe the ambiance.' },
  { title: 'Cooking Show', description: 'Find someone cooking in public (street vendor, etc.) and document the process (with permission).' },
  
  // CRYPTO & WEB3 (35)
  { title: 'Crypto Graffiti', description: 'Find street art or graffiti related to cryptocurrency or Web3.' },
  { title: 'Blockchain Meetup', description: 'Find a location where crypto/blockchain meetups happen (even if there is no event today).' },
  { title: 'Crypto Cafe', description: 'Find a cafe or restaurant that accepts cryptocurrency as payment.' },
  { title: 'Token Hunt', description: 'Find and scan a QR code in a public space (like a poster or advertisement).' },
  { title: 'Mining Metaphor', description: 'Find something in the physical world that reminds you of crypto mining and explain why.' },
  { title: 'Digital Twin', description: 'Find a physical object that could have an interesting digital twin as an NFT.' },
  { title: 'Crypto Conversation', description: 'Explain a basic crypto concept to the camera or to someone (with their permission).' },
  { title: 'Decentralized Symbol', description: 'Find something in your environment that symbolizes decentralization.' },
  { title: 'Wallet Check', description: 'Check your crypto wallet in a memorable location and document it.' },
  { title: 'Crypto Merch', description: 'Find someone wearing cryptocurrency merchandise or spot crypto stickers in the wild.' },
  { title: 'Public Key Art', description: 'Create quick art inspired by the concept of public and private keys.' },
  { title: 'Blockchain Metaphor', description: 'Find something in the physical world that reminds you of a blockchain and explain the connection.' },
  { title: 'Web3 Workspace', description: 'Find a coworking space or cafe where tech or crypto developers gather.' },
  { title: 'Crypto ATM', description: 'Find a cryptocurrency ATM in your area.' },
  { title: 'Digital Asset', description: 'Find something physical that you think would make a valuable digital asset and explain why.' },
  { title: 'NFT Gallery', description: 'Find a physical gallery that displays NFT art or create a mini physical display of digital art concepts.' },
  { title: 'Smart Contract Analogy', description: 'Find something in the physical world that works like a smart contract and explain the similarity.' },
  { title: 'Token Economy', description: 'Find a local business that uses some kind of token system (loyalty points, etc.).' },
  { title: 'Governance Symbol', description: 'Find something that represents governance or voting in the physical world.' },
  { title: 'Crypto Educator', description: 'Teach one simple blockchain concept in 30 seconds.' },
  { title: 'Privacy Metaphor', description: 'Find something that symbolizes privacy or security in the physical world.' },
  { title: 'Token Utility', description: 'Find something that demonstrates utility or value exchange in the physical world.' },
  { title: 'Web3 Community', description: 'Find a local community board or space where tech-oriented people gather.' },
  { title: 'Physical Ledger', description: 'Find a physical ledger or record-keeping system in the real world.' },
  { title: 'Digital Identity', description: 'Create a quick representation of your digital identity using physical objects around you.' },
  { title: 'Crypto Symbol', description: 'Find something that resembles a cryptocurrency symbol (₿, Ξ, etc.) in the wild.' },
  { title: 'DeFi in Real Life', description: 'Find an example of traditional finance and explain how DeFi could improve it.' },
  { title: 'Validator Node', description: 'Find something in your environment that reminds you of a validator node and explain why.' },
  { title: 'Public vs Private', description: 'Find an example of public vs private space and relate it to public vs private keys.' },
  { title: 'Hash Function', description: 'Create a simple visual representation of how a hash function works using objects around you.' },
  { title: 'Crypto-Friendly Business', description: 'Find a business that embraces technology or might be open to crypto adoption.' },
  { title: 'Metaverse Portal', description: 'Find a location that feels like it could be a portal to the metaverse and explain why.' },
  { title: 'Token Bridge', description: 'Find a physical bridge and use it as a metaphor to explain bridging between blockchains.' },
  { title: 'Consensus Mechanism', description: 'Use objects around you to create a quick visual explanation of how consensus works.' },
  { title: 'Wallet Security', description: 'Find something that represents security in the physical world and relate it to wallet security.' },
  
  // RANDOM & FUN (35)
  { title: 'Spontaneous Celebration', description: 'Celebrate something small with an impromptu 30-second party.' },
  { title: 'Opposite Day', description: 'Do something in the opposite way you normally would for 30 seconds.' },
  { title: 'Random Direction', description: 'At an intersection, go in a random direction and discover what is there.' },
  { title: 'Time Capsule', description: 'Create a quick digital time capsule of the current moment with your narration.' },
  { title: 'Secret Message', description: 'Create and leave a secret message for someone to find (where appropriate).' },
  { title: 'Unusual Perspective', description: 'Take a video from a very unusual angle or perspective.' },
  { title: 'Silly Walk', description: 'Do a silly walk for 30 seconds in a public place.' },
  { title: 'Joke Teller', description: 'Tell a joke to someone and document their reaction (with permission).' },
  { title: 'Improvised Story', description: 'Create a short story about a random object you find.' },
  { title: 'Disguise', description: 'Subtly change your appearance for a short time (hat, glasses, etc.).' },
  { title: 'Childhood Game', description: 'Play a game you enjoyed as a child for 30 seconds.' },
  { title: 'Imaginary Friend', description: 'Introduce and interact with an imaginary friend for 30 seconds.' },
  { title: 'Future Prediction', description: 'Make a fun prediction about the future of your location.' },
  { title: 'Alternative Use', description: 'Find a common object and use it for something other than its intended purpose.' },
  { title: 'Invisible Object', description: 'Pretend to interact with an invisible object for 30 seconds.' },
  { title: 'Accent Adventure', description: 'Speak in a different accent for 30 seconds (without mocking any culture).' },
  { title: 'Secret Agent', description: 'Pretend to be a secret agent on a mission for 30 seconds.' },
  { title: 'Random Act of Weirdness', description: 'Do something harmlessly weird in public for 30 seconds.' },
  { title: 'Pet Rock', description: 'Find a rock and treat it as a pet for 30 seconds.' },
  { title: 'Superhero Moment', description: 'Strike superhero poses in an everyday location.' },
  { title: 'Reverse Video', description: 'Create a 15-second video of an action, then perform it backwards.' },
  { title: 'Slow Motion Scene', description: 'Create a 30-second slow-motion scene of an ordinary action.' },
  { title: 'Speed Challenge', description: 'See how many jumping jacks you can do in 30 seconds.' },
  { title: 'Street Performance', description: 'Perform a quick 30-second routine in a public space.' },
  { title: 'Quick Change', description: 'Change one aspect of your appearance during the 30-second video.' },
  { title: 'Random Facts', description: 'Share 3 random facts about your current location.' },
  { title: 'Echo Location', description: 'Find a place with an echo and demonstrate it.' },
  { title: 'Paper Fortune Teller', description: 'Make a quick paper fortune teller and use it.' },
  { title: 'Impersonation', description: 'Do a brief, respectful impersonation of a famous character or celebrity.' },
  { title: 'Sound Effects', description: 'Add live sound effects to a simple action.' },
  { title: 'Magic Trick', description: 'Perform a simple magic trick or illusion.' },
  { title: 'Impromptu Song', description: 'Make up a quick song about your surroundings.' },
  { title: 'Shadow Puppets', description: 'Create shadow puppets and tell a 30-second story.' },
  { title: 'Public Challenge', description: 'Complete a safe, fun physical challenge in a public space.' },
  { title: 'Time Traveler', description: 'Pretend you are a time traveler experiencing your location for the first time.' }
];

// WEEKLY CHALLENGES (52 total - designed to be provable but require more time)
export const weeklyChallenges: Challenge[] = [
  // ADVENTURE & EXPLORATION (12)
  { 
    title: 'Urban Explorer Week', 
    description: 'Find and document a hidden gem in your city that most tourists and locals do not know about. Show why it is special and what makes it worth visiting.'
  },
  { 
    title: 'Sunrise Challenge', 
    description: 'Capture the sunrise from a notable location in your area. Show your journey to get there and the moment the sun appears.'
  },
  { 
    title: 'Alternative Transport', 
    description: 'Use a form of transportation you do not typically use (bike, skateboard, public transit, etc.). Show your experience and perspective.'
  },
  { 
    title: 'Urban Wildlife', 
    description: 'Find and document urban wildlife in your area. Show the animal(s) in their environment and explain what makes this sighting interesting.'
  },
  { 
    title: 'Historic Site', 
    description: 'Visit a historical site in your area. Show the location and share something interesting you learned about its significance.'
  },
  { 
    title: 'Microadventure', 
    description: 'Complete a small adventure that takes you out of your comfort zone. Show the experience and what made it challenging.'
  },
  { 
    title: 'Night Explorer', 
    description: 'Visit an interesting location after dark (safely). Show how the place transforms at night and what makes it special in darkness.'
  },
  { 
    title: 'Border Crosser', 
    description: 'Visit the border between two distinct neighborhoods or districts. Show the contrasts and how the environment changes.'
  },
  { 
    title: 'Urban Nature', 
    description: 'Find a surprising spot of nature thriving in an urban environment. Show the contrast between natural and man-made elements.'
  },
  { 
    title: 'Elevation Challenge', 
    description: 'Visit the highest accessible point in your area. Show the journey up and the view from the top.'
  },
  { 
    title: 'Secret Passage', 
    description: 'Find a hidden passageway, alley, or shortcut that few people know about. Show how it connects different areas.'
  },
  { 
    title: 'Weather Expedition', 
    description: 'Go out in unusual weather (rain, snow, fog, etc.) and show how it transforms a familiar location.'
  },
  
  // SOCIAL & COMMUNITY (10)
  { 
    title: 'Community Event', 
    description: 'Attend a community event or gathering. Show the atmosphere, what people are doing, and what makes it meaningful.'
  },
  { 
    title: 'Local Interview', 
    description: 'Interview someone who makes your community function (with their permission). Show what they do and what insights they shared.'
  },
  { 
    title: 'Random Act of Kindness', 
    description: 'Perform a meaningful act of kindness for someone in your community. Show the act (with permission) and the impact it had.'
  },
  { 
    title: 'Local Expert', 
    description: 'Become a temporary expert on a specific aspect of your neighborhood. Show what you learned and what makes it special.'
  },
  { 
    title: 'Skill Exchange', 
    description: 'Learn a quick skill from someone in your community (with permission). Show the teaching process and what you learned.'
  },
  { 
    title: 'Community Improvement', 
    description: 'Make a small improvement to a public space (where permitted). Show the before, your work, and the after result.'
  },
  { 
    title: 'Cultural Experience', 
    description: 'Experience an aspect of culture different from your own (with respect). Show what you learned and what made it meaningful.'
  },
  { 
    title: 'Digital Detox', 
    description: 'Spend time completely offline in a public setting. Show the environment and how it felt to be disconnected.'
  },
  { 
    title: 'Conversation Starter', 
    description: 'Create a simple interactive experience that gets strangers talking (with their permission). Show what happened and the reactions.'
  },
  { 
    title: 'Local Business Spotlight', 
    description: 'Visit a local independent business you have never been to before. Show what makes it unique and interview the owner (with permission).'
  },
  
  // CREATIVITY & EXPRESSION (10)
  { 
    title: 'Street Art Tour', 
    description: 'Find an impressive piece of street art in your area. Show the art from different angles and explain what makes it powerful.'
  },
  { 
    title: 'Public Space Creation', 
    description: 'Create a temporary, non-destructive artistic intervention in a public space (where permitted). Show your process and the final result.'
  },
  { 
    title: 'Sound Mapping', 
    description: 'Find a location with interesting sounds. Record and describe the sonic environment and what makes it unique.'
  },
  { 
    title: 'Urban Color Study', 
    description: 'Find a location with a distinctive color palette. Show how color defines the character of the place.'
  },
  { 
    title: 'Temporary Installation', 
    description: 'Create a temporary art installation using found or natural materials (where permitted). Show your creation process and the final piece.'
  },
  { 
    title: 'Public Poetry', 
    description: 'Write a poem inspired by a specific location and recite it on site. Show the location and your performance.'
  },
  { 
    title: 'Visual Story', 
    description: 'Tell a visual story about a place without using words. Show the narrative through your camera movements and focus.'
  },
  { 
    title: 'Urban Sketching', 
    description: 'Sketch a location in your city. Show your process, the environment, and your completed sketch.'
  },
  { 
    title: 'Public Dance', 
    description: 'Create and perform a short dance in response to a public location. Show how your movements relate to the space.'
  },
  { 
    title: 'Sensory Focus', 
    description: 'Focus intensely on one sense in a busy environment. Show what you discovered by this deep sensory attention.'
  },
  
  // CRYPTO & WEB3 (8)
  { 
    title: 'Web3 Explorer', 
    description: 'Find a business that accepts cryptocurrency as payment. Show the location, their crypto payment option, and your interaction with them.'
  },
  { 
    title: 'Blockchain Scavenger', 
    description: 'Find physical objects or locations that relate to blockchain concepts. Show each item and explain the connection.'
  },
  { 
    title: 'Token Economy', 
    description: 'Find a real-world token economy (arcade tokens, casino chips, etc.). Show how it works and relate it to digital tokens.'
  },
  { 
    title: 'Crypto Art', 
    description: 'Create a physical representation of a digital asset or NFT concept. Show your creative process and the final result.'
  },
  { 
    title: 'Digital Asset Hunt', 
    description: 'Find unique real-world objects that would make interesting NFTs. Show each item and explain its potential digital value.'
  },
  { 
    title: 'Web3 Community', 
    description: 'Find a place where Web3 enthusiasts gather. Show the location and what makes it a crypto-friendly environment.'
  },
  { 
    title: 'DAO Concept', 
    description: 'Find a real-world example of collaborative decision-making. Show how it works and relate it to DAOs.'
  },
  { 
    title: 'Crypto Educator', 
    description: 'Create an educational demonstration explaining a blockchain concept using physical objects. Show your demonstration in a public setting.'
  },
  
  // PHYSICAL & MINDFULNESS (6)
  { 
    title: 'Urban Workout', 
    description: 'Use your city as a gym for a workout. Show the different urban features you use as exercise equipment.'
  },
  { 
    title: 'Meditation Spot', 
    description: 'Find an unexpectedly peaceful spot in a busy area. Show the contrast and why it works as a mindfulness location.'
  },
  { 
    title: 'Sunrise Practice', 
    description: 'Complete a physical or mindfulness practice at sunrise. Show the setting and your experience.'
  },
  { 
    title: 'Movement Flow', 
    description: 'Create a movement sequence inspired by your urban environment. Show how your movements relate to the architecture or landscape.'
  },
  { 
    title: 'Cold Exposure', 
    description: 'Challenge yourself with a cold exposure experience (cold shower, ice bath, winter swim). Show your experience and reaction.'
  },
  { 
    title: 'Sensory Exploration', 
    description: 'Explore a familiar environment while focusing intently on just one sense. Show what new things you discovered.'
  },
  
  // FOOD & CULTURE (6)
  { 
    title: 'Culinary Heritage', 
    description: 'Explore a cuisine from a specific cultural community in your area. Show the food and what makes it culturally significant.'
  },
  { 
    title: 'Food Origins', 
    description: 'Trace the source of a food item back to where it was produced. Show the connection between producer and consumer.'
  },
  { 
    title: 'Local Food Challenge', 
    description: 'Eat only food produced within 50 miles for a meal. Show what you found and where you got it.'
  },
  { 
    title: 'Communal Dining', 
    description: 'Have a meal in a setting where food is shared communally. Show the experience and social aspects of the dining.'
  },
  { 
    title: 'Food Waste Reduction', 
    description: 'Create a meal using parts of foods typically discarded. Show your creative approach to reducing food waste.'
  },
  { 
    title: 'Global Street Food', 
    description: 'Find authentic international street food in your area. Show the preparation, the dish, and your tasting experience.'
  }
];

// MONTHLY CHALLENGES (12 total - quite difficult, but still provable with a 30s clip)
export const monthlyChallenges: Challenge[] = [
  { 
    title: 'January: Urban Transformation', 
    description: 'Find an underutilized urban space and show what could be done to transform it. Create a demonstration of your improvement idea and show how it would benefit the community.'
  },
  { 
    title: 'February: Relationship Revolution', 
    description: 'Form a meaningful new relationship or deepen an existing one through an act of vulnerability or connection. Show the interaction (with permission) and what made it significant.'
  },
  { 
    title: 'March: Local Expert', 
    description: 'Become an expert on a specific neighborhood, street, or district by spending extensive time there. Create a guide to hidden gems, showing the most interesting discovery you made.'
  },
  { 
    title: 'April: Skill Acquisition', 
    description: 'Learn a challenging new skill and demonstrate your progress. Show your practice and what you can now do that you could not do before.'
  },
  { 
    title: 'May: Community Impact', 
    description: 'Identify a specific need in your community and implement a solution. Show the problem and your approach to improving the situation.'
  },
  { 
    title: 'June: Creator Challenge', 
    description: 'Create an original piece of content (art, writing, music, video, etc.) and share it publicly. Show your creative process and the public presentation.'
  },
  { 
    title: 'July: Micro-Adventure', 
    description: 'Complete a small adventure that pushes your boundaries (wild swimming, sleeping outdoors, climbing a local peak, etc.). Show the most challenging moment and your accomplishment.'
  },
  { 
    title: 'August: Physical Challenge', 
    description: 'Set and achieve a significant physical goal. Show your training and the moment you accomplish your target.'
  },
  { 
    title: 'September: Digital Minimalism', 
    description: 'Reduce digital dependencies and increase analog experiences. Show how you replaced digital activities with meaningful offline alternatives.'
  },
  { 
    title: 'October: Fear Confrontation', 
    description: 'Identify and confront a personal fear. Show yourself facing the fear and share what you learned from the experience.'
  },
  { 
    title: 'November: Web3 Integration', 
    description: 'Immerse yourself in a Web3 technology or community. Show what you learned and how you participated in the ecosystem.'
  },
  { 
    title: 'December: Future Self', 
    description: 'Design and implement a positive change that moves you toward becoming your ideal future self. Document the transformation with before and after evidence.'
  }
];

// SPECIAL CRYPTO CHALLENGES (for events or promotions)
export const cryptoChallenges: Challenge[] = [
  {
    title: 'Token Trail',
    description: 'Find and scan a crypto-related QR code hidden in your city. Show the location, the code, and what happens when you scan it.'
  },
  {
    title: 'Proof of Adventure',
    description: 'Complete an adrenaline-pumping challenge with witnesses. Show the challenge, the witnesses, and your successful completion.'
  },
  {
    title: 'DAO Challenge',
    description: 'Form a temporary team with other users to collectively complete a challenge. Show your team coordination and the successful outcome.'
  },
  {
    title: 'Reality Mining',
    description: 'Transform a real-world activity into a creative digital asset concept. Show the physical activity and explain its digital value.'
  },
  {
    title: 'Crypto Meetup',
    description: 'Attend or organize a small gathering of Nocena users. Show the group, your interactions, and what you learned from each other.'
  }
];