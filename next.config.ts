import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-d9a707e799754eaf97bb7a295f4a8030.r2.dev",
      },
    ],
  },
};

export default nextConfig;
