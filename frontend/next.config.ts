/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove experimental.appDir - it's now stable in Next.js 15
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Enable React strict mode
  reactStrictMode: true,
}

module.exports = nextConfig