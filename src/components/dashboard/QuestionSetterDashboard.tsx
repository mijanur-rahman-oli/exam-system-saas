// components/dashboard/QuestionSetterDashboard.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PlusCircle, ClipboardList, BookOpen, TrendingUp, Edit3 } from "lucide-react";

export default function QuestionSetterDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["qs-stats"],
    queryFn: () => fetch("/api/question-setter/stats").then(r => r.json()),
  });

  const { data: recent } = useQuery({
    queryKey: ["qs-recent-questions"],
    queryFn: () => fetch("/api/questions?createdByMe=true&limit=6").then(r => r.json()),
  });

  const diffStyle: Record<string, { bg: string; color: string }> = {
    easy:   { bg: "var(--green-bg)", color: "var(--green)" },
    medium: { bg: "var(--amber-bg)", color: "var(--amber)" },
    hard:   { bg: "var(--red-bg)",   color: "var(--red)"   },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
          Question Setter Dashboard
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.25rem" }}>
          Create and manage your question bank
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        {[
          { label: "Questions Written",  value: stats?.total ?? 0,    icon: BookOpen,    color: "var(--accent)", bg: "var(--accent-bg)" },
          { label: "This Month",         value: stats?.thisMonth ?? 0, icon: TrendingUp,  color: "var(--green)",  bg: "var(--green-bg)"  },
          { label: "Subjects Covered",   value: stats?.subjects ?? 0, icon: ClipboardList, color: "var(--amber)", bg: "var(--amber-bg)" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1.25rem",
            display: "flex", gap: "1rem", alignItems: "center",
          }}>
            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text2)", marginTop: "0.2rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
          Quick Actions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0.875rem" }}>
          {[
            { href: "/question-setter/questions/create", label: "Add New Question",    Icon: PlusCircle,    desc: "Write a new question with LaTeX & images" },
            { href: "/question-setter/questions",        label: "Browse My Questions", Icon: ClipboardList, desc: "View, filter, and manage your questions"    },
          ].map(({ href, label, Icon, desc }) => (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "1.1rem",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", flexDirection: "column", gap: "0.6rem",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <Icon size={18} color="var(--accent)" />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)" }}>{label}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text3)", marginTop: "0.2rem" }}>{desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent questions */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Recent Questions
          </h2>
          <Link href="/question-setter/questions" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none" }}>View all →</Link>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {!recent?.length ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>
              No questions yet —{" "}
              <Link href="/question-setter/questions/create" style={{ color: "var(--accent)" }}>create your first one</Link>
            </div>
          ) : recent.map((q: any, i: number) => {
            const ds = diffStyle[q.difficulty] ?? { bg: "var(--surface2)", color: "var(--text3)" };
            return (
              <div key={q.id} style={{
                padding: "0.875rem 1.25rem",
                borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex", alignItems: "flex-start", gap: "0.875rem",
                transition: "background 0.12s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "0.82rem", color: "var(--text)", margin: 0,
                    lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {q.question}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.65rem", padding: "0.12rem 0.4rem", borderRadius: "999px", background: ds.bg, color: ds.color }}>{q.difficulty}</span>
                    {q.subject?.name && <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>{q.subject.name}</span>}
                    {q.chapter?.name && <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>· {q.chapter.name}</span>}
                    <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>· {q.marks} pt{q.marks !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <Link href={`/question-setter/questions/${q.id}/edit`}>
                  <button style={{
                    flexShrink: 0, background: "none", border: "1px solid var(--border)",
                    borderRadius: "0.375rem", padding: "0.28rem 0.55rem",
                    color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center",
                    gap: "0.25rem", fontSize: "0.7rem",
                  }}>
                    <Edit3 size={11} /> Edit
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}