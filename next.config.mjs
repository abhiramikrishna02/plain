/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Public assets are frequently replaced in place during content updates.
    // Serving them directly avoids stale copies in Next's image optimizer cache.
    unoptimized: true,
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
