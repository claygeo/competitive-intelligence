/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.dutchie.com',
      'images.sweed.com',
      'www.trulieve.com',
      'cdn.shopify.com',
    ],
  },
}

module.exports = nextConfig
