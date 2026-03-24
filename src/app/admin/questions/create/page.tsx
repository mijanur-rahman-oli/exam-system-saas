"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Image, Tag, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function KaTeXPreview({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current||!text) return;
    import("katex").then(katex => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs,(_,e)=>{try{return katex.default.renderToString(e,{displayMode:true,throwOnError:false})}catch{return _;}})
        .replace(/\$(.+?)\$/g,(_,e)=>{try{return katex.default.renderToString(e,{displayMode:false,throwOnError:false})}catch{return _;}});
      if(ref.current)ref.current.innerHTML=html;
    });
  },[text]);
  return <span ref={ref} style={{fontSize:"inherit",lineHeight:"inherit"}}/>;
}

function TagInput({ tags, onChange }: { tags:string[]; onChange:(t:string[])=>void }) {
  const [input, setInput]           = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return; }
    const t = setTimeout(()=>{
      fetch(`/api/tags?search=${encodeURIComponent(input)}`).then(r=>r.json()).then(d=>setSuggestions(Array.isArray(d)?d:[])).catch(()=>{});
    },250);
    return ()=>clearTimeout(t);
  },[input]);
  const add = (name:string) => {
    const n=name.toLowerCase().trim();
    if(n&&!tags.includes(n)) onChange([...tags,n]);
    setInput(""); setSuggestions([]);
  };
  return (
    <div style={{position:"relative"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",padding:"0.5rem",borderRadius:"0.5rem",border:"1.5px solid var(--border)",background:"var(--input-bg)",minHeight:"2.5rem"}}>
        {tags.map(t=>(
          <span key={t} style={{display:"flex",alignItems:"center",gap:"0.3rem",padding:"0.2rem 0.6rem",borderRadius:"999px",background:"var(--accent-bg)",border:"1px solid var(--accent-dim)",fontSize:"0.75rem",color:"var(--accent)",fontWeight:600}}>
            #{t}
            <button onClick={()=>onChange(tags.filter(x=>x!==t))} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",display:"flex",padding:0}}><X size={11}/></button>
          </span>
        ))}
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();input.trim()&&add(input.trim());}}}
          placeholder={tags.length===0?"Add tags (e.g. algebra, hard)...":""}
          style={{border:"none",background:"transparent",outline:"none",fontSize:"0.8rem",color:"var(--text)",minWidth:"120px",flex:1}}/>
      </div>
      {suggestions.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:20,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"0.5rem",boxShadow:"var(--shadow)",maxHeight:"160px",overflowY:"auto",marginTop:"0.25rem"}}>
          {suggestions.map((s:any)=>(
            <div key={s.id} onClick={()=>add(s.name)} style={{padding:"0.5rem 0.875rem",cursor:"pointer",fontSize:"0.8rem",color:"var(--text2)"}}
              onMouseEnter={e=>(e.currentTarget.style.background="var(--surface2)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              #{s.name} <span style={{color:"var(--text3)",fontSize:"0.7rem"}}>({s._count?.questions??0})</span>
            </div>
          ))}
        </div>
      )}
      <p style={{fontSize:"0.68rem",color:"var(--text3)",marginTop:"0.3rem"}}>Press Enter or comma to add.</p>
    </div>
  );
}

const inp: React.CSSProperties={width:"100%",height:"2.25rem",padding:"0 0.75rem",borderRadius:"0.5rem",border:"1.5px solid var(--border)",background:"var(--input-bg)",color:"var(--text)",fontSize:"0.82rem",outline:"none",boxSizing:"border-box"};
const sel: React.CSSProperties={...inp,appearance:"none" as any};
const lbl: React.CSSProperties={fontSize:"0.72rem",fontWeight:600,color:"var(--text2)",marginBottom:"0.25rem",display:"block"};

