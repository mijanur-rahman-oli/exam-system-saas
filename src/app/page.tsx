// app/page.tsx
import Link from "next/link";
import { Button } from "../components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#0A0E1A] overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-[#4F8EF7] to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-[#4F8EF7] opacity-10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#6C3CF7] opacity-10 blur-3xl" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4F8EF7]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3h5v2H2V3zm0 4h8v2H2V7zm0 4h6v2H2v-2z" fill="white" />
              <circle cx="12" cy="11" r="3" stroke="white" strokeWidth="1.5" />
              <path d="M14.5 13.5l1.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">MockTest</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-white/40 text-sm">Platform</span>
          <span className="text-white/40 text-sm">Pricing</span>
          <span className="text-white/40 text-sm">Docs</span>
          <Link href="/login" passHref>
            <Button
              size="sm"
              className="bg-[#4F8EF7] text-white hover:bg-[#3d7be4] rounded-lg px-5 font-medium text-sm"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4F8EF7] animate-pulse" />
          Trusted by 50,000+ students and educators
        </div>

        <h1 className="mb-5 max-w-3xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]">
          The smarter way to{" "}
          <span className="bg-gradient-to-r from-[#4F8EF7] to-[#A78BF7] bg-clip-text text-transparent">
            assess knowledge
          </span>
        </h1>

        <p className="mb-10 max-w-xl text-base text-white/50 sm:text-lg leading-relaxed">
          Create, conduct, and analyze exams with confidence. Built for modern educators and institutions who demand reliability.
        </p>

        <Link href="/login" passHref>
          <Button
            size="lg"
            className="rounded-xl bg-[#4F8EF7] px-10 py-6 text-base font-semibold text-white hover:bg-[#3d7be4] shadow-lg shadow-blue-500/20 transition-all duration-200 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            Get Started — It&apos;s Free
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </Link>

        <p className="mt-3 text-xs text-white/25">No credit card required</p>

        {/* Stats strip */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-10 border-t border-white/5 pt-10">
          {[
            { value: "2M+", label: "Exams Conducted" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "150+", label: "Institutions" },
            { value: "<1s", label: "Avg. Load Time" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/35 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Feature cards */}
      <section className="relative z-10 px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              ),
              title: "Secure & Proctored",
              desc: "Anti-cheating safeguards, randomized questions, and full-screen enforcement.",
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              ),
              title: "Timed Assessments",
              desc: "Configurable timers with automatic submission when time expires.",
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              ),
              title: "Instant Analytics",
              desc: "Detailed performance reports, score distributions, and item analysis.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#4F8EF7]/30 hover:bg-white/[0.07]"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F8EF7]/10 text-[#4F8EF7] group-hover:bg-[#4F8EF7]/20 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-white">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-white/40">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-5 text-center text-xs text-white/20">
        © 2026 MockTest. All rights reserved.
      </footer>
    </div>
  );
}