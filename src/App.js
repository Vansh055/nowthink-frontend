import Landing from "./pages/Landing";
import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:9090";
const getToken = () => localStorage.getItem("nowthink_token");
const saveToken = t => localStorage.setItem("nowthink_token", t);
const clearToken = () => localStorage.removeItem("nowthink_token");
const authFetch = (url, opts = {}) => fetch(url, {
  ...opts, headers: { ...opts.headers, Authorization: `Bearer ${getToken() || ""}` }
});

const greet = () => {
  const h = new Date().getHours();
  if (h < 5)  return ["It is very late.", "The mind is most honest when the world is asleep."];
  if (h < 12) return ["Good morning.", "What have you noticed since you woke up?"];
  if (h < 17) return ["Good afternoon.", "Something worth capturing before it fades?"];
  if (h < 21) return ["Good evening.", "What patterns showed up in today?"];
  return ["Late evening.", "What did today reveal that you almost missed?"];
};

const confColor = s => s >= 80 ? "#4a9e6a" : s >= 60 ? "#7a8a3a" : s >= 40 ? "#9a7a3a" : "#8a4a4a";
const confLabel = s => s >= 80 ? "High confidence" : s >= 60 ? "Moderate" : s >= 40 ? "Uncertain" : "Low confidence";
const themeHue = t => ({
  confidence:"#4a9e6a", focus:"#3a7a9e", relationships:"#9e3a7a",
  identity:"#6a3a9e", productivity:"#9e8a3a", fear:"#9e4a4a",
  growth:"#3a9e7a", purpose:"#5a3a9e"
})[t] || "#666";

const C = {
  bg:"#060606", surface:"#0a0a0a", surfaceHov:"#0e0e0e",
  border:"#141414", borderHov:"#242424", borderAccent:"#1a2e1a",
  text:"#e8e8e8", textMid:"#666", textDim:"#2e2e2e", textGhost:"#1a1a1a",
  accent:"#4a9e6a", accentDim:"#2a5c3a", accentGlow:"rgba(74,158,106,0.08)",
};

const Spinner = ({ size=18, color="#4a9e6a" }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" style={{ animation:"nt-spin 0.8s linear infinite", flexShrink:0 }}>
    <circle cx="9" cy="9" r="7" fill="none" stroke="#1a1a1a" strokeWidth="1.5"/>
    <path d="M9 2 A7 7 0 0 1 16 9" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SkeletonLine = ({ w="100%", h=14, mb=8 }) => (
  <div style={{ width:w, height:h, background:"#111", borderRadius:4, marginBottom:mb, animation:"nt-shimmer 1.5s ease-in-out infinite" }}/>
);

const SkeletonCard = () => (
  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 24px", marginBottom:8 }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
      <SkeletonLine w="80px" h={10}/>
      <SkeletonLine w="70px" h={20}/>
    </div>
    <SkeletonLine w="100%" h={14} mb={6}/>
    <SkeletonLine w="75%" h={14} mb={18}/>
    <SkeletonLine w="100%" h={4}/>
  </div>
);

const Badge = ({ status }) => {
  const cfg = {
    Supported:    { bg:"#0a1f0e", border:"#1a4a25", color:"#4a9e6a", dot:"#4a9e6a" },
    Investigating:{ bg:"#1a1a08", border:"#3a3a12", color:"#9e9e4a", dot:"#9e9e4a" },
    Refuted:      { bg:"#1f0a0a", border:"#4a1a1a", color:"#9e4a4a", dot:"#9e4a4a" },
    pending:      { bg:"#111",    border:"#1a1a1a", color:"#333",    dot:"#333"    },
    error:        { bg:"#111",    border:"#1a1a1a", color:"#333",    dot:"#333"    },
  };
  const s = cfg[status] || cfg.pending;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:s.bg, border:`1px solid ${s.border}`, color:s.color, padding:"3px 9px", borderRadius:4, fontSize:"0.58rem", letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot, flexShrink:0 }}/>
      {status}
    </span>
  );
};

const ConfBar = ({ score, height=4, showLabel=false }) => (
  <div>
    {showLabel && (
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:"0.6rem", letterSpacing:"0.16em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, color:"#2a2a2a" }}>Confidence</span>
        <span style={{ fontSize:"0.75rem", fontFamily:"system-ui", color:confColor(score), fontWeight:600 }}>{score}% · {confLabel(score)}</span>
      </div>
    )}
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ flex:1, height, background:"#0f0f0f", borderRadius:height, overflow:"hidden", position:"relative" }}>
        <div style={{ width:`${score}%`, height:"100%", background:`linear-gradient(90deg, ${confColor(score)}aa, ${confColor(score)})`, borderRadius:height, transition:"width 1.2s cubic-bezier(0.4,0,0.2,1)", boxShadow:`0 0 8px ${confColor(score)}44` }}/>
      </div>
      {!showLabel && <span style={{ fontSize:"0.72rem", fontFamily:"system-ui", color:confColor(score), minWidth:32, textAlign:"right", fontWeight:600 }}>{score}%</span>}
    </div>
  </div>
);

