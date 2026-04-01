import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ["@chenglou/pretext"],
  htmlLimitedBots: /.*/,
};

export default nextConfig;