export default function AdminCreateQuestionPage() {
  const router    = useRouter();
  const {toast}   = useToast();
  const [questionText,setQuestionText] = useState("");
  const [questionImg, setQuestionImg]  = useState<File|null>(null);
  const [options,setOptions]           = useState([
    {text:"",img:null as File|null,isCorrect:false},
    {text:"",img:null as File|null,isCorrect:false},
    {text:"",img:null as File|null,isCorrect:false},
    {text:"",img:null as File|null,isCorrect:false},
  ]);
  const [subjectId,  setSubjectId]   = useState("");
  const [difficulty, setDifficulty]  = useState("medium");
  const [marks,      setMarks]       = useState("1");
  const [status,     setStatus]      = useState("published");
  const [explanation,setExplanation] = useState("");
  const [solutionImg,setSolutionImg] = useState<File|null>(null);
  const [tags,       setTags]        = useState<string[]>([]);
  const [isMulti,    setIsMulti]     = useState(false);

  const {data:subjects} = useQuery({
    queryKey:["subjects"],
    queryFn: async()=>{const r=await fetch("/api/subjects?scope=all");const d=await r.json();return Array.isArray(d)?d:[];},
  });

  const updateOpt=(i:number,field:string,val:any)=>setOptions(p=>p.map((o,idx)=>idx===i?{...o,[field]:val}:o));
  const toggleCorrect=(i:number)=>{
    if(!isMulti) setOptions(p=>p.map((o,idx)=>({...o,isCorrect:idx===i})));
    else         setOptions(p=>p.map((o,idx)=>idx===i?{...o,isCorrect:!o.isCorrect}:o));
  };

  const saveMutation = useMutation({
    mutationFn: async()=>{
      const fd=new FormData();
      fd.append("subjectId",subjectId);
      fd.append("question",questionText);
      fd.append("options",JSON.stringify(options.filter(o=>o.text||o.img).map(o=>({text:o.text,isCorrect:o.isCorrect}))));
      fd.append("tags",JSON.stringify(tags));
      fd.append("difficulty",difficulty);
      fd.append("marks",marks);
      fd.append("status",status);
      fd.append("explanation",explanation);
      fd.append("isMultipleAnswer",String(isMulti));
      if(questionImg)fd.append("questionImage",questionImg);
      options.forEach((o,i)=>{if(o.img)fd.append(`optionImage_${i}`,o.img);});
      if(solutionImg)fd.append("solutionImage",solutionImg);
      const r=await fetch("/api/questions",{method:"POST",body:fd});
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Failed");
      return d;
    },
    onSuccess:()=>{toast({title:"Question saved!"});router.push("/admin/questions");},
    onError:(e:any)=>toast({title:"Error",description:e.message,variant:"destructive"}),
  });

  const validOpts  = options.filter(o=>o.text.trim()||o.img);
  const hasCorrect = options.some(o=>o.isCorrect);
  const canSave    = subjectId&&questionText.trim()&&validOpts.length>=2&&hasCorrect;
  const diffColors: Record<string,string>={easy:"var(--green)",medium:"var(--amber)",hard:"var(--red)"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.875rem"}}>
          <Link href="/admin/questions"><button style={{background:"none",border:"none",cursor:"pointer",color:"var(--text2)",display:"flex",padding:"0.25rem"}}><ArrowLeft size={18}/></button></Link>
          <h1 style={{fontSize:"1.25rem",fontWeight:800,color:"var(--text)",margin:0}}>New Question</h1>
        </div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <select value={status} onChange={e=>setStatus(e.target.value)} style={{...sel,width:"130px"}}>
            <option value="draft">Save as Draft</option>
            <option value="published">Publish</option>
          </select>
          <button onClick={()=>saveMutation.mutate()} disabled={!canSave||saveMutation.isPending}
            style={{display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.55rem 1.25rem",borderRadius:"0.5rem",background:canSave?"var(--accent)":"var(--surface3)",border:"none",color:canSave?"#fff":"var(--text3)",fontWeight:700,fontSize:"0.85rem",cursor:canSave?"pointer":"not-allowed",opacity:saveMutation.isPending?0.7:1}}>
            {saveMutation.isPending?"Saving...":"Save Question"}
          </button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:"1.25rem",alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          {/* Question */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem"}}>
            <label style={lbl}>Question *</label>
            <textarea value={questionText} onChange={e=>setQuestionText(e.target.value)} rows={3} placeholder="Type question. Use $...$ for math."
              style={{...inp,height:"auto",padding:"0.6rem 0.75rem",resize:"vertical" as any}} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}/>
            {questionText&&(
              <div style={{marginTop:"0.5rem",padding:"0.5rem 0.75rem",background:"var(--surface2)",borderRadius:"0.375rem",fontSize:"0.85rem",color:"var(--text)"}}>
                <span style={{fontSize:"0.65rem",color:"var(--text3)",display:"block",marginBottom:"0.25rem"}}>Preview</span>
                <KaTeXPreview text={questionText}/>
              </div>
            )}
            <div style={{marginTop:"0.75rem"}}>
              <label style={{...lbl,cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem"}}><Image size={13} color="var(--text3)"/> Question image (optional)</label>
              <input type="file" accept="image/*" onChange={e=>setQuestionImg(e.target.files?.[0]??null)} style={{fontSize:"0.78rem",color:"var(--text2)",marginTop:"0.25rem"}}/>
            </div>
          </div>

          {/* Options */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.875rem"}}>
              <label style={{...lbl,marginBottom:0}}>Options *</label>
              <label style={{display:"flex",alignItems:"center",gap:"0.4rem",fontSize:"0.75rem",color:"var(--text2)",cursor:"pointer"}}>
                <input type="checkbox" checked={isMulti} onChange={e=>setIsMulti(e.target.checked)} style={{width:"14px",height:"14px",accentColor:"var(--accent)"}}/> Multiple correct
              </label>
            </div>
            {options.map((opt,i)=>(
              <div key={i} style={{marginBottom:"0.875rem",padding:"0.875rem",borderRadius:"0.5rem",border:`1.5px solid ${opt.isCorrect?"var(--green)":"var(--border)"}`,background:opt.isCorrect?"var(--green-bg)":"var(--surface2)"}}>
                <div style={{display:"flex",gap:"0.5rem",alignItems:"center",marginBottom:"0.5rem"}}>
                  <div style={{width:"1.5rem",height:"1.5rem",borderRadius:"50%",background:opt.isCorrect?"var(--green)":"var(--surface3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:800,color:opt.isCorrect?"#fff":"var(--text3)",flexShrink:0,border:`1.5px solid ${opt.isCorrect?"var(--green)":"var(--border)"}`}}>
                    {String.fromCharCode(65+i)}
                  </div>
                  <input value={opt.text} onChange={e=>updateOpt(i,"text",e.target.value)} placeholder={`Option ${String.fromCharCode(65+i)}`}
                    style={{...inp,flex:1}} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}/>
                  <button onClick={()=>toggleCorrect(i)}
                    style={{width:"2rem",height:"2rem",borderRadius:"50%",border:`1.5px solid ${opt.isCorrect?"var(--green)":"var(--border)"}`,background:opt.isCorrect?"var(--green)":"transparent",color:opt.isCorrect?"#fff":"var(--text3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Check size={13}/>
                  </button>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                  <Image size={12} color="var(--text3)"/>
                  <input type="file" accept="image/*" onChange={e=>updateOpt(i,"img",e.target.files?.[0]??null)} style={{fontSize:"0.72rem",color:"var(--text3)"}}/>
                  {opt.text&&<span style={{fontSize:"0.72rem",color:"var(--text3)",marginLeft:"auto"}}><KaTeXPreview text={opt.text}/></span>}
                </div>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem"}}>
            <label style={lbl}>Explanation (optional)</label>
            <textarea value={explanation} onChange={e=>setExplanation(e.target.value)} rows={2} placeholder="Explain the answer. Supports LaTeX."
              style={{...inp,height:"auto",padding:"0.6rem 0.75rem",resize:"vertical" as any}} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}/>
            <div style={{marginTop:"0.5rem"}}>
              <label style={{...lbl,cursor:"pointer",display:"flex",alignItems:"center",gap:"0.4rem"}}><Image size={13} color="var(--text3)"/> Solution image (optional)</label>
              <input type="file" accept="image/*" onChange={e=>setSolutionImg(e.target.files?.[0]??null)} style={{fontSize:"0.78rem",color:"var(--text2)",marginTop:"0.25rem"}}/>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:"1rem",position:"sticky",top:"1.5rem"}}>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem",display:"flex",flexDirection:"column",gap:"0.875rem"}}>
            <div style={{display:"flex",flexDirection:"column",gap:"0.25rem"}}>
              <label style={lbl}>Subject *</label>
              <select value={subjectId} onChange={e=>setSubjectId(e.target.value)} style={sel} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}>
                <option value="">Select subject</option>
                {(subjects??[]).map((s:any)=><option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.25rem"}}>
              <label style={lbl}>Difficulty</label>
              <div style={{display:"flex",gap:"0.4rem"}}>
                {["easy","medium","hard"].map(d=>(
                  <button key={d} onClick={()=>setDifficulty(d)}
                    style={{flex:1,padding:"0.4rem",borderRadius:"0.375rem",border:`1.5px solid ${difficulty===d?diffColors[d]:"var(--border)"}`,background:difficulty===d?`${diffColors[d]}22`:"transparent",color:difficulty===d?diffColors[d]:"var(--text3)",cursor:"pointer",fontSize:"0.72rem",fontWeight:difficulty===d?700:400,textTransform:"capitalize"}}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.25rem"}}>
              <label style={lbl}>Marks</label>
              <input type="number" min={1} value={marks} onChange={e=>setMarks(e.target.value)} style={inp} onFocus={e=>(e.target.style.borderColor="var(--accent)")} onBlur={e=>(e.target.style.borderColor="var(--border)")}/>
            </div>
          </div>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1.25rem"}}>
            <label style={{...lbl,marginBottom:"0.5rem",display:"flex",alignItems:"center",gap:"0.4rem"}}><Tag size={13} color="var(--accent)"/> Tags</label>
            <TagInput tags={tags} onChange={setTags}/>
          </div>
          <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"var(--radius)",padding:"1rem",fontSize:"0.75rem",color:"var(--text3)",display:"flex",flexDirection:"column",gap:"0.3rem"}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Valid options</span><span style={{color:validOpts.length>=2?"var(--green)":"var(--red)",fontWeight:700}}>{validOpts.length}/4</span></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Correct answer</span><span style={{color:hasCorrect?"var(--green)":"var(--red)",fontWeight:700}}>{hasCorrect?"✓ Set":"✗ Not set"}</span></div>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Tags</span><span style={{color:"var(--text2)"}}>{tags.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}