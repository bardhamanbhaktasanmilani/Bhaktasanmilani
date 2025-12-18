import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // -------------------------------
          // BASIC SECURITY HEADERS
          // -------------------------------
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
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

          // -------------------------------
          // CONTENT SECURITY POLICY (Three.js + WebGL SAFE)
          // -------------------------------
        {
  key: "Content-Security-Policy",
  value: `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    connect-src 'self' blob:;
    worker-src 'self' blob:;
    frame-src 'self';
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
