import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import withPWA from 'next-pwa';
import pkg from './package.json' assert { type: 'json' };

const GIT_SHA = process.env.GIT_SHA || 'dev';

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  clientsClaim: true, // Take control immediately
  sw: 'src/sw.ts',
  // Add proper cache cleanup
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
  ],
})({
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  },
});

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: `${pkg.version}+${GIT_SHA}`,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
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

    config.plugins?.push(
      new (require('webpack').DefinePlugin)({
        'self.APP_VERSION': JSON.stringify(process.env.NEXT_PUBLIC_APP_VERSION),
      }),
    );
    return config;

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
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Feature-Policy',
            value: 'camera *',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, geolocation=*',
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
              "connect-src 'self' https://api.pinata.cloud https://*.tile.openstreetmap.org https://unpkg.com https://*.mapbox.com https://*.jawg.io https://embedded-wallet.thirdweb.com https://pay.thirdweb.com https://cdn.jsdelivr.net wss://relay.walletconnect.org https://relay.walletconnect.org https://rpc.walletconnect.org https://*.walletconnect.org https: http: wss:; " +
              "media-src 'self' https://gateway.pinata.cloud https://ipfs.io https://cloudflare-ipfs.com https://dweb.link https://gateway.ipfs.io https: http: blob: data:;",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};
