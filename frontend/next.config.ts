/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental.appDir - it's now stable in Next.js 15
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable React strict mode
  reactStrictMode: true,
}

module.exports = nextConfig