import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  
  webpack: (config, { dev }) => {
    if (dev) {
      // Light polling - less intensive than before
      config.watchOptions = {
        poll: 3000, // Check every 3 seconds instead of 1
        aggregateTimeout: 600, // Wait longer before rebuilding
        ignored: /node_modules/, // Ignore node_modules for faster compilation
      }
      // Optimize for development speed
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    return config
  },
};

export default nextConfig;
