import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb", // Set to 2MB (must be larger than 1MB)
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        async_hooks: false,
        util: false,
        buffer: false,
        events: false,
        child_process: false,
        cluster: false,
        dgram: false,
        dns: false,
        domain: false,
        module: false,
        perf_hooks: false,
        process: false,
        punycode: false,
        querystring: false,
        readline: false,
        repl: false,
        string_decoder: false,
        timers: false,
        tty: false,
        v8: false,
        vm: false,
        worker_threads: false,
      };
      
      // Exclude pg, Prisma and related modules from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'pg': 'commonjs pg',
        'pg-native': 'commonjs pg-native',
        'pg-connection-string': 'commonjs pg-connection-string',
        '@prisma/adapter-pg': 'commonjs @prisma/adapter-pg',
        '@prisma/client': 'commonjs @prisma/client',
        'prisma': 'commonjs prisma',
      });
    }
    return config;
  },
  // Add allowedDevOrigins for network access
  allowedDevOrigins: [
    "192.168.1.8:3000",
    "localhost:3000",
    "127.0.0.1:3000"
  ],
  // Add headers for CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
