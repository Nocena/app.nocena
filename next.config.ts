import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

/** @type {NextConfig} */
const nextConfig: NextConfig = {
  images: {
    domains: ['gateway.pinata.cloud'],
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
            value: 'camera *'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https: http:; img-src 'self' data: https: http:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https: http:; media-src 'self' https: http: blob:;"
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      }
    ];
  }
};

export default pwaConfig(nextConfig);