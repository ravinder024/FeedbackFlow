/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    forceSwcTransforms: true // Force using SWC
  },
  // Ensure proper compilation of dependencies
  transpilePackages: ['@swc/helpers'],
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true
  },
  typescript: {
    // Disable TypeScript checks during build
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig