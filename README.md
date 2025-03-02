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
   - Create a `.env` file in the root directory
   - ANEXT_PUBLIC_DGRAPH_API_KEY
   - NEXT_PUBLIC_DGRAPH_ENDPOINT
   - PINATA_API_KEY
   - PINATA_SECRET_KEY
   - NEXT_PUBLIC_PINATA_JWT


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
├── certificates/       # SSL certificates for local HTTPS development
├── node_modules/       # Dependencies
├── public/             # Static assets
│   ├── fonts/          # Font files
│   ├── icons/          # App icons for PWA
│   ├── images/         # Static images
│   ├── logo/           # App logo assets
│   ├── manifest.json   # PWA manifest
│   └── favicon.ico     # Browser favicon
├── src/                # Source code
│   ├── components/     # Reusable React components
│   ├── contexts/       # React context providers
│   ├── data/           # Data models and services
│   ├── pages/          # Next.js pages
│   │   ├── api/        # API routes
│   │   ├── completing/ # Challenge completion pages
│   │   ├── home/       # Home feed
│   │   ├── inbox/      # Notifications and messages
│   │   ├── map/        # Map-based challenge discovery
│   │   ├── profile/    # User profiles
│   │   └── search/     # User search functionality
│   ├── scripts/        # Utility scripts
│   ├── styles/         # CSS and styling
│   └── utils/          # Utility functions (mainly backend for dgraph, pinata and polygon)
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── dev-https-server.js # HTTPS development server
├── next.config.ts      # Next.js configuration
├── package.json        # Project dependencies and scripts
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
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