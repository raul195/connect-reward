import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://connectreward.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/early-access", "/login", "/signup"],
        disallow: ["/dashboard/", "/admin/", "/super-admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
