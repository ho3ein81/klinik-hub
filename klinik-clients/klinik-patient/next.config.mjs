import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits .next/standalone with a self-contained server.js plus only the
  // traced production dependencies, so the Docker runtime image needs no
  // npm install of its own.
  output: 'standalone',
  reactStrictMode: true,
  typedRoutes: true,
};

export default withNextIntl(nextConfig);
