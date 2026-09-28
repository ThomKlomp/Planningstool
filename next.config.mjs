/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // geoip-country leest bij het opzoeken van een IP zijn eigen package.json
  // (om zijn databestanden te vinden) via een pad relatief aan zichzelf.
  // Bundelt webpack dat mee in de servercode (het standaardgedrag), dan klopt
  // dat pad niet meer en crasht de build ("ENOENT ... .next/server/app/api/
  // package.json"). Door het pakket hier als "extern" te merken, laat Next.js
  // het gewoon vanuit node_modules laden op de server, zoals in gewone Node.
  experimental: {
    serverComponentsExternalPackages: ["geoip-country"],
    // Next 14 bewaart dynamische pagina's 30 seconden in de browser (de
    // "Router Cache") en toont die bij terugkeren opnieuw, ook als je er
    // intussen iets hebt opgeslagen. Gevolg: een instelling lijkt niet
    // opgeslagen tot je de pagina zelf ververst. dynamic: 0 = bij elke
    // navigatie vers ophalen (zoals Next 15 standaard doet). Statische
    // pagina's (homepage e.d.) mogen 30 seconden blijven staan.
    staleTimes: { dynamic: 0, static: 30 },
  },
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
