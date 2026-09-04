import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Turbopack's on-disk persistent cache keeps getting corrupted because this
    // project lives in a live-syncing OneDrive folder, which touches/locks cache
    // files mid-write. Disabling it trades a bit of rebuild speed for reliability.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
