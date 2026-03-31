/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hfse.edu.sg",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "enrol.hfse.edu.sg",
        pathname: "/assets/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/embed/jobs",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${process.env.ALLOWED_PARENT_DOMAINS}`,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
