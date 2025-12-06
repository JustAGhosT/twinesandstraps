/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      // Unsplash - used for product placeholder images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Azure Blob Storage - for uploaded product images and logos
      // Wildcard pattern allows any Azure blob storage account
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore Node.js modules in client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        tls: false,
        net: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        http2: false,
        assert: false,
        os: false,
        path: false,
        module: false,
        child_process: false,
        dns: false,
        '@azure/functions-core': false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
