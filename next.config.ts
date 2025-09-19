import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  sw: 'src/sw.js',
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /^https:\/\/gateway\.pinata\.cloud\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pinata-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    // Cache TTS audio responses
    {
      urlPattern: /^\/api\/tts\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tts-audio-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
      },
    },
  ],
});

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  images: {
    domains: [
      'gateway.pinata.cloud',
      'jade-elaborate-emu-349.mypinata.cloud',
      'ipfs.io',
      'cloudflare-ipfs.com',
      'dweb.link',
      'gateway.ipfs.io',
    ],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack(config: Configuration) {
    config.module?.rules?.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: true,
            svgoConfig: {
              plugins: [{ removeViewBox: false }],
            },
            titleProp: true,
          },
        },
      ],
    });

    return config;
  },
  headers: async () => {
    return [
      // Service Worker specific cache control headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Workbox files should also not be cached
      {
        source: '/workbox-:hash.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // TTS API caching headers
      {
        source: '/api/tts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Feature-Policy',
            value: 'camera *, microphone *',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, geolocation=*, microphone=*',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self' https: http:; " +
              "img-src 'self' data: blob: https://gateway.pinata.cloud https://ipfs.io https://cloudflare-ipfs.com https://dweb.link https://gateway.ipfs.io https://*.tile.openstreetmap.org https://unpkg.com https://*.mapbox.com https://*.jawg.io https://cdn.jsdelivr.net https: http:; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://embedded-wallet.thirdweb.com https://pay.thirdweb.com https://cdn.jsdelivr.net blob:; " +
              "worker-src 'self' blob:; " +
              "child-src 'self' blob: https://embedded-wallet.thirdweb.com https://pay.thirdweb.com; " +
              "frame-src 'self' blob: https://embedded-wallet.thirdweb.com https://pay.thirdweb.com; " +
              "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; " +
              "font-src 'self' data:; " +
              "connect-src 'self' https://api.nocena.com https://api.pinata.cloud https://*.tile.openstreetmap.org https://unpkg.com https://*.mapbox.com https://*.jawg.io https://embedded-wallet.thirdweb.com https://pay.thirdweb.com https://cdn.jsdelivr.net wss://relay.walletconnect.org https://relay.walletconnect.org https://rpc.walletconnect.org https://*.walletconnect.org https://api.openai.com https: http: wss:; " +
              "media-src 'self' https://gateway.pinata.cloud https://ipfs.io https://cloudflare-ipfs.com https://dweb.link https://gateway.ipfs.io https: http: blob: data:;",
          },
        ],
      },
    ];
  },
};

export default pwaConfig(nextConfig);
