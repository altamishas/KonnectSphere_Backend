import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["images.pexels.com", "res.cloudinary.com", "images.unsplash.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/users/:path*",
        destination:
          "https://konnectspherebackend-production.up.railway.app/users/:path*",
      },
    ];
  },
};

export default nextConfig;
