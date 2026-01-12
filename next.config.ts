import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable stale-while-revalidate for faster navigation
    staleTimes: {
      dynamic: 30, // Cache dynamic pages for 30 seconds
    },
  },
};

export default nextConfig;
