import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ArrowRight, Clock, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Connect Reward",
  description:
    "Tips, strategies, and insights on building referral programs for home service businesses. Learn how to get more referrals for your solar, roofing, HVAC, or home service company.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Connect Reward",
    description:
      "Tips, strategies, and insights on building referral programs for home service businesses.",
    url: "https://connectreward.io/blog",
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main>
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl lg:text-5xl">
                The Referral Rewards Blog
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[#64748B]">
                Strategies, tips, and insights to help home service businesses
                get more referrals and grow through word-of-mouth.
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="mt-16 text-center">
                <p className="text-[#64748B]">
                  Blog posts coming soon. Check back later!
                </p>
              </div>
            ) : (
              <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {post.image && (
                      <div className="aspect-[16/9] overflow-hidden rounded-t-2xl bg-[#F8FAFC]">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <span className="inline-block w-fit rounded-full bg-[#F0FDFA] px-3 py-1 text-xs font-semibold text-[#0D9488]">
                        {post.category}
                      </span>
                      <h2 className="mt-3 text-lg font-bold text-[#1A202C] group-hover:text-[#0D9488] transition-colors">
                        {post.title}
                      </h2>
                      <p className="mt-2 flex-1 text-sm text-[#64748B] line-clamp-3">
                        {post.description}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-xs text-[#94A3B8]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
