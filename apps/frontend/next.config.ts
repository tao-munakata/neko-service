import type { NextConfig } from "next";
import { execSync } from 'child_process';

function getGitVersion(): string {
  try {
    return execSync('git describe --tags --abbrev=0').toString().trim();
  } catch {
    return 'unknown';
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: getGitVersion(),
  },
};

export default nextConfig;
