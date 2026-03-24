"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRef, useEffect } from "react";
import { Plus, BookOpen, CheckCircle, Clock, Tag, TrendingUp } from "lucide-react";

function KaTeXDisplay({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current||!text) return;
    import("katex").then(katex => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_,e) => { try{return katex.default.renderToString(e,{displayMode:true,throwOnError:false})}catch{return _;} })
        .replace(/\$(.+?)\$/g,  (_,e) => { try{return katex.default.renderToString(e,{displayMode:false,throwOnError:false})}catch{return _;} });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);
  return <span ref={ref} style={{ fontSize:"inherit",lineHeight:"inherit",color:"inherit" }}/>;
}

export default function QuestionSetterDashboard() {
  const { data: session } = useSession();

  const { data: questions, isLoading } = useQuery({
    queryKey: ["qs-my-questions"],
    queryFn: () => fetch("/api/questions?createdByMe=true&limit=50").then(r=>r.json()),
  });

  const total     = questions?.length ?? 0;
  const published = questions?.filter((q:any)=>q.status==="published").length ?? 0;
  const drafts    = questions?.filter((q:any)=>q.status==="draft").length ?? 0;
  const allTags   = [...new Set((questions??[]).flatMap((q:any)=>q.tags?.map((t:any)=>t.tag?.name)??[]))];

  const recent = questions?.slice(0,5) ?? [];
  const diffColor: Record<string,string> = { easy:"var(--green)", medium:"var(--amber)", hard:"var(--red)" };

  const stats = [
    { label:"Total Questions", value:total,     Icon:BookOpen,   color:"var(--accent)", bg:"var(--accent-bg)" },
    { label:"Published",       value:published,  Icon:CheckCircle,color:"var(--green)",  bg:"var(--green-bg)"  },
    { label:"Drafts",          value:drafts,     Icon:Clock,      color:"var(--amber)",  bg:"var(--amber-bg)"  },
    { label:"Tags Used",       value:allTags.length, Icon:Tag,    color:"var(--accent)", bg:"var(--accent-bg)" },
  ];

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"1.75rem" }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"/>

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div>
          <h1 style={{ fontSize:"1.3rem",fontWeight:800,color:"var(--text)",margin:0 }}>
            Welcome, {session?.user?.username} 👋
          </h1>
          <p style={{ fontSize:"0.82rem",color:"var(--text3)",marginTop:"0.25rem" }}>Your question library overview</p>
        </div>
        <Link href="/question-setter/questions/create">
          <button style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1.1rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,fontSize:"0.82rem",cursor:"pointer" }}>
            <Plus size={15}/> New Question
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem" }}>
        {stats.map(({ label,value,Icon,color,bg }) => (
          <div key={label} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem",display:"flex",gap:"1rem",alignItems:"center" }}>
            <div style={{ width:"2.25rem",height:"2.25rem",borderRadius:"0.5rem",background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <Icon size={16} color={color}/>
            </div>
            <div>
              <div style={{ fontSize:"1.5rem",fontWeight:900,color:"var(--text)",lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:"0.7rem",color:"var(--text3)",marginTop:"0.15rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 280px",gap:"1.25rem" }}>
        {/* Recent questions */}
        <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
          <div style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:"0.72rem",fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.07em" }}>Recent Questions</span>
            <Link href="/question-setter/questions" style={{ fontSize:"0.72rem",color:"var(--accent)",textDecoration:"none" }}>View all →</Link>
          </div>
          {isLoading ? <div style={{ padding:"2rem",textAlign:"center",color:"var(--text3)" }}>Loading...</div> :
           !recent.length ? (
            <div style={{ padding:"3rem",textAlign:"center" }}>
              <BookOpen size={32} style={{ color:"var(--text3)",margin:"0 auto 1rem",display:"block" }}/>
              <p style={{ color:"var(--text3)",marginBottom:"1rem",fontSize:"0.82rem" }}>No questions yet</p>
              <Link href="/question-setter/questions/create">
                <button style={{ padding:"0.45rem 1rem",borderRadius:"0.5rem",background:"var(--accent)",border:"none",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:"0.8rem" }}>Create first question</button>
              </Link>
            </div>
           ) : recent.map((q:any) => (
            <div key={q.id} style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)" }}>
              <div style={{ fontSize:"0.82rem",color:"var(--text)",lineHeight:1.5,marginBottom:"0.35rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                <KaTeXDisplay text={q.question}/>
              </div>
              <div style={{ display:"flex",gap:"0.4rem",flexWrap:"wrap" }}>
                <span style={{ fontSize:"0.65rem",fontWeight:700,padding:"0.15rem 0.4rem",borderRadius:"999px",background:q.status==="published"?"var(--green-bg)":"var(--amber-bg)",color:q.status==="published"?"var(--green)":"var(--amber)" }}>
                  {q.status}
                </span>
                <span style={{ fontSize:"0.65rem",color:diffColor[q.difficulty]??"var(--text3)" }}>{q.difficulty}</span>
                <span style={{ fontSize:"0.65rem",color:"var(--text3)" }}>· {q.subject?.name}</span>
                <span style={{ fontSize:"0.65rem",color:"var(--text3)" }}>· {q.marks}m</span>
                {q.tags?.map((t:any) => <span key={t.tag?.name} style={{ fontSize:"0.62rem",color:"var(--accent)",background:"var(--accent-bg)",padding:"0.1rem 0.35rem",borderRadius:"999px" }}>#{t.tag?.name}</span>)}
              </div>
            </div>
          ))}
        </div>

        {/* Tag cloud */}
        <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",overflow:"hidden" }}>
          <div style={{ padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)" }}>
            <span style={{ fontSize:"0.72rem",fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.07em" }}>Your Tags</span>
          </div>
          <div style={{ padding:"1rem",display:"flex",flexWrap:"wrap",gap:"0.5rem" }}>
            {!allTags.length ? <p style={{ color:"var(--text3)",fontSize:"0.8rem" }}>No tags yet</p> :
             allTags.map(t => (
              <span key={t} style={{ padding:"0.25rem 0.6rem",borderRadius:"999px",background:"var(--accent-bg)",border:"1px solid var(--accent-dim)",fontSize:"0.75rem",color:"var(--accent)",fontWeight:600 }}>
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}