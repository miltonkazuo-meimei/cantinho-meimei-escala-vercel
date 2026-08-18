import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.15.51"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hkrgkcqsqjqbakdsolyf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
