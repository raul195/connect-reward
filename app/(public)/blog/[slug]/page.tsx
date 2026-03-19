import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — Connect Reward Blog`,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://connectreward.io/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: post.image
        ? [{ url: post.image, width: 1200, height: 630, alt: post.title }]
        : [{ url: "/og-image.png", width: 1200, height: 630, alt: "Connect Reward" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = await getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug)
    .filter((p) => p.category === post.category || p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: { "@type": "Organization", name: post.author },
      publisher: {
        "@type": "Organization",
        name: "Connect Reward",
        url: "https://connectreward.io",
        logo: "https://connectreward.io/logo.png",
      },
      mainEntityOfPage: `https://connectreward.io/blog/${slug}`,
      image: post.image || "https://connectreward.io/og-image.png",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://connectreward.io" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://connectreward.io/blog" },
        { "@type": "ListItem", position: 3, name: post.title, item: `https://connectreward.io/blog/${slug}` },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <article className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0D9488] hover:text-[#0F766E] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            <div className="mt-8">
              <span className="inline-block rounded-full bg-[#F0FDFA] px-3 py-1 text-xs font-semibold text-[#0D9488]">
                {post.category}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-4 text-lg text-[#64748B]">{post.description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[#94A3B8]">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.readingTime}
                </span>
              </div>
            </div>

            {post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-medium text-[#475569]">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="prose prose-lg mt-12 max-w-none prose-headings:text-[#1A202C] prose-headings:font-bold prose-p:text-[#475569] prose-p:leading-relaxed prose-a:text-[#0D9488] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#1A202C] prose-li:text-[#475569] prose-blockquote:border-[#0D9488] prose-blockquote:text-[#64748B]">
              <MDXRemote source={post.content} />
            </div>

            <div className="mt-16 rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] p-8 text-center text-white">
              <h2 className="text-2xl font-bold">Ready to build your referral program?</h2>
              <p className="mt-2 text-white/80">Start free today — no credit card required.</p>
              <Link
                href="/signup"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0D9488] shadow-md transition-all hover:bg-gray-50"
              >
                Get Started Free
              </Link>
            </div>

            {relatedPosts.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-[#1A202C]">Related Articles</h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.slug}
                      href={`/blog/${rp.slug}`}
                      className="group rounded-xl border border-gray-100 p-5 transition-shadow hover:shadow-md"
                    >
                      <span className="text-xs font-semibold text-[#0D9488]">{rp.category}</span>
                      <h3 className="mt-2 font-bold text-[#1A202C] group-hover:text-[#0D9488] transition-colors">
                        {rp.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#64748B] line-clamp-2">{rp.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
