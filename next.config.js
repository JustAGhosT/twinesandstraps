/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Unsplash - used for product placeholder images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Azure AI Foundry - for AI-generated product images (optional)
      // Add your Azure storage endpoint if using AI-generated images
      // {
      //   protocol: 'https',
      //   hostname: 'your-azure-storage.blob.core.windows.net',
      //   pathname: '/**',
      // },
    ],
  },
};

module.exports = nextConfig;