// ── LOGIN ──────────────────────────────────────────────────────────────────
/*function LoginScreen() {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
      <div style={{ maxWidth:"360px", width:"100%" }}>
        <p style={{ fontSize:"0.62rem", letterSpacing:"0.28em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:700, color:C.accentDim, marginBottom:24 }}>nowthink</p>
        <h1 style={{ fontSize:"clamp(2.2rem,5vw,2.9rem)", fontWeight:"normal", fontFamily:"'Georgia',serif", letterSpacing:"-0.03em", lineHeight:1.15, color:C.text, margin:"0 0 20px" }}>
          See the patterns<br/>you never knew<br/>were there.
        </h1>
        <p style={{ fontSize:"0.8rem", fontFamily:"system-ui", color:"#282828", lineHeight:1.9, margin:"0 0 44px" }}>
          An AI that investigates you.<br/>Not a journal. Not a chatbot.<br/>A case built from your own words.
        </p>
        <a href={`${API}/oauth2/authorization/google`}
          style={{ display:"inline-flex", alignItems:"center", gap:10, background:"#f4f4f4", color:"#111", padding:"12px 20px", borderRadius:7, fontSize:"0.84rem", textDecoration:"none", fontFamily:"system-ui", fontWeight:500, letterSpacing:"-0.01em", transition:"all 0.18s", whiteSpace:"nowrap" }}
          onMouseEnter={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#f4f4f4"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
          <svg width="16" height="16" viewBox="0 0 18 18" style={{ flexShrink:0 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </a>
        <p style={{ fontSize:"0.68rem", fontFamily:"system-ui", color:"#181818", marginTop:18 }}>Your observations are private. Always.</p>
      </div>
    </div>
  );
}*/

// ── CASE CARD ──────────────────────────────────────────────────────────────
function CaseCard({ d, onClick, index=0 , isMobile }) {
  const [hov, setHov] = useState(false);
  return (
    <article onClick={() => onClick(d)}
      onMouseEnter={() => {
  if (!isMobile) setHov(true);
}}

onMouseLeave={() => {
  if (!isMobile) setHov(false);
}}

onMouseDown={(e) => {
  e.currentTarget.style.transform = "scale(.985)";
}}

onMouseUp={(e) => {
  if (!isMobile && hov) {
    e.currentTarget.style.transform = "translateY(-2px)";
  } else {
    e.currentTarget.style.transform = "translateY(0)";
  }
}}
      style={{
        background: hov ? C.surfaceHov : C.surface,
        border: `1px solid ${hov ? C.borderHov : C.border}`,
        borderRadius:10,
        padding:"20px 24px",
        marginBottom:8,
        cursor:"pointer",
        transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)",
        transform: hov && !isMobile
  ? "translateY(-2px)"
  : "translateY(0)",
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${C.borderHov}, inset 0 1px 0 rgba(255,255,255,0.03)` : "none",
        animation:`nt-up 0.3s ease ${index*0.05}s both`,
        position:"relative",
        overflow:"hidden",
      }}>
      {hov && <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at top left, ${C.accentGlow}, transparent 70%)`, pointerEvents:"none" }}/>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, gap:16, position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:"0.56rem", letterSpacing:"0.18em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, color:"#1e2e1e" }}>Case #{d.id}</span>
          {d.discoveryType && d.discoveryType !== "none" &&
            <span style={{ fontSize:"0.54rem", letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"system-ui", color:"#1a1a1a" }}>{d.discoveryType}</span>}
        </div>
        <Badge status={d.status}/>
      </div>
      <p style={{ fontSize:"0.9rem", fontFamily:"'Georgia',serif", lineHeight:1.7, color:"#b0b0b0", marginBottom:16, position:"relative" }}>{d.claim}</p>
      <ConfBar score={d.confidenceScore}/>
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
        <span style={{ fontSize:"0.68rem", fontFamily:"system-ui", color: hov ? C.accent : "#252525", transition:"color 0.2s", letterSpacing:"-0.01em" }}>
          {hov ? "Open file →" : "Click to open"}
        </span>
      </div>
    </article>
  );
}

