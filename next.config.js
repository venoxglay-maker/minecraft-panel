/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Explizite Pfade, damit Assets nicht 404 liefern
  assetPrefix: '',
  basePath: '',
};

module.exports = nextConfig;
