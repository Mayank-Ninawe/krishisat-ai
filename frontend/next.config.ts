import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No rewrites needed — api.ts uses NEXT_PUBLIC_API_URL directly.
  // Rewrites over /api/:path* would conflict with Next.js API routes
  // under src/app/api/ and cause "Failed to collect page data" build errors.
};

export default nextConfig;
