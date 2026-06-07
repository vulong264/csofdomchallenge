import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // image can run without installing node_modules. Required for the slim
  // Cloud Run image — see Dockerfile.
  output: "standalone",
};

export default nextConfig;
