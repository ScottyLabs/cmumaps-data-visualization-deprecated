/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    // Add alias for canvas
    config.resolve.alias.canvas = false;

    return config;
  },
};
export default nextConfig;
