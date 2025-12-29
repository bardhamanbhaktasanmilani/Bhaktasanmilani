import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "/",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "/about",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "/how-we-work",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "/donate",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "/meet-our-organizers",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "/contact",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: "/faq",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "/privacy-policy",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "/return-policy",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "/terms-and-conditions",
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
