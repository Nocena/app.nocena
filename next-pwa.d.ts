declare module 'next-pwa' {
  import { NextConfig } from 'next';

  export interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    runtimeCaching?: Array<{
      urlPattern: RegExp | string;
      handler: string;
      options?: Record<string, any>;
    }>;
    [key: string]: any;
  }

  export default function withPWA(options?: PWAConfig): (nextConfig?: NextConfig) => NextConfig;
}
