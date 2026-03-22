/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.pexels.com" },
      { hostname: "res.cloudinary.com" }
    ],
  },
  // Disable source maps in production to prevent 404 errors
  productionBrowserSourceMaps: false,
};
export default nextConfig;
