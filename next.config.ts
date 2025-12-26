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
      // GLOBAL SECURITY HEADERS (UNCHANGED)
      // ----------------------------------
      {
        source: "/(.*)",
        headers: [
          // BASIC SECURITY HEADERS
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

          // CONTENT SECURITY POLICY (WebGL + Google Maps SAFE)
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://maps.googleapis.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https://maps.gstatic.com https://maps.googleapis.com;
              font-src 'self' data:;
              connect-src 'self' blob: https://maps.googleapis.com;
              worker-src 'self' blob:;
              frame-src 'self' https://www.google.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
