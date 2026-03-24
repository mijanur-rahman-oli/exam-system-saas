"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Trophy, Clock, Medal, Users, ArrowLeft, Crown, Download } from "lucide-react";
import Link from "next/link";

type Entry = {
  rank: number;
  attemptId: number;
  name: string;
  college: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number | null;
  type: "guest" | "registered";
  submittedAt: string;
  isCurrentUser: boolean;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Crown size={14} color="#fff" />
    </div>
  );
  if (rank === 2) return (
    <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "linear-gradient(135deg, #94a3b8, #64748b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Medal size={14} color="#fff" />
    </div>
  );
  if (rank === 3) return (
    <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "linear-gradient(135deg, #cd7c3a, #a85c22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Medal size={14} color="#fff" />
    </div>
  );
  return (
    <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.72rem", fontWeight: 800, color: "var(--text3)" }}>
      {rank}
    </div>
  );
}

export default function LeaderboardPage() {
  const params  = useParams();
  const examId  = (params.examId ?? params.id) as string;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const { data, isLoading, error } = useQuery({
    queryKey: ["leaderboard", examId],
    queryFn: async () => {
      const res = await fetch(`/api/exams/${examId}/leaderboard`);
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return res.json();
    },
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const leaderboard: Entry[] = data?.leaderboard ?? [];
  const exam = data?.exam;

  // Current student's rank
  const myEntry = leaderboard.find((e) => e.isCurrentUser);

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
      <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "var(--text3)", fontSize: "0.85rem" }}>Loading leaderboard...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
      <p style={{ color: "var(--red)" }}>Failed to load leaderboard.</p>
    </div>
  );


  const exportCSV = () => {
    if (!leaderboard.length) return;
    const rows = [
      ["Rank", "Name", "Score", "Total Marks", "Percentage", "Time (min)", "Type", "Submitted At"],
      ...leaderboard.map((e) => [
        e.rank,
        e.name,
        e.score,
        e.totalMarks,
        `${e.percentage}%`,
        e.timeTaken ?? "—",
        e.type,
        e.submittedAt ? new Date(e.submittedAt).toLocaleString() : "—",
      ]),
    ];
    const csv  = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${exam?.examName ?? "exam"}_leaderboard.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <Link href={isAdmin ? "/admin/exams" : "/student/exams"}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex", padding: "0.25rem" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Trophy size={18} color="var(--amber)" />
              <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Leaderboard</h1>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>
              {exam?.examName} {exam?.subject?.name && `· ${exam.subject.name}`}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isAdmin && leaderboard.length > 0 && (
            <button
              onClick={exportCSV}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", borderRadius: "0.5rem", background: "var(--green-bg)", border: "1px solid var(--green)", color: "var(--green)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}
            >
              <Download size={13} /> Export CSV
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.72rem", color: "var(--text3)" }}>
            <Users size={13} />
            {data.totalParticipants} participant{data.totalParticipants !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* My rank banner (students only) */}
      {myEntry && (
        <div style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-dim)", borderRadius: "var(--radius)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <RankBadge rank={myEntry.rank} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)", margin: 0 }}>Your Rank</p>
            <p style={{ fontSize: "0.72rem", color: "var(--text2)", margin: 0 }}>
              #{myEntry.rank} of {data.totalParticipants} · {myEntry.score}/{myEntry.totalMarks} ({myEntry.percentage}%)
            </p>
          </div>
          <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent)" }}>#{myEntry.rank}</span>
        </div>
      )}

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.875rem" }}>
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
            if (!entry) return <div key={i} />;
            const heights = ["160px", "200px", "140px"];
            const colors  = [
              { bg: "linear-gradient(135deg, #94a3b8, #64748b)", text: "#fff" },
              { bg: "linear-gradient(135deg, #f59e0b, #d97706)", text: "#fff" },
              { bg: "linear-gradient(135deg, #cd7c3a, #a85c22)", text: "#fff" },
            ];
            return (
              <div key={entry.rank} style={{
                background: "var(--surface)", border: `1px solid ${entry.isCurrentUser ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius)", padding: "1.25rem", textAlign: "center",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                minHeight: heights[i], boxShadow: entry.rank === 1 ? "0 0 0 2px var(--amber)" : "var(--shadow)",
                position: "relative", overflow: "hidden",
              }}>
                {entry.rank === 1 && (
                  <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem" }}>
                    <Crown size={16} color="var(--amber)" />
                  </div>
                )}
                <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: colors[i].bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem", fontSize: "1rem", fontWeight: 900, color: colors[i].text }}>
                  {entry.rank}
                </div>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.2rem", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.name}
                </p>

                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: entry.rank === 1 ? "var(--amber)" : "var(--accent)" }}>
                  {entry.percentage}%
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text3)" }}>
                  {entry.score}/{entry.totalMarks}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full leaderboard table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Full Rankings
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
            No participants yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                  {["Rank", "Name", "Score", "Percentage", "Time"].map((h) => (
                    <th key={h} style={{ padding: "0.625rem 1.1rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const pctColor = entry.percentage >= 75 ? "var(--green)" : entry.percentage >= 50 ? "var(--amber)" : "var(--red)";
                  const isMe     = entry.isCurrentUser;
                  return (
                    <tr key={entry.attemptId}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: isMe ? "var(--accent-bg)" : "transparent",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { if (!isMe) e.currentTarget.style.background = "var(--surface2)"; }}
                      onMouseLeave={(e) => { if (!isMe) e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "0.875rem 1.1rem" }}>
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td style={{ padding: "0.875rem 1.1rem" }}>
                        <div style={{ fontWeight: 600, color: isMe ? "var(--accent)" : "var(--text)" }}>
                          {entry.name} {isMe && <span style={{ fontSize: "0.65rem", color: "var(--accent)", fontWeight: 700 }}>(You)</span>}
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1.1rem", fontWeight: 600, color: "var(--text)" }}>
                        {entry.score} / {entry.totalMarks}
                      </td>
                      <td style={{ padding: "0.875rem 1.1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div style={{ width: "60px", height: "5px", borderRadius: "3px", background: "var(--surface3)" }}>
                            <div style={{ width: `${entry.percentage}%`, height: "100%", borderRadius: "3px", background: pctColor }} />
                          </div>
                          <span style={{ fontWeight: 700, color: pctColor }}>{entry.percentage}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1.1rem", color: "var(--text3)", whiteSpace: "nowrap" }}>
                        {entry.timeTaken != null ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Clock size={11} /> {entry.timeTaken} min
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}