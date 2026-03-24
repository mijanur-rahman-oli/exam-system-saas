"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowLeft, Trophy, Target, Clock } from "lucide-react";

// ─── KaTeX renderer ───────────────────────────────────────────────────────────
function KaTeXDisplay({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || !text) return;
    import("katex").then((katex) => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_, expr) => {
          try { return katex.default.renderToString(expr, { displayMode: true,  throwOnError: false }); }
          catch { return _; }
        })
        .replace(/\$(.+?)\$/g, (_, expr) => {
          try { return katex.default.renderToString(expr, { displayMode: false, throwOnError: false }); }
          catch { return _; }
        });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);
  return <span ref={ref} style={{ fontSize: "inherit", lineHeight: "inherit", color: "inherit" }} />;
}

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const { data: result, isLoading } = useQuery({
    queryKey: ["result", id],
    staleTime: 0,
    queryFn: async () => {
      const res = await fetch(`/api/student/results/${id}`);
      if (!res.ok) throw new Error("Failed to fetch result");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text3)", fontSize: "0.85rem" }}>Loading result...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!result || result.error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--red)", marginBottom: "1rem" }}>{result?.error ?? "Result not found."}</p>
          <button onClick={() => router.push("/student/results")} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.4rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const totalMarks = result.totalMarks ?? result.answers?.length ?? 0;
  const score      = result.score ?? 0;
  const pct        = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const passed     = result.passingMarks ? score >= result.passingMarks : pct >= 50;
  const correctCt  = result.answers?.filter((a: any) => a.isCorrect).length ?? 0;
  const pctColor   = pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)";
  const pctBg      = pct >= 75 ? "var(--green-bg)" : pct >= 50 ? "var(--amber-bg)" : "var(--red-bg)";
  const examId     = result.exam?.id;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* KaTeX CSS */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

      {/* Header row: Back + Leaderboard */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <button
          onClick={() => router.push("/student/results")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "0.82rem", padding: 0 }}
        >
          <ArrowLeft size={14} /> Back to Results
        </button>

        {examId && (
          <Link href={`/student/leaderboard/${examId}`} style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.45rem 1rem", borderRadius: "0.5rem",
              background: "var(--amber-bg)", border: "1px solid var(--amber)",
              color: "var(--amber)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700,
            }}>
              <Trophy size={13} /> View Leaderboard
            </button>
          </Link>
        )}
      </div>

      {/* Score card */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem", boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1.25rem" }}>
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)", margin: "0 0 0.25rem" }}>
              {result.exam?.examName}
            </h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>
              {result.exam?.course?.name && <span style={{ color: "var(--accent)", marginRight: "0.4rem" }}>{result.exam.course.name} ·</span>}
              Submitted {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "—"}
            </p>
          </div>
          <div style={{ textAlign: "center", padding: "1rem 1.5rem", borderRadius: "0.75rem", background: pctBg, border: `1px solid ${pctColor}`, minWidth: "110px" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: 900, color: pctColor, lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: "0.72rem", color: pctColor, marginTop: "0.2rem", fontWeight: 600 }}>
              {passed ? "PASSED" : "FAILED"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginTop: "1.25rem" }}>
          {[
            { Icon: Trophy, label: "Score",   value: `${score} / ${totalMarks}`,                      color: "var(--accent)", bg: "var(--accent-bg)" },
            { Icon: Target, label: "Correct", value: `${correctCt} / ${result.answers?.length ?? 0}`, color: "var(--green)",  bg: "var(--green-bg)"  },
            { Icon: Clock,  label: "Status",  value: passed ? "Passed" : "Failed",                    color: passed ? "var(--green)" : "var(--red)", bg: passed ? "var(--green-bg)" : "var(--red-bg)" },
          ].map(({ Icon, label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: "0.5rem", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Icon size={16} color={color} />
              <div>
                <div style={{ fontSize: "0.65rem", color, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer review */}
      {result.answers?.length > 0 && (
        <div>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
            Answer Review
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {result.answers.map((ans: any, idx: number) => {
              const opts = [
                { key: "A", text: ans.question?.optionA, img: ans.question?.optionAImage },
                { key: "B", text: ans.question?.optionB, img: ans.question?.optionBImage },
                { key: "C", text: ans.question?.optionC, img: ans.question?.optionCImage },
                { key: "D", text: ans.question?.optionD, img: ans.question?.optionDImage },
              ].filter((o) => o.text);

              const borderColor = ans.isCorrect ? "var(--green)" : ans.selectedAnswer ? "var(--red)" : "var(--border)";

              return (
                <div key={ans.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: `1px solid ${borderColor}`, padding: "1.25rem", boxShadow: "var(--shadow)" }}>
                  {/* Question */}
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text3)", flexShrink: 0, paddingTop: "0.15rem" }}>Q{idx + 1}</span>
                    <div style={{ fontSize: "0.88rem", color: "var(--text)", lineHeight: 1.6, flex: 1 }}>
                      <KaTeXDisplay text={ans.question?.question ?? ""} />
                      {ans.question?.questionImage && (
                        <img src={ans.question.questionImage} alt="question" style={{ marginTop: "0.5rem", maxHeight: "180px", maxWidth: "100%", objectFit: "contain", borderRadius: "0.5rem", border: "1px solid var(--border)", display: "block" }} />
                      )}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {ans.isCorrect
                        ? <CheckCircle size={18} color="var(--green)" />
                        : ans.selectedAnswer
                        ? <XCircle size={18} color="var(--red)" />
                        : <span style={{ fontSize: "0.65rem", background: "var(--amber-bg)", color: "var(--amber)", padding: "0.2rem 0.4rem", borderRadius: "0.3rem", fontWeight: 700 }}>SKIPPED</span>}
                    </div>
                  </div>

                  {/* Options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {opts.map((opt) => {
                      const isCorrectOpt = ans.question?.correctAnswer?.split(",").includes(opt.key);
                      const isSelected   = ans.selectedAnswer?.split(",").includes(opt.key);
                      let bg = "var(--surface2)", border = "var(--border)", color = "var(--text2)";
                      if (isCorrectOpt)                { bg = "var(--green-bg)"; border = "var(--green)"; color = "var(--green)"; }
                      if (isSelected && !isCorrectOpt) { bg = "var(--red-bg)";   border = "var(--red)";   color = "var(--red)";   }
                      return (
                        <div key={opt.key} style={{ padding: "0.5rem 0.875rem", borderRadius: "0.4rem", background: bg, border: `1px solid ${border}`, fontSize: "0.82rem", color, display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, flexShrink: 0 }}>{opt.key}.</span>
                          <div style={{ flex: 1 }}>
                            <KaTeXDisplay text={opt.text ?? ""} />
                            {opt.img && <img src={opt.img} alt="" style={{ marginTop: "0.4rem", maxHeight: "120px", maxWidth: "100%", objectFit: "contain", borderRadius: "0.375rem", border: "1px solid var(--border)", display: "block" }} />}
                          </div>
                          {isCorrectOpt && <span style={{ fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>✓ Correct</span>}
                          {isSelected && !isCorrectOpt && <span style={{ fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>✗ Your answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {ans.question?.explanation && (
                    <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.875rem", borderRadius: "0.4rem", background: "var(--amber-bg)", border: "1px solid var(--amber)", fontSize: "0.78rem", color: "var(--amber)", lineHeight: 1.5 }}>
                      <span>💡 </span><KaTeXDisplay text={ans.question.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}