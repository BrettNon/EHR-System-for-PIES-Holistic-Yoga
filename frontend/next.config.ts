import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  image: { unoptimized: true }
};

export default nextConfig;
