import type { NextConfig } from "next";

const SOCIAL_AND_SEO_BOTS =
  /Googlebot|GoogleOther|AdsBot-Google|googleweblight|Storebot-Google|Google-PageRenderer|Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Applebot|Pinterestbot|Bingbot|YandexBot/;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ["@chenglou/pretext"],
  htmlLimitedBots: SOCIAL_AND_SEO_BOTS,
  async rewrites() {
    return [
      { source: "/og.png", destination: "/og" },
    ];
  },
};

export default nextConfig;
