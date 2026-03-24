"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Award, TrendingUp, Clock, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const { data: session } = useSession();

  const { data: stats } = useQuery({
    queryKey: ["student-stats"],
    queryFn: () => fetch("/api/student/stats").then((r) => r.json()),
  });

  const { data: upcoming } = useQuery({
    queryKey: ["upcoming-exams"],
    queryFn: () => fetch("/api/student/upcoming-exams").then((r) => r.json()),
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-results"],
    queryFn: () => fetch("/api/student/recent-results?limit=5").then((r) => r.json()),
  });

  const username = session?.user?.username ?? "Student";

  const statCards = [
    { label: "Available Exams",  value: stats?.totalExams     ?? 0, Icon: BookOpen,    color: "var(--accent)",  bg: "var(--accent-bg)"  },
    { label: "Completed",        value: stats?.completedExams ?? 0, Icon: Award,       color: "var(--green)",   bg: "var(--green-bg)"   },
    { label: "Pending",          value: stats?.pendingExams   ?? 0, Icon: Clock,       color: "var(--amber)",   bg: "var(--amber-bg)"   },
    { label: "Avg Score",        value: `${stats?.averageScore ?? 0}%`, Icon: TrendingUp, color: "var(--accent)", bg: "var(--accent-bg)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
          Welcome back, {username} 👋
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text3)", marginTop: "0.25rem" }}>
          Here's your exam activity at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {statCards.map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
              <div style={{ width: "1.9rem", height: "1.9rem", borderRadius: "0.45rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={color} />
              </div>
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* Upcoming exams */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)" }}>Available Exams</span>
            <Link href="/student/exams" style={{ fontSize: "0.72rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
          </div>
          <div>
            {!upcoming || upcoming.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)", fontSize: "0.82rem" }}>
                No exams available right now
              </div>
            ) : upcoming.slice(0, 4).map((exam: any) => (
              <Link key={exam.id} href={`/student/take-exam/${exam.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer", transition: "background 0.12s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {exam.examName}
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "var(--text3)", margin: "0.2rem 0 0" }}>
                      {exam.subject?.name} · {exam.duration} min
                      {exam.totalMarks ? ` · ${exam.totalMarks} marks` : ""}
                    </p>
                  </div>
                  <ChevronRight size={14} color="var(--text3)" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent results */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)" }}>Recent Results</span>
            <Link href="/student/results" style={{ fontSize: "0.72rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
          </div>
          <div>
            {!recent || recent.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)", fontSize: "0.82rem" }}>
                No results yet — take an exam to get started
              </div>
            ) : recent.map((r: any) => {
              const pct   = r.score ?? 0;
              const color = pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)";
              return (
                <Link key={r.id} href={`/student/results/${r.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.examName}
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "var(--text3)", margin: "0.2rem 0 0" }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color, flexShrink: 0 }}>{pct}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick tip */}
      {stats?.completedExams === 0 && (
        <div style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-dim)", borderRadius: "var(--radius)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Trophy size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent)", margin: 0 }}>Start your first exam!</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text2)", margin: "0.15rem 0 0" }}>Pick an exam from the list above and click Start to begin.</p>
          </div>
          <Link href="/student/exams" style={{ marginLeft: "auto", flexShrink: 0 }}>
            <button style={{ padding: "0.45rem 1rem", borderRadius: "0.4rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
              Browse Exams
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}