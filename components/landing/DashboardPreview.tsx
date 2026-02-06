"use client";

import { Users, TrendingUp, Gift, Target, ArrowRight, Check } from "lucide-react";
import { FadeIn } from "./FadeIn";

function MetricCard({
  icon: Icon,
  label,
  value,
  change,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
          <Icon className="h-5 w-5 text-[#0D9488]" />
        </span>
        <div>
          <p className="text-xs text-[#64748B]">{label}</p>
          <p className="text-xl font-bold text-[#1A202C]">{value}</p>
        </div>
      </div>
      {change && (
        <p className="mt-2 text-xs font-medium text-emerald-600">{change}</p>
      )}
    </div>
  );
}

function ReferralRow({
  name,
  status,
  points,
  statusColor,
}: {
  name: string;
  status: string;
  points: string;
  statusColor: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-2.5 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <p className="text-sm font-medium text-[#1A202C]">{name}</p>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
          >
            {status}
          </span>
        </div>
      </div>
      <span className="text-sm font-semibold text-[#0D9488]">{points}</span>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <section className="bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-extrabold text-[#1A202C] sm:text-4xl">
            See It In Action
          </h2>
          <p className="mt-3 text-lg text-[#64748B]">
            A sneak peek at your new referral command center
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-12 mx-auto max-w-5xl">
            {/* Browser frame */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-white px-3 py-1.5 text-xs text-gray-400 border border-gray-200">
                  app.connectreward.com/admin
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-6 bg-gray-50">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#1A202C]">
                      Dashboard
                    </h3>
                    <p className="text-sm text-[#64748B]">
                      Welcome back, SunBright Solar
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Growth Plan
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                  <MetricCard
                    icon={Users}
                    label="Active Customers"
                    value="247"
                    change="+12 this month"
                  />
                  <MetricCard
                    icon={TrendingUp}
                    label="Referrals This Month"
                    value="38"
                    change="+23% vs last month"
                  />
                  <MetricCard
                    icon={Gift}
                    label="Points Distributed"
                    value="18,500"
                  />
                  <MetricCard
                    icon={Target}
                    label="Conversion Rate"
                    value="34%"
                    change="+5% vs last month"
                  />
                </div>

                {/* Two columns */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Recent referrals */}
                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-[#1A202C]">
                        Recent Referrals
                      </h4>
                      <span className="text-xs text-[#0D9488] font-medium flex items-center gap-1 cursor-pointer hover:underline">
                        View all <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                    <ReferralRow
                      name="Sarah Johnson"
                      status="Won"
                      points="+500 pts"
                      statusColor="bg-emerald-100 text-emerald-700"
                    />
                    <ReferralRow
                      name="Mike Chen"
                      status="Quoted"
                      points="Pending"
                      statusColor="bg-blue-100 text-blue-700"
                    />
                    <ReferralRow
                      name="Lisa Park"
                      status="Contacted"
                      points="Pending"
                      statusColor="bg-amber-100 text-amber-700"
                    />
                    <ReferralRow
                      name="James Wilson"
                      status="New"
                      points="Pending"
                      statusColor="bg-gray-100 text-gray-600"
                    />
                  </div>

                  {/* Activity feed */}
                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <h4 className="font-semibold text-[#1A202C] mb-3">
                      Recent Activity
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          text: "Sarah Johnson earned Gold tier",
                          time: "2 hours ago",
                        },
                        {
                          text: "New referral from Mike Chen",
                          time: "4 hours ago",
                        },
                        {
                          text: "$50 Amazon Gift Card redeemed",
                          time: "Yesterday",
                        },
                        {
                          text: "Lisa Park submitted a review",
                          time: "Yesterday",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-50">
                            <Check className="h-3 w-3 text-[#0D9488]" />
                          </span>
                          <div>
                            <p className="text-[#1A202C]">{item.text}</p>
                            <p className="text-xs text-[#94A3B8]">{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
