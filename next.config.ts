import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';

  script-src
    'self'
    'unsafe-inline'
    'wasm-unsafe-eval'
    https://checkout.razorpay.com
    https://api.razorpay.com
    https://maps.googleapis.com
    https://www.googletagmanager.com
    https://www.google-analytics.com;

  style-src
    'self'
    'unsafe-inline'
    https://fonts.googleapis.com;

  img-src
    'self'
    data:
    blob:
    https://maps.gstatic.com
    https://maps.googleapis.com
    https://checkout.razorpay.com
    https://rzp.io
    https://www.google-analytics.com
    https://stats.g.doubleclick.net;

  font-src
    'self'
    data:
    https://fonts.gstatic.com;

  connect-src
    'self'
    blob:
    https://api.razorpay.com
    https://checkout.razorpay.com
    https://lumberjack.razorpay.com
    https://maps.googleapis.com
    https://www.google-analytics.com
    https://stats.g.doubleclick.net;

  frame-src
    'self'
    https://checkout.razorpay.com
    https://api.razorpay.com
    https://www.google.com;

  worker-src
    'self'
    blob:;

  object-src 'none';
  base-uri 'self';
  form-action 'self' https://checkout.razorpay.com;
`;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/draco/:path*",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
