/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Het rooster stond eerder op /dashboard/roster. Oude links (in e-mails,
    // meldingen en bookmarks) blijven zo gewoon werken; query-parameters
    // zoals ?week=... worden door Next.js automatisch meegenomen.
    return [
      { source: "/dashboard/roster", destination: "/dashboard/rooster", permanent: true },
      { source: "/dashboard/roster/:path*", destination: "/dashboard/rooster/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
