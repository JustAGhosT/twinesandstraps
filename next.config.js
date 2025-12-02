/** @type {import('next').NextConfig} */

// Build the remote patterns array dynamically based on environment variables
const remotePatterns = [
  // Unsplash - used for product placeholder images
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
    pathname: '/**',
  },
  // Azure Blob Storage - for uploaded product images and logos
  // Automatically configured when AZURE_STORAGE_ACCOUNT_NAME is set
  // This uses a wildcard pattern to allow any Azure blob storage account
  {
    protocol: 'https',
    hostname: '*.blob.core.windows.net',
    pathname: '/**',
  },
];

// If a specific Azure storage account is configured, add it explicitly as well
// This ensures the specific account works even if wildcard matching fails
if (process.env.AZURE_STORAGE_ACCOUNT_NAME) {
  remotePatterns.push({
    protocol: 'https',
    hostname: `${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    pathname: '/**',
  });
}

const nextConfig = {
  images: {
    remotePatterns,
  },
};

module.exports = nextConfig;
