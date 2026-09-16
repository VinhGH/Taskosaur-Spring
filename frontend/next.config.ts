import type { NextConfig } from "next";
import packageJson from "./package.json";
import { execSync } from "child_process";

function resolveAppVersion(): string {
  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    return process.env.NEXT_PUBLIC_APP_VERSION;
  }
  try {
    const exactTag = execSync("git describe --tags --exact-match", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (exactTag) {
      return exactTag.startsWith("v") ? exactTag : `v${exactTag}`;
    }
  } catch {
    // Not on an exact tag
  }
  return `v${packageJson.version}`;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  transpilePackages: ['@uiw/react-md-editor', '@uiw/react-markdown-preview'],
  env: {
    NEXT_PUBLIC_APP_VERSION: resolveAppVersion(),
    NEXT_PUBLIC_API_BASE_URL: process.env.BUILD_DIST === 'true' ? '/api' : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || (process.env.BUILD_DIST === 'true' ? '' : 'http://localhost:3000')
  }
};

export default nextConfig;
