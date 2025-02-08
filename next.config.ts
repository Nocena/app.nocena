import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

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
};

export default nextConfig;