// ── CASE MODAL ─────────────────────────────────────────────────────────────
function CaseModal({ d, onClose }) {
  const isMobile = window.innerWidth <= 768;
  const [tab, setTab] = useState("report");

  useEffect(() => {
    setTab("report");
    const h = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [d, onClose]);

  if (!d) return null;

  const tabs = [
    { key:"report",   label:"Report" },
    { key:"evidence", label:"Evidence" },
  ];

  return (
    <div onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:"24px", backdropFilter:"blur(16px)", animation:"nt-fade 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()}
        style={{
  background:"#0a0a0a",
  border:"1px solid #1e1e1e",
  borderRadius:isMobile ? 18 : 12,
  width:isMobile ? "100%" : "100%",
  maxWidth:isMobile ? "95vw" : 620,
  maxHeight:isMobile ? "92vh" : "90vh",
  overflowY:"auto",
  animation:"nt-modal 0.25s cubic-bezier(0.34,1.56,0.64,1)",
  boxShadow:"0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)"
}}>

        {/* File header */}
        <div style={{ padding:isMobile ? "18px" : "20px 28px 0", borderBottom:"1px solid #0f0f0f" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <p style={{ fontSize:"0.56rem", letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, color:"#1e2e1e", marginBottom:8 }}>
                Nowthink · Investigation File · Case #{d.id}
              </p>
              <Badge status={d.status}/>
            </div>
            <button onClick={onClose}
              style={{ fontSize:"0.56rem", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, background:"#111", border:"1px solid #1a1a1a", color:"#2e2e2e", padding:isMobile ? "10px 14px" : "5px 10px", borderRadius:4, cursor:"pointer", transition:"color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color="#666"}
              onMouseLeave={e => e.currentTarget.style.color="#2e2e2e"}>
              {isMobile ? "✕" : "Close"}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:0 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ background:"none", border:"none", padding:isMobile ? "14px 18px" : "10px 16px", fontSize:isMobile ? "0.95rem" : "0.78rem", fontFamily:"system-ui", color: tab===t.key ? C.text : "#333", borderBottom:`2px solid ${tab===t.key ? C.accent : "transparent"}`, cursor:"pointer", transition:"all 0.15s", letterSpacing:"-0.01em", position:"relative", top:1 }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Report tab */}
        {tab === "report" && (
          <div style={{ padding:isMobile ? "20px" : "28px 28px 24px", animation:"nt-up 0.2s ease" }}>
            {/* Hypothesis */}
            <div style={{ marginBottom:28 }}>
              <p style={{ fontSize:"0.56rem", letterSpacing:"0.16em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, color:"#252525", marginBottom:12 }}>Hypothesis</p>
              <p style={{ fontSize:isMobile ? "1.55rem" : "1.05rem", fontFamily:"'Georgia',serif", lineHeight:1.8, color:"#e0e0e0", fontStyle:"italic" }}>{d.claim}</p>
            </div>

            <div style={{ height:1, background:"#0f0f0f", margin:"0 0 28px" }}/>

            {/* Confidence */}
            <div style={{ marginBottom:28 }}>
              <ConfBar score={d.confidenceScore} height={6} showLabel/>
              <p style={{ fontSize:"0.72rem", fontFamily:"system-ui", color:"#222", marginTop:10, lineHeight:1.7 }}>
                Based on the volume and consistency of supporting observations versus contradicting ones.
              </p>
            </div>

            <div style={{ height:1, background:"#0f0f0f", margin:"0 0 28px" }}/>

            {/* Meta */}
            <div style={{ display:"grid", gridTemplateColumns:isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
              <div style={{ background:"#080808", border:"1px solid #111", borderRadius:6, padding:"14px 16px" }}>
                <p style={{ fontSize:"0.56rem", letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, color:"#222", marginBottom:6 }}>Discovery type</p>
                <p style={{ fontSize:"0.82rem", fontFamily:"system-ui", color:"#444" }}>{d.discoveryType || "Pattern"}</p>
              </div>
              <div style={{ background:"#080808", border:"1px solid #111", borderRadius:6, padding:"14px 16px" }}>
                <p style={{ fontSize:"0.56rem", letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, color:"#222", marginBottom:6 }}>Status</p>
                <p style={{ fontSize:"0.82rem", fontFamily:"system-ui", color: d.status==="Supported" ? C.accent : d.status==="Investigating" ? "#9e9e4a" : "#9e4a4a" }}>{d.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Evidence tab */}
        {tab === "evidence" && (
          <div style={{ padding:"28px 28px 24px", animation:"nt-up 0.2s ease" }}>
            {d.evidenceFor && (
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:"0.56rem", letterSpacing:"0.16em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, color:C.accentDim, marginBottom:12 }}>Supporting evidence</p>
                <div style={{ background:"#091209", border:"1px solid #0e1c0e", borderRadius:8, padding:"18px 20px", position:"relative" }}>
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:C.accent, borderRadius:"8px 0 0 8px", opacity:0.6 }}/>
                  <p style={{ fontSize:"0.875rem", fontFamily:"'Georgia',serif", lineHeight:1.75, color:"#6a9a6a", margin:0, fontStyle:"italic" }}>{d.evidenceFor}</p>
                </div>
              </div>
            )}
            {d.evidenceAgainst && (
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:"0.56rem", letterSpacing:"0.16em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, color:"#5c2525", marginBottom:12 }}>Contradicting evidence</p>
                <div style={{ background:"#120909", border:"1px solid #1c0e0e", borderRadius:8, padding:"18px 20px", position:"relative" }}>
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:"#9e4a4a", borderRadius:"8px 0 0 8px", opacity:0.6 }}/>
                  <p style={{ fontSize:"0.875rem", fontFamily:"'Georgia',serif", lineHeight:1.75, color:"#9a6a6a", margin:0, fontStyle:"italic" }}>{d.evidenceAgainst}</p>
                </div>
              </div>
            )}
            {!d.evidenceFor && !d.evidenceAgainst && (
              <p style={{ fontSize:"0.875rem", fontFamily:"'Georgia',serif", color:"#2a2a2a", fontStyle:"italic" }}>No evidence recorded for this case.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── EVOLUTION VIEW ─────────────────────────────────────────────────────────
function EvolutionView({ evolutions }) {
  const themes = [...new Set(evolutions.map(e => e.theme))];
  if (!evolutions.length) return (
    <div style={{ padding:"60px 0", textAlign:"center" }}>
      <div style={{ width:48, height:48, borderRadius:"50%", border:"1px solid #1a1a1a", margin:"0 auto 20px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:"1.2rem", opacity:0.3 }}>◎</span>
      </div>
      <p style={{ fontSize:"0.9rem", fontFamily:"'Georgia',serif", color:"#2a2a2a", fontStyle:"italic", marginBottom:8 }}>No beliefs tracked yet.</p>
      <p style={{ fontSize:"0.75rem", fontFamily:"system-ui", color:"#1e1e1e" }}>File observations to begin tracking how your thinking evolves.</p>
    </div>
  );
  return (
    <div>
      {themes.map((theme, ti) => {
        const color = themeHue(theme);
        const entries = evolutions.filter(e => e.theme === theme).sort((a,b) => new Date(a.recordedAt)-new Date(b.recordedAt));
        return (
          <section key={theme} style={{ marginBottom:48, animation:`nt-up 0.3s ease ${ti*0.08}s both` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <span style={{ fontSize:"0.56rem", letterSpacing:"0.16em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:700, background:color+"16", border:`1px solid ${color}2a`, color, padding:"4px 12px", borderRadius:4 }}>{theme}</span>
              <span style={{ fontSize:"0.72rem", fontFamily:"system-ui", color:"#222" }}>{entries.length} belief{entries.length!==1?"s":""}</span>
            </div>
            <div style={{ paddingLeft:4 }}>
              {entries.map((entry, i) => (
                <div key={entry.id} style={{ display:"flex", gap:20, marginBottom:i < entries.length-1 ? 0 : 0 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:12, flexShrink:0, paddingTop:4 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:color, flexShrink:0, boxShadow:`0 0 8px ${color}66` }}/>
                    {i < entries.length-1 && (
                      <div style={{ width:1, flexGrow:1, background:`linear-gradient(${color}40, ${color}10)`, minHeight:32, marginTop:4 }}/>
                    )}
                  </div>
                  <div style={{ flex:1, paddingBottom: i < entries.length-1 ? 28 : 0 }}>
                    <p style={{ fontSize:"0.9rem", fontFamily:"'Georgia',serif", lineHeight:1.65, color:"#b0b0b0", fontStyle:"italic", margin:"0 0 5px" }}>{entry.belief}</p>
                    <p style={{ fontSize:"0.7rem", fontFamily:"system-ui", color:"#282828", margin:"0 0 7px" }}>
                      {new Date(entry.recordedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                    </p>
                    <p style={{ fontSize:"0.72rem", fontFamily:"system-ui", color:"#222", fontStyle:"italic", lineHeight:1.6, margin:0 }}>
                      "{entry.sourceObservation?.slice(0,90)}{entry.sourceObservation?.length>90?"...":""}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── EMPTY STATE ────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, sub }) => (
  <div style={{ padding:"60px 0", textAlign:"center", animation:"nt-up 0.4s ease" }}>
    <div style={{ width:52, height:52, borderRadius:"50%", border:"1px solid #161616", background:"#0a0a0a", margin:"0 auto 20px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem" }}>{icon}</div>
    <p style={{ fontSize:"0.9rem", fontFamily:"'Georgia',serif", color:"#2a2a2a", fontStyle:"italic", marginBottom:8 }}>{title}</p>
    <p style={{ fontSize:"0.75rem", fontFamily:"system-ui", color:"#1c1c1c", lineHeight:1.7 }}>{sub}</p>
  </div>
);

const MOBILE_BREAKPOINT = 768;




// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [user,         setUser]         = useState(null);
  const [authChecked,  setAuthChecked]  = useState(false);
  const [view,         setView]         = useState("discovery");
  const [observations, setObservations] = useState([]);
  const [discoveries,  setDiscoveries]  = useState([]);
  const [evolutions,   setEvolutions]   = useState([]);
  const [obsText,      setObsText]      = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [lastResult,   setLastResult]   = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [totalObs,     setTotalObs]     = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [expandedObs,  setExpandedObs]  = useState(null);
  const textareaRef = useRef(null);

  const [isMobile, setIsMobile] = useState(
  () => window.innerWidth <= MOBILE_BREAKPOINT
);

const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

const loadingMessages = [
  "Opening investigation file...",
  "Reviewing observation archive...",
  "Connecting recurring patterns...",
  "Cross-examining supporting evidence...",
  "Preparing investigation report...",
];

const [loadingStep, setLoadingStep] = useState(0);

useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    setIsMobile(mobile);

    if (!mobile) {
      setMobileMenuOpen(false);
    }
  };

  handleResize(); // Run once on mount

  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) { saveToken(token); window.history.replaceState({}, "", "/"); }
    if (!getToken()) { setAuthChecked(true); return; }
    authFetch(`${API}/api/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [obs, disc, evo] = await Promise.all([
        authFetch(`${API}/api/observe`).then(r => r.json()),
        authFetch(`${API}/api/discoveries`).then(r => r.json()),
        authFetch(`${API}/api/evolution`).then(r => r.json()),
      ]);
      setObservations(Array.isArray(obs)  ? obs  : []);
      setTotalObs(Array.isArray(obs) ? obs.length : 0);
      setDiscoveries(Array.isArray(disc) ? disc : []);
      setEvolutions(Array.isArray(evo)  ? evo  : []);
    } catch { setError("Could not reach the server."); }
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleObserve = async () => {
    if (!obsText.trim() || submitting) return;
    setSubmitting(true); setError(null); setLastResult(null);
    try {
      const res = await authFetch(`${API}/api/observe`, {
        method:"POST", headers:{ "Content-Type":"text/plain" }, body:obsText,
      });
      if (res.ok) {
        const data = await res.json();
        setLastResult(data); setTotalObs(data.totalObservations); setObsText("");
        setTimeout(loadData, 2000);
      } else { setError("Failed to file observation."); }
    } catch { setError("Connection error."); }
    setSubmitting(false);
  };

  const handleGenerate = async () => {
  if (generating) return;

  setGenerating(true);
  setError(null);
  setLoadingStep(0);

  const interval = setInterval(() => {
    setLoadingStep((prev) => {
      if (prev < loadingMessages.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, 800);

  try {
    const res = await authFetch(
      `${API}/api/discoveries/generate`,
      {
        method: "POST",
      }
    );

    if (!res.ok) {
      throw new Error("Investigation failed");
    }

    const data = await res.json();

    setDiscoveries((prev) => [
      data,
      ...prev.filter((d) => d.id !== data.id),
    ]);

    setSelectedCase(data);
  } catch (err) {
    console.error(err);
    setError("Investigation failed.");
  } finally {
    clearInterval(interval);
    setGenerating(false);
  }
};

  const handleLogout = () => {
    clearToken();
    setUser(null); setObservations([]); setDiscoveries([]); setEvolutions([]);
  };

  if (!authChecked) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Spinner size={22}/>
    </div>
  );
  if (!user) return <Landing />;

  const [greetWord, greetSub] = greet();
  const hasText = obsText.trim().length > 0;

  const navItems = [
    { key:"discovery", label:"Discoveries", count:discoveries.length },
    { key:"observe",   label:"Observe" },
    { key:"evidence",  label:"Evidence",  count:totalObs },
    { key:"evolution", label:"Evolution", count:evolutions.length },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Georgia',serif" }}>
      <style>{`
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes nt-spin    { to { transform:rotate(360deg); } }
        @keyframes nt-up      { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes nt-fade    { from { opacity:0; } to { opacity:1; } }
        @keyframes nt-modal   { from { opacity:0; transform:scale(0.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes nt-shimmer { 0%,100% { opacity:0.4; } 50% { opacity:0.7; } }
        ::-webkit-scrollbar       { width:3px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:#1a1a1a; border-radius:2px; }
        textarea         { caret-color:${C.accent}; }
        textarea:focus   { outline:none !important; border-color:#1e3e1e !important; box-shadow: 0 0 0 3px rgba(74,158,106,0.06) !important; }
        button:focus     { outline:none; }
      `}</style>

      {/* NAV */}
      <header
  style={{
    position: "sticky",
    top: 0,
    zIndex: 100,
    overflow: "visible",
    background: "rgba(6,6,6,0.97)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid #0e0e0e",
  }}
>
  <div
    style={{
      maxWidth: 980,
      margin: "0 auto",
      padding: isMobile ? "0 18px" : "0 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 56,
    }}
  >
    {/* Logo */}
    <span
      style={{
        fontSize: "0.62rem",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        fontFamily: "system-ui",
        fontWeight: 700,
        color: C.accent,
      }}
    >
      nowthink
    </span>

    {/* Desktop Navigation */}
    {!isMobile && (
      <>
        <nav style={{ display: "flex", flex: 1, marginLeft: 30 }}>
          {navItems.map((item) => {
            const active = view === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0 13px",
                  height: 56,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  color: active ? C.text : "#2e2e2e",
                  fontSize: "0.76rem",
                  fontFamily: "system-ui",
                  borderBottom: `2px solid ${
                    active ? C.accent : "transparent"
                  }`,
                  cursor: "pointer",
                }}
              >
                {item.label}

                {item.count > 0 && (
                  <span
                    style={{
                      fontSize: "0.54rem",
                      background: active ? "#0e200e" : "#0e0e0e",
                      color: active ? C.accent : "#2a2a2a",
                      padding: "2px 6px",
                      borderRadius: 3,
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {user?.picture ? (
            <img
              src={user.picture}
              alt=""
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
              }}
            />
          ) : (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: C.accentDim,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.accent,
              }}
            >
              {user?.name?.[0]}
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "#444",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </>
    )}

    {/* Mobile Navigation */}
{isMobile && (
  <>
    <button
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      style={{
        background: "none",
        border: "none",
        color: "#ddd",
        fontSize: "1.6rem",
        cursor: "pointer",
        padding: 4,
        transition: "transform .25s ease",
      }}
    >
      {mobileMenuOpen ? "✕" : "☰"}
    </button>

    <div
  style={{
    position: "fixed",
    top: 56,
    left: 0,
    width: "100%",
    background: "#080808",
    borderBottom: "1px solid #151515",
    overflow: "hidden",
    maxHeight: mobileMenuOpen ? 400 : 0,
    opacity: mobileMenuOpen ? 1 : 0,
    transition: "all .28s ease",
    zIndex: 999,
  }}
>
      {navItems.map((item) => {
        const active = view === item.key;

        return (
          <button
            key={item.key}
            onClick={() => {
              setView(item.key);
              setMobileMenuOpen(false);
            }}
            style={{
              width: "100%",
              height: 58,
              padding: "0 22px",
              border: "none",
              background: "transparent",
              borderBottom: "1px solid #111",
              color: active ? C.accent : "#d8d8d8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "'Georgia', serif",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            <span>{item.label}</span>

            {item.count > 0 && (
              <span
                style={{
                  fontSize: ".72rem",
                  color: C.accent,
                  opacity: .8,
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}

      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          height: 58,
          border: "none",
          background: "transparent",
          color: "#dd6666",
          textAlign: "left",
          padding: "0 22px",
          cursor: "pointer",
          fontFamily: "'Georgia', serif",
          fontSize: "1rem",
        }}
      >
        Sign out
      </button>
    </div>
  </>
)}
 </div>
</header>

      {/* MAIN */}
      <main style={{ maxWidth:980, margin:"0 auto", padding:"40px 32px 80px" }}>

        {error && (
          <div style={{ background:"#140808", border:"1px solid #2a1010", borderRadius:6, padding:"11px 16px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", animation:"nt-up 0.2s ease" }}>
            <span style={{ fontSize:"0.78rem", fontFamily:"system-ui", color:"#9e4a4a" }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background:"none", border:"none", color:"#3a3a3a", fontSize:"1.1rem", padding:"0 0 0 16px", cursor:"pointer" }}>×</button>
          </div>
        )}

        {/* ── DISCOVERIES ── */}
        {view === "discovery" && (
          <div style={{ animation:"nt-up 0.3s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <div>
                <h1 style={{ fontSize:"clamp(1.6rem,3vw,2rem)", fontWeight:"normal", fontFamily:"'Georgia',serif", letterSpacing:"-0.025em", color:C.text, marginBottom:6 }}>Discoveries</h1>
                <p style={{ fontSize:"0.75rem", fontFamily:"system-ui", color:C.textDim }}>Evidence-based patterns found in your observations</p>
              </div>
              {discoveries.length > 0 && (
                <span style={{ fontSize:"0.64rem", fontFamily:"system-ui", color:"#1e2e1e", letterSpacing:"0.1em", textTransform:"uppercase" }}>{discoveries.length} case{discoveries.length!==1?"s":""} opened</span>
              )}
            </div>

            {/* Investigation panel */}
<div
  style={{
    background: "#0a130a",
    border: "1px solid #111e11",
    borderRadius: 12,
    padding: isMobile ? "20px" : "20px 24px",
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
    minHeight: generating ? 190 : "auto",
    transition: "all .35s ease",
  }}
>
  <div
    style={{
      position: "absolute",
      top: 0,
      right: 0,
      width: 220,
      height: 220,
      background: `radial-gradient(circle at top right, ${C.accentGlow}, transparent 70%)`,
      pointerEvents: "none",
    }}
  />

  <div style={{ position: "relative" }}>
    {!generating ? (
      <>
        <p
          style={{
            fontSize: "0.56rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontFamily: "system-ui",
            fontWeight: 600,
            color: totalObs >= 3 ? C.accentDim : "#1e2e1e",
            marginBottom: 8,
          }}
        >
          {totalObs < 3
            ? `${3 - totalObs} more observation${3 - totalObs !== 1 ? "s" : ""} needed`
            : "✓ Ready to investigate"}
        </p>

        <p
          style={{
            fontSize: "0.85rem",
            fontFamily: "'Georgia', serif",
            color: "#2e2e2e",
            lineHeight: 1.7,
            marginBottom: totalObs >= 3 ? 18 : 0,
          }}
        >
          {totalObs < 3
            ? "The system requires at least 3 observations before it can open a case."
            : "Enough evidence has been gathered. Ask the system what it found."}
        </p>

        {totalObs >= 3 && (
          <button
            onClick={handleGenerate}
            style={{
              background: "#0f2a0f",
              border: "1px solid #1e4a1e",
              color: C.accent,
              padding: isMobile ? "14px 18px" : "9px 18px",
              width: isMobile ? "100%" : "auto",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontFamily: "system-ui",
              cursor: "pointer",
              transition: ".2s",
            }}
          >
            → Open Investigation
          </button>
        )}
      </>
    ) : (
  <div
    style={{
      animation: "nt-fade .35s ease",
      minHeight: 240,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}
  >
    <p
      style={{
        fontSize: "0.56rem",
        letterSpacing: ".22em",
        textTransform: "uppercase",
        fontFamily: "system-ui",
        fontWeight: 700,
        color: C.accent,
        marginBottom: 26,
      }}
    >
      OPENING CASE FILE
    </p>

    {loadingMessages.map((step, i) => {
      const completed = i < loadingStep;
      const active = i === loadingStep;

      return (
        <div
          key={step}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
            transition: "all .3s ease",
          }}
        >
          <div
            style={{
              width: 22,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {completed ? (
              <span
                style={{
                  color: C.accent,
                  fontSize: "1rem",
                }}
              >
                ✓
              </span>
            ) : active ? (
              <Spinner size={14} />
            ) : (
              <span
                style={{
                  color: "#333",
                }}
              >
                ○
              </span>
            )}
          </div>

          <span
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: active ? "1rem" : ".94rem",
              color: completed
                ? C.accent
                : active
                ? C.text
                : "#444",
              transition: ".25s",
            }}
          >
            {step}
          </span>
        </div>
      );
    })}

    <div
      style={{
        marginTop: 22,
        paddingTop: 18,
        borderTop: "1px solid #141414",
      }}
    >
      <p
        style={{
          fontSize: ".68rem",
          color: "#555",
          fontFamily: "system-ui",
          marginBottom: 6,
        }}
      >
        Evidence Under Review
      </p>

      <p
        style={{
          fontSize: ".95rem",
          color: C.text,
          fontFamily: "'Georgia', serif",
        }}
      >
        {totalObs} observations available
      </p>
    </div>
  </div>
)}
  </div>
</div>

            {loading && !discoveries.length
              ? <>{[0,1,2].map(i => <SkeletonCard key={i}/>)}</>
              : !discoveries.length
                ? <EmptyState icon="◎" title="No cases opened yet." sub={`File ${Math.max(0,3-totalObs)} more observation${Math.max(0,3-totalObs)!==1?"s":""} and open your first investigation.`}/>
                : discoveries.map((d,i) => <CaseCard key={d.id} d={d} onClick={setSelectedCase} index={i}/>)
            }
          </div>
        )}

        {/* ── OBSERVE ── */}
{view === "observe" && (
  <div
    style={{
      animation: "nt-up 0.3s ease",
      maxWidth: 620,
      padding: isMobile ? "0 4px" : 0,
    }}
  >
    <div style={{ marginBottom: isMobile ? 26 : 32 }}>
      <h1
        style={{
          fontSize: isMobile ? "2.6rem" : "clamp(1.6rem,3vw,2rem)",
          lineHeight: 1.05,
          fontWeight: "normal",
          fontFamily: "'Georgia',serif",
          letterSpacing: "-0.025em",
          color: C.text,
          marginBottom: 8,
        }}
      >
        {greetWord}
      </h1>

      <p
        style={{
          fontSize: isMobile ? ".9rem" : "0.75rem",
          lineHeight: 1.7,
          fontFamily: "system-ui",
          color: C.textDim,
          maxWidth: 520,
        }}
      >
        {greetSub}
      </p>
    </div>

    <p
      style={{
        fontSize: isMobile ? ".92rem" : "0.78rem",
        fontFamily: "system-ui",
        color: "#252525",
        fontStyle: "italic",
        marginBottom: 22,
        lineHeight: 1.8,
      }}
    >
      Not "how was your day." What did you actually notice? Something
      recurring, surprising, or that you have been quietly avoiding.
    </p>

    <textarea
      ref={textareaRef}
      value={obsText}
      onChange={(e) => setObsText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleObserve();
        }
      }}
      placeholder="Write freely. The system will extract what matters."
      style={{
        width: "100%",
        minHeight: isMobile ? 180 : 150,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        color: C.text,
        padding: isMobile ? "20px" : "16px 18px",
        fontSize: isMobile ? "1.05rem" : "0.9rem",
        resize: "vertical",
        fontFamily: "'Georgia',serif",
        lineHeight: 1.8,
        transition: "border-color .2s, box-shadow .2s",
        display: "block",
      }}
    />

    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between",
        gap: isMobile ? 18 : 10,
        marginTop: 16,
      }}
    >
      {!isMobile && (
        <span
          style={{
            fontSize: "0.67rem",
            fontFamily: "system-ui",
            color: "#1c1c1c",
          }}
        >
          Enter to file · Shift+Enter for new line
        </span>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: 10,
          width: isMobile ? "100%" : "auto",
        }}
      >
        {hasText && (
          <span
            style={{
              fontSize: ".7rem",
              fontFamily: "system-ui",
              color: "#333",
              textAlign: isMobile ? "right" : "left",
            }}
          >
            {obsText.length} characters
          </span>
        )}

        <button
          onClick={handleObserve}
          disabled={submitting || !hasText}
          style={{
            width: isMobile ? "100%" : "auto",
            height: isMobile ? 54 : "auto",
            background: !hasText
              ? "transparent"
              : submitting
              ? "transparent"
              : "#0f2a0f",
            border: `1px solid ${
              !hasText
                ? "#0e0e0e"
                : submitting
                ? "#1a2a1a"
                : "#1e4a1e"
            }`,
            color: !hasText
              ? "#1a1a1a"
              : submitting
              ? C.accentDim
              : C.accent,
            padding: isMobile ? "0 20px" : "9px 16px",
            borderRadius: 8,
            fontSize: isMobile ? ".95rem" : "0.76rem",
            fontFamily: "system-ui",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            transition: "all .2s",
            cursor:
              submitting || !hasText ? "default" : "pointer",
          }}
        >
          {submitting ? (
            <>
              <Spinner size={12} />
              Filing...
            </>
          ) : (
            "→ File observation"
          )}
        </button>
      </div>
    </div>

    {lastResult && (
      <div
        style={{
          marginTop: 28,
          background: "#091209",
          border: "1px solid #0d1c0d",
          borderRadius: 10,
          padding: "18px 22px",
          animation: "nt-up .3s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 2,
            background: C.accent,
          }}
        />

        <p
          style={{
            fontSize: ".58rem",
            letterSpacing: ".16em",
            textTransform: "uppercase",
            fontFamily: "system-ui",
            fontWeight: 600,
            color: C.accentDim,
            marginBottom: 10,
          }}
        >
          Observation filed
        </p>

        <p
          style={{
            fontSize: ".92rem",
            fontFamily: "'Georgia', serif",
            color: "#7aba7a",
            fontStyle: "italic",
            marginBottom: 12,
          }}
        >
          {lastResult.theme}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {[
            `Energy ${lastResult.energyScore}/10`,
            `${lastResult.totalObservations} total`,
            lastResult.readyForDiscovery
              ? "✓ Ready for investigation"
              : null,
          ]
            .filter(Boolean)
            .map((item, i) => (
              <span
                key={i}
                style={{
                  fontSize: ".7rem",
                  fontFamily: "system-ui",
                  color: item.startsWith("✓")
                    ? C.accent
                    : "#2a4a2a",
                }}
              >
                {item}
              </span>
            ))}
        </div>
      </div>
    )}
  </div>
)}

        {/* ── EVIDENCE ── */}
        {view === "evidence" && (
          <div style={{ animation:"nt-up 0.3s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <div>
                <h1 style={{ fontSize:"clamp(1.6rem,3vw,2rem)", fontWeight:"normal", fontFamily:"'Georgia',serif", letterSpacing:"-0.025em", color:C.text, marginBottom:6 }}>Evidence</h1>
                <p style={{ fontSize:"0.75rem", fontFamily:"system-ui", color:C.textDim }}>{totalObs} observation{totalObs!==1?"s":""} on record</p>
              </div>
            </div>

            {loading && !observations.length
              ? <>{[0,1,2].map(i => <SkeletonCard key={i}/>)}</>
              : !observations.length
                ? <EmptyState icon="○" title="No observations yet." sub="Go to Observe and file your first one."/>
                : observations.map((obs, i) => {
                  const expanded = expandedObs === obs.id;
                  return (
                    <article key={obs.id}
                      onClick={() => setExpandedObs(expanded ? null : obs.id)}
                      style={{ background:C.surface, border:`1px solid ${expanded ? C.borderAccent : C.border}`, borderRadius:9, padding:"16px 20px", marginBottom:7, transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)", cursor:"pointer", animation:`nt-up 0.25s ease ${i*0.04}s both`, position:"relative", overflow:"hidden" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=expanded?C.borderAccent:C.borderHov; e.currentTarget.style.transform="translateY(-1px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=expanded?C.borderAccent:C.border; e.currentTarget.style.transform="none"; }}>
                      {expanded && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:C.accent, opacity:0.5 }}/>}
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
                        <span style={{ fontSize:"0.54rem", letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:"system-ui", fontWeight:600, color:"#1a2a1a" }}>Obs #{obs.id}</span>
                        {obs.extractedTheme && obs.extractedTheme !== "Unnamed observation" && (
                          <span style={{ fontSize:"0.7rem", fontFamily:"system-ui", color:"#3a5a3a", fontStyle:"italic" }}>{obs.extractedTheme}</span>
                        )}
                        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:3 }}>
                          {Array.from({ length:10 }).map((_,j) => (
                            <div key={j} style={{ width:3, height:j < obs.energyScore ? 14 : 8, borderRadius:1.5, background:j < obs.energyScore ? confColor(obs.energyScore*10) : "#141414", transition:"height 0.2s ease" }}/>
                          ))}
                          <span style={{ fontSize:"0.66rem", fontFamily:"system-ui", color:"#252525", marginLeft:8 }}>{obs.energyScore}/10</span>
                        </div>
                      </div>
                      <p style={{ fontSize:"0.875rem", fontFamily:"'Georgia',serif", color:"#686868", lineHeight:1.65, marginBottom:expanded?10:0 }}>
                        {expanded ? obs.rawText : obs.rawText.slice(0,120) + (obs.rawText.length > 120 ? "..." : "")}
                      </p>
                      {expanded && (
                        <p style={{ fontSize:"0.66rem", fontFamily:"system-ui", color:"#222", marginTop:8, animation:"nt-up 0.2s ease" }}>
                          {new Date(obs.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                        </p>
                      )}
                    </article>
                  );
                })
            }
          </div>
        )}

        {/* ── EVOLUTION ── */}
        {view === "evolution" && (
          <div style={{ animation:"nt-up 0.3s ease" }}>
            <div style={{ marginBottom:28 }}>
              <h1 style={{ fontSize:"clamp(1.6rem,3vw,2rem)", fontWeight:"normal", fontFamily:"'Georgia',serif", letterSpacing:"-0.025em", color:C.text, marginBottom:6 }}>Thought Evolution</h1>
              <p style={{ fontSize:"0.75rem", fontFamily:"system-ui", color:C.textDim }}>How your beliefs shift over time</p>
            </div>
            {loading && !evolutions.length
              ? <>{[0,1].map(i => <SkeletonCard key={i}/>)}</>
              : <EvolutionView evolutions={evolutions}/>
            }
          </div>
        )}

      </main>

      <CaseModal d={selectedCase} onClose={() => setSelectedCase(null)}/>
    </div>
  );
}