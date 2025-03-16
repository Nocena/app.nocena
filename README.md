# Nocena App

Nocena is a challenge-based social networking application where users can complete daily, weekly, and monthly AI-generated challenges similar to BeReal. The platform also features business-sponsored public challenges displayed on a map, and a token-based reward system on the Polygon blockchain.

## Features

- **Home**: Complete daily/weekly/monthly AI-generated challenges
- **Map**: Discover and participate in location-based public challenges set up by businesses
- **Inbox**: Receive notifications about new challenges, friend activities, etc.
- **Search**: Find other users, follow/unfollow them, and view their profiles
- **Profile**: View your completed challenge history with location markers

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Integrated in Next.js
- **Database**: Dgraph
- **Image Storage**: Pinata (IPFS)
- **Blockchain**: Polygon for the token layer
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- pnpm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/louskac/app.nocena.git
   cd app.nocena
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory
   - NEXT_PUBLIC_DGRAPH_API_KEY
   - NEXT_PUBLIC_DGRAPH_ENDPOINT
   - PINATA_API_KEY
   - PINATA_SECRET_KEY
   - NEXT_PUBLIC_PINATA_JWT
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_VERIFY_SERVICE_SID


### Development

#### Standard Development Mode
```bash
pnpm dev
```
- Access the app at [http://localhost:3000](http://localhost:3000)

#### HTTPS Development Mode (for camera access)
Camera functionality requires a secure context (HTTPS). To develop with camera features:

1. Generate SSL certificates for local development:
   ```bash
   mkdir -p certificates
   pnpx mkcert-cli install (maybe npx)
   pnpx mkcert-cli create localhost 127.0.0.1 ::1 -o ./certificates (maybe npx)
   ```
2. Ensure the generated files are named `dev.cert` and `dev.key` in the `certificates` directory.
3. Start the HTTPS development server:
   ```bash
   pnpm dev:https
   ```
4. Access the app at [https://localhost:3001](https://localhost:3001) or `https://[YOUR-LOCAL-IP]:3001` on mobile devices.
5. Accept any certificate warnings in your browser (these are expected with self-signed certificates).

### Building for Production
```bash
pnpm build
pnpm start
```

## PWA Support
Nocena is configured as a Progressive Web App, allowing users to install it on their devices.

## Project Structure
```
app.nocena/
├── package.json                                # Project dependencies and scripts
├── pnpm-lock.yaml                              # pnpm lock file
├── postcss.config.js                           # PostCSS configuration for Tailwind processing
├── public/                                     # Static assets
│   ├── apple-touch-icon-*.png                  # Various sized Apple touch icons for iOS devices
│   ├── favicon.ico                             # Website favicon
│   ├── fonts/                                  # Font files
│   │   └── MontserratAlt1-Light.otf            # Custom font for the application
│   ├── icons/                                  # App icons for PWA
│   │   ├── 192.png                             # 192px icon size
│   │   ├── apple-touch-icon.png                # Apple touch icon
│   │   ├── favicon-16x16.png                   # Small favicon
│   │   ├── favicon-32x32.png                   # Medium favicon
│   │   ├── icon-192x192.png                    # Standard PWA icon
│   │   ├── icon-384x384.png                    # Larger PWA icon
│   │   ├── icon-512x512.png                    # Largest PWA icon
│   │   ├── shortcut-home.png                   # Home shortcut icon
│   │   └── shortcut-map.png                    # Map shortcut icon
│   ├── images/                                 # Static images
│   │   ├── ai.png                              # Default profile pic of the AI character creating the challenges
│   │   ├── placeholder.avif                    # Placeholder image for loading videos on homepage
│   │   └── profile.png                         # Default profile image
│   ├── index.html                              # Static HTML entry for PWA fallback
│   ├── logo/                                   # App logo assets
│   │   ├── eyes.png                            # Old Nocena logo for the meantime
│   │   └── LogoDark.png                        # Dark version of the logo
│   ├── manifest.json                           # PWA manifest file defining app metadata
│   ├── nocenix.ico                             # Icon of the Nocenix token
│   ├── robots.txt                              # SEO robots instruction file
│   ├── sw.js                                   # Service worker for PWA functionality
│   └── workbox-e9849328.js                     # Workbox library for PWA capabilities
├── src/                                        # Source code
│   ├── components/                             # Reusable React components
│   │   ├── IPFSMediaLoader.tsx                 # Component for loading media from IPFS/Pinata
│   │   ├── PWAInstallPrompt.tsx                # Prompt for installing the app as PWA
│   │   ├── InviteCodeInput.tsx                 # Special component for begining of registration process - might be reused
│   │   ├── PhoneVerification.tsx               # Like the above, just specially for verifying phone
│   │   ├── icons/                              # SVG icon components as React components (!or use lucide-react!)
│   │   │   ├── followers.tsx                   # Followers icon
│   │   │   ├── home.tsx                        # Home icon
│   │   │   ├── inbox.tsx                       # Inbox icon
│   │   │   ├── map.tsx                         # Map icon
│   │   │   ├── menu.tsx                        # Menu hamburger icon
│   │   │   ├── pen.tsx                         # Edit/pen icon
│   │   │   ├── profile.tsx                     # Profile user icon
│   │   │   ├── save.tsx                        # Save icon
│   │   │   └── search.tsx                      # Search icon
│   │   ├── layout/                             # Layout components
│   │   │   ├── AppLayout.tsx                   # Main app layout wrapper
│   │   │   └── Menu.tsx                        # Navigation menu component
│   │   ├── PWA/                                # Components for better UX while isntalling PWA
│   │   │   ├── AndroidPWAPrompt.tsx            # Android
│   │   │   ├── DebugPWAInstaller.tsx           # Incredibly helpful debuger component
│   │   │   └── iOSPWAPrompt.tsx                # iOS
│   │   └── ui/                                 # UI components
│   │       ├── LoadingSpinner.tsx              # Loading animation component
│   │       ├── PrimaryButton.tsx               # Main button style component
│   │       ├── ThematicIcon.tsx                # Themed icon component (glitch animation)
│   │       ├── ThematicImage.tsx               # Themed image component      -││-
│   │       └── ThematicText.tsx                # Themed text component       -││-
│   ├── contexts/                               # React context providers
│   │   └── AuthContext.tsx                     # Authentication context for user sessions
│   ├── data/                                   # Data models and services
│   │   └── challenges.ts                       # Challenge data types and models
│   ├── lib/                                    # Library code
│   │   ├── api/                                # Main backend structure
│   │   │   ├── dgraph.ts                       # Dgraph database integration
│   │   │   ├── pinata.ts                       # Pinata IPFS integration
│   │   │   └── polygon.ts                      # Polygon blockchain integration
│   │   ├── completing/                         # Challenge completion functionality
│   │   │   ├── mediaServices.ts                # Media handling for challenge completion
│   │   │   └── types.ts                        # Type definitions for challenge completion
│   │   └── utils/                              # Utility functions
│   │       ├── challengeUtils.ts               # Helper functions for challenges
│   │       ├── dateUtils.ts                    # Date formatting and manipulation utilities
│   │       ├── passwordUtils.ts                # New and more secure hashing functionality with salt
│   │       ├── phoneUtils.ts                   # Util for phone verfication process
│   │       ├── rateLimiting.ts                 # Helper function for countering bruteforce on the discord invite code
│   │       ├── verification.ts                 # Verifing user by their phonenumber
│   │       └── security.ts                     # Security-related utilities
│   ├── pages/                                  # Next.js pages
│   │   ├── _app.tsx                            # Next.js app wrapper component
│   │   ├── _document.tsx                       # Next.js document customization
│   │   ├── api/                                # API routes
│   │   │   ├── registration/                   # Special api routes for registration process
│   │   │   │   ├── markAsUsed.ts               # Once invite code is used it needs to be deactivated
│   │   │   │   └── validate.ts                 # Validating discord invite code
│   │   │   ├── debugIPFS.ts                    # Debug endpoint for IPFS
│   │   │   ├── pinChallengeToIPFS.ts           # Save challenge to IPFS
│   │   │   └── pinFileToIPFS.ts                # Upload file to IPFS
│   │   ├── completing/                         # Challenge completion pages
│   │   │   ├── components/                     # Components for challenge completion flow
│   │   │   │   ├── ChallengeHeader.tsx         # Header for challenge view
│   │   │   │   ├── IdleView.tsx                # Idle state view
│   │   │   │   ├── RecordingView.tsx           # Video recording view
│   │   │   │   ├── ReviewView.tsx              # Submission review view
│   │   │   │   ├── SelfieView.tsx              # Selfie capture view
│   │   │   │   ├── StartingView.tsx            # Initial challenge view
│   │   │   │   └── StatusView.tsx              # Status indicator view
│   │   │   └── index.tsx                       # Main challenge completion page
│   │   ├── createchallenge/                    # Challenge creation
│   │   │   └── index.tsx                       # Challenge creation page
│   │   ├── home/                               # Home page
│   │   │   ├── components/                     # Home page components
│   │   │   │   ├── ChallengeForm.tsx           # Challenge creation form
│   │   │   │   ├── ChallengeHeader.tsx         # Challenge header display
│   │   │   │   ├── CompletionFeed.tsx          # Feed of completed challenges
│   │   │   │   └── CompletionItem.tsx          # Individual challenge completion
│   │   │   └── index.tsx                       # Home page
│   │   ├── inbox/                              # Notifications and messages
│   │   │   ├── index.tsx                       # Inbox page
│   │   │   └── notifications/                  # Notification components
│   │   │       ├── NotificationChallenge.tsx   # Challenge notification
│   │   │       └── NotificationFollower.tsx    # New follower notification
│   │   ├── map/                                # Map-based challenge discovery
│   │   │   └── index.tsx                       # Map page
│   │   ├── profile/                            # User profiles
│   │   │   ├── components/                     # Profile page components
│   │   │   │  └── ChallengeIndicator.tsx       # Indicator for completed challenges
│   │   │   ├── [userID].tsx                    # Dynamic other user profile page
│   │   │   └── index.tsx                       # Current user profile page
│   │   ├── search/                             # User search functionality
│   │   │   ├── components/                     # Search page components
│   │   │   │  └── SearchBox.tsx                   # Search input component
│   │   │   └── index.tsx                       # Search page
│   │   ├── index.tsx                           # Landing page
│   │   ├── login.tsx                           # Login page
│   │   ├── offline.tsx                         # Offline fallback page
│   │   └── register.tsx                        # Registration page
│   ├── scripts/                                # Utility scripts
│   │   └── generate-all-icons.sh               # Script to generate all required icons
│   └── styles/                                 # CSS and styling
│       └── globals.css                         # Global CSS styles with Tailwind directives
├── tailwind.config.js                          # Tailwind CSS configuration
└── tsconfig.json                               # TypeScript configuration
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## Troubleshooting

### Camera Access Issues
If you encounter camera access problems:
- Ensure you're using the HTTPS development server (`pnpm dev:https`)
- Check that your browser allows camera permissions
- On iOS, make sure you've accepted the certificate warning
- Verify that the camera permissions are properly set in your browser settings

### PWA Installation Problems
If the app doesn't install properly as a PWA:
- Verify that icons are correctly referenced in the `manifest.json`
- Ensure the service worker is properly registered
- Check the browser console for any PWA-related errors


(Created 2.3.2025 - louskac)
(Last modification 3.15.2025 - louskac)