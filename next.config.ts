import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // About, contact and the work index now live as pages on the home canvas.
  async redirects() {
    return [
      { source: "/:locale(mn|en)/about", destination: "/:locale#about", permanent: false },
      { source: "/:locale(mn|en)/contact", destination: "/:locale#contact", permanent: false },
      { source: "/:locale(mn|en)/work", destination: "/:locale#list", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
