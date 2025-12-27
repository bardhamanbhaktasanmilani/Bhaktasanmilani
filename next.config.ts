import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // ----------------------------------
      // DRACO WASM FIX (CRITICAL)
      // ----------------------------------
      {
        source: "/draco/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/wasm",
          },
        ],
      },

      // ----------------------------------
      // GLOBAL SECURITY HEADERS (RAZORPAY SAFE)
      // ----------------------------------
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },

          // ----------------------------------
          // CONTENT SECURITY POLICY
          // ----------------------------------
          {
  key: "Content-Security-Policy",
  value: `
    default-src 'self';

    script-src
      'self'
      'unsafe-inline'
      'wasm-unsafe-eval'
      https://checkout.razorpay.com
      https://maps.googleapis.com;

    style-src
      'self'
      'unsafe-inline';

    img-src
      'self'
      data:
      blob:
      https://maps.gstatic.com
      https://maps.googleapis.com
      https://checkout.razorpay.com
      https://rzp.io;

    font-src
      'self'
      data:;

    connect-src
      'self'
      blob:
      https://api.razorpay.com
      https://lumberjack.razorpay.com
      https://maps.googleapis.com;

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
    form-action 'self';
  `
    .replace(/\s{2,}/g, " ")
    .trim(),
}

        ],
      },
    ];
  },
};

export default nextConfig;
