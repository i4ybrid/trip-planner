/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Disabled: contributes to OOM during build
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: false,
  },
  experimental: {
    workerThreads: false,
    minimize: true,
  },
  // Keep webpack cache enabled (default behavior) for faster rebuilds
  onDemandEntries: {
    maxInactiveAge: 120 * 1000, // 2 minutes - keep pages hot longer
    pagesBufferLength: 10, // Keep more pages in memory
  },
};

module.exports = nextConfig;
