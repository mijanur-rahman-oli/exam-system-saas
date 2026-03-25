"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Download, Edit, Trophy, ToggleLeft, ToggleRight, Trash2, BookOpen, Clock, Users, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { KaTeXDisplay } from "@/components/katex/KaTeXDisplay";

function stripLatexForPDF(t: string) {
  return t.replace(/\$\$(.+?)\$\$/gs, (_, e) => e).replace(/\$(.+?)\$/g, (_, e) => e);
}

export default function AdminViewExamPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { toast } = useToast();

  const { data: exam, isLoading, refetch } = useQuery({
    queryKey: ["admin-exam", id],
    queryFn: async () => { const r = await fetch(`/api/exams/${id}`); if (!r.ok) throw new Error("Failed"); return r.json(); },
  });

  const toggle = useMutation({
    mutationFn: async (isActive: boolean) => {
      await fetch(`/api/exams/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    },
    onSuccess: () => { toast({ title: "Updated" }); refetch(); },
  });

  const del = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Failed"); }
    },
    onSuccess: () => { toast({ title: "Deleted" }); router.push("/admin/exams"); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handlePDF = () => {
    if (!exam) return;
    const qs = exam.examQuestions ?? [];
    const qHtml = qs.map((eq: any, idx: number) => {
      const q = eq.question;
      const opts = [
        { key: "A", text: q?.optionA, img: q?.optionAImage },
        { key: "B", text: q?.optionB, img: q?.optionBImage },
        { key: "C", text: q?.optionC, img: q?.optionCImage },
        { key: "D", text: q?.optionD, img: q?.optionDImage },
      ].filter(o => o.text || o.img);
      return `<div style="margin-bottom:20px;page-break-inside:avoid;">
        <div style="display:flex;gap:6px;margin-bottom:6px;">
          <span style="font-weight:bold;font-size:14px;flex-shrink:0;">Q${idx + 1}.</span>
          <div style="flex:1;">
            <span style="font-size:14px;line-height:1.6;">${stripLatexForPDF(q?.question ?? "")}</span>
            <span style="float:right;font-size:12px;color:#555;font-weight:bold;">[${eq.marks} Mark${eq.marks !== 1 ? "s" : ""}]</span>
          </div>
        </div>
        ${q?.questionImage ? `<img src="${q.questionImage}" style="max-height:160px;max-width:60%;object-fit:contain;display:block;margin:6px 0 10px 22px;border:1px solid #ddd;"/>` : ""}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;padding-left:22px;">
          ${opts.map(o => `<div style="display:flex;gap:6px;align-items:flex-start;font-size:13px;line-height:1.5;">
            <span style="font-weight:bold;flex-shrink:0;">(${o.key})</span>
            <div>${o.text ? `<span>${stripLatexForPDF(o.text)}</span>` : ""}${o.img ? `<img src="${o.img}" style="max-height:80px;max-width:100%;object-fit:contain;display:block;margin-top:4px;"/>` : ""}
            </div></div>`).join("")}
        </div>
      </div>`;
    }).join("");
    const total = exam.totalMarks ?? qs.reduce((s: number, q: any) => s + q.marks, 0);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${exam.examName}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Times New Roman',serif;font-size:13px;color:#000;background:#fff;padding:20mm 18mm;}@page{size:A4 portrait;margin:0;}@media print{body{padding:18mm;}}</style>
      </head><body>
      <div style="border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:16px;">
        <h1 style="font-size:20px;font-weight:bold;text-align:center;margin-bottom:6px;">${exam.examName}</h1>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#333;flex-wrap:wrap;gap:8px;">
          <span><strong>Subject:</strong> ${exam.subject?.name ?? "—"}</span>
          <span><strong>Course:</strong> ${exam.course?.name ?? "—"}</span>
          <span><strong>Duration:</strong> ${exam.duration} minutes</span>
          <span><strong>Total Marks:</strong> ${total}</span>
        </div>
        ${exam.description ? `<p style="font-size:11px;color:#555;margin-top:5px;font-style:italic;text-align:center;">${exam.description}</p>` : ""}
      </div>
      <div style="margin-bottom:16px;padding:7px 10px;border:1px solid #bbb;font-size:11px;color:#333;">
        <strong>Instructions:</strong> Answer all questions. Each question carries the marks indicated.${exam.passingMarks ? ` Passing marks: ${exam.passingMarks}.` : ""} Time allowed: ${exam.duration} minutes.
      </div>
      ${qHtml}
      <div style="margin-top:36px;border-top:1px solid #ccc;padding-top:8px;font-size:11px;color:#666;display:flex;justify-content:space-between;">
        <span>— End of Question Paper —</span><span>Total: ${total} Marks</span>
      </div>
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=900,height=700");
    if (w) { w.document.write(html); w.document.close(); }
  };

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
      <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!exam || exam.error) return <div style={{ padding: "2rem", color: "var(--red)" }}>Exam not found.</div>;

  const qs = exam.examQuestions ?? [];
  const attempts = exam.examAttempts ?? [];
  const completedCt = attempts.filter((a: any) => a.isCompleted).length;
  const avgScore = completedCt > 0 ? Math.round(attempts.filter((a: any) => a.isCompleted).reduce((s: number, a: any) => s + (a.score ?? 0), 0) / completedCt) : 0;
  const diffColor: Record<string, string> = { easy: "var(--green)", medium: "var(--amber)", hard: "var(--red)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <Link href="/admin/exams"><button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex", padding: "0.25rem" }}><ArrowLeft size={18} /></button></Link>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>{exam.examName}</h1>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.68rem", color: "var(--accent)", background: "var(--accent-bg)", padding: "0.15rem 0.5rem", borderRadius: "999px", fontWeight: 600 }}>{exam.course?.name}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>{exam.subject?.name}</span>
              {exam.creator && <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>by {exam.creator.username}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href={`/admin/exams/${id}/leaderboard`}>
            <button style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.875rem", borderRadius: "0.5rem", background: "var(--amber-bg)", border: "1px solid var(--amber)", color: "var(--amber)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
              <Trophy size={13} /> Leaderboard
            </button>
          </Link>
          <Link href={`/admin/exams/${id}/edit`}>
            <button style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.875rem", borderRadius: "0.5rem", background: "var(--accent-bg)", border: "1px solid var(--accent)", color: "var(--accent)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
              <Edit size={13} /> Edit
            </button>
          </Link>
          <button onClick={() => toggle.mutate(!exam.isActive)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.875rem", borderRadius: "0.5rem", background: exam.isActive ? "var(--green-bg)" : "var(--surface2)", border: `1px solid ${exam.isActive ? "var(--green)" : "var(--border)"}`, color: exam.isActive ? "var(--green)" : "var(--text2)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
            {exam.isActive ? <><ToggleRight size={13} /> Active</> : <><ToggleLeft size={13} /> Inactive</>}
          </button>
          <button onClick={handlePDF}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.875rem", borderRadius: "0.5rem", background: "var(--accent)", border: "none", color: "#fff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 }}>
            <Download size={13} /> PDF
          </button>
          <button onClick={() => { if (confirm(`Delete "${exam.examName}"?`)) del.mutate(); }}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.875rem", borderRadius: "0.5rem", background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        {[
          { label: "Questions", value: qs.length, Icon: BookOpen, color: "var(--accent)", bg: "var(--accent-bg)" },
          { label: "Duration", value: `${exam.duration}m`, Icon: Clock, color: "var(--amber)", bg: "var(--amber-bg)" },
          { label: "Attempts", value: attempts.length, Icon: Users, color: "var(--green)", bg: "var(--green-bg)" },
          { label: "Avg Score", value: `${avgScore}`, Icon: Trophy, color: "var(--accent)", bg: "var(--accent-bg)" },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.1rem 1.25rem", display: "flex", gap: "0.875rem", alignItems: "center" }}>
            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={15} color={color} />
            </div>
            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text3)", marginTop: "0.15rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Details */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Details</span>
          </div>
          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[
              ["Course", exam.course?.name ?? "-"],
              ["Subject", exam.subject?.name ?? "-"],
              ["Total Marks", exam.totalMarks ?? "-"],
              ["Passing Marks", exam.passingMarks ?? "-"],
              ["Retake", exam.retakeAllowed ? "Allowed" : "Not allowed"],
              ["Schedule", exam.scheduleTime ? new Date(exam.scheduleTime).toLocaleString() : "Immediate"],
            ].map(([label, value]) => (
              <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.625rem", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text3)" }}>{label}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Questions ({qs.length})</span>
          </div>
          <div style={{ maxHeight: "340px", overflowY: "auto" }}>
            {!qs.length ? <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)", fontSize: "0.82rem" }}>No questions</div> :
              qs.map((eq: any, idx: number) => (
                <div key={eq.id} style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text3)", flexShrink: 0, paddingTop: "0.15rem" }}>Q{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text)", margin: "0 0 0.2rem" }}>
                      <KaTeXDisplay text={eq.question?.question} inline />
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.65rem", color: diffColor[eq.question?.difficulty] ?? "var(--text3)" }}>{eq.question?.difficulty}</span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>{eq.marks}m</span>
                      {eq.question?.tags?.map((t: any) => <span key={t.tag?.name} style={{ fontSize: "0.62rem", color: "var(--accent)", background: "var(--accent-bg)", padding: "0.1rem 0.3rem", borderRadius: "999px" }}>#{t.tag?.name}</span>)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Answer key */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle size={14} color="var(--green)" />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Answer Key</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                {["Q#", "Question", "Answer", "Marks", "Difficulty"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 1.1rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {qs.map((eq: any, idx: number) => (
                <tr key={eq.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem 1.1rem", fontWeight: 700, color: "var(--text3)" }}>{idx + 1}</td>
                  <td style={{ padding: "0.75rem 1.1rem", color: "var(--text)", maxWidth: "320px" }}>
                    <KaTeXDisplay text={eq.question?.question} inline />
                  </td>
                  <td style={{ padding: "0.75rem 1.1rem" }}>
                    <span style={{ fontWeight: 800, color: "var(--green)", background: "var(--green-bg)", padding: "0.2rem 0.6rem", borderRadius: "0.375rem", fontSize: "0.82rem" }}>{eq.question?.correctAnswer}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1.1rem", color: "var(--text)" }}>{eq.marks}</td>
                  <td style={{ padding: "0.75rem 1.1rem" }}>
                    <span style={{ fontSize: "0.72rem", color: diffColor[eq.question?.difficulty] ?? "var(--text3)", fontWeight: 600 }}>{eq.question?.difficulty}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent attempts */}
      {attempts.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Recent Attempts</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                  {["Student", "Score", "Status", "Submitted"].map(h => (
                    <th key={h} style={{ padding: "0.625rem 1.1rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 10).map((a: any) => {
                  const pct = exam.totalMarks > 0 ? Math.round(((a.score ?? 0) / exam.totalMarks) * 100) : 0;
                  return (
                    <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 1.1rem", fontWeight: 600, color: "var(--text)" }}>{a.student?.username ?? a.guestName ?? "Guest"}</td>
                      <td style={{ padding: "0.75rem 1.1rem" }}>
                        <span style={{ fontWeight: 700, color: pct >= 50 ? "var(--green)" : "var(--red)" }}>{a.score ?? 0}/{exam.totalMarks}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1.1rem" }}>
                        {a.isCompleted
                          ? <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--green)", fontSize: "0.75rem" }}><CheckCircle size={12} /> Done</span>
                          : <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--amber)", fontSize: "0.75rem" }}><XCircle size={12} /> In progress</span>}
                      </td>
                      <td style={{ padding: "0.75rem 1.1rem", color: "var(--text3)" }}>{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}