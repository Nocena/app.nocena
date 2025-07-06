import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  disable: true, // Add this to disable PWA
  register: false, // Add this to disable service worker registration
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
      // We can't include blob: or data: URLs in domains or remotePatterns
    ],
    // Allow unoptimized images for dynamic content
    unoptimized: true,
    // Allow SVG images from dynamic sources
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
              "connect-src 'self' https://api.pinata.cloud https://*.tile.openstreetmap.org https://unpkg.com https://*.mapbox.com https://*.jawg.io https://embedded-wallet.thirdweb.com https://pay.thirdweb.com https://cdn.jsdelivr.net https://*.filcdn.io https: http:; " +
              "media-src 'self' https://gateway.pinata.cloud https://ipfs.io https://cloudflare-ipfs.com https://dweb.link https://gateway.ipfs.io https://*.filcdn.io https: http: blob: data:;",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      // Specific CORS headers for FilCDN proxy routes
      {
        source: '/filcdn-proxy/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Range',
          },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'Content-Length, Content-Range, Accept-Ranges',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      // CORS headers for API routes
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default pwaConfig(nextConfig);
