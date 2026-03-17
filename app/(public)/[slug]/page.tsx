import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { INDUSTRY_PAGES } from "@/lib/industry-pages";
import { IndustryPageTemplate } from "@/components/landing/IndustryPageTemplate";

export function generateStaticParams() {
  return Object.keys(INDUSTRY_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = INDUSTRY_PAGES[slug];
  if (!industry) return {};

  return {
    title: industry.title,
    description: industry.metaDescription,
    alternates: { canonical: `/${industry.slug}` },
    openGraph: {
      title: industry.title,
      description: industry.metaDescription,
      url: `https://connectreward.io/${industry.slug}`,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Connect Reward",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: industry.title,
      description: industry.metaDescription,
      images: ["/og-image.png"],
    },
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = INDUSTRY_PAGES[slug];
  if (!industry) notFound();

  return <IndustryPageTemplate data={industry} />;
}
