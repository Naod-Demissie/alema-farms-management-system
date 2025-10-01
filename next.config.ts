import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb", // Set to 2MB (must be larger than 1MB)
    },
  },
};

export default nextConfig;
