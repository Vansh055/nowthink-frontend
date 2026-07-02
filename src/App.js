import { useState, useEffect, useRef } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:9090";

const getToken = () => localStorage.getItem("nowthink_token");
const saveToken = t => localStorage.setItem("nowthink_token", t);
const clearToken = () => localStorage.removeItem("nowthink_token");

const authFetch = (url, opts = {}) => fetch(url, {
  ...opts,
  headers: { ...opts.headers, Authorization: `Bearer ${getToken() || ""}` },
});

const greet = () => {
  const h = new Date().getHours();
  if (h < 6) return ["Still awake.", "The quietest hours reveal the most."];
  if (h < 12) return ["Good morning.", "What have you noticed so far today?"];
  if (h < 17) return ["Afternoon.", "Something worth recording?"];
  if (h < 21) return ["Evening.", "What patterns showed up today?"];
  return ["Late night.", "What did today reveal about you?"];
};

const confColor = s => s >= 75 ? "#52a875" : s >= 50 ? "#a8904a" : "#a85252";
const themeHue = t => ({ confidence:"#52a875",focus:"#4a8aa8",relationships:"#a84a8a",identity:"#7a4aa8",productivity:"#a8904a",fear:"#a85252",growth:"#4aa88a",purpose:"#6a4aa8" })[t] || "#666";

const Badge = ({ status }) => {
  const map = { Supported:["#0d2b0d","#1a5c1a","#5cbf5c"], Investigating:["#2b2b0d","#5c5c1a","#c4c44a"], Refuted:["#2b0d0d","#5c1a1a","#bf5c5c"], pending:["#111","#222","#555"], error:["#111","#222","#555"] };
  const [bg, border, color] = map[status] || map.pending;
  return <span style={{ background: bg, border: `1px solid ${border}`, color, padding: "2px 10px", borderRadius: "20px", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif", whiteSpace: "nowrap" }}>{status}</span>;
};

const Spinner = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="10" cy="10" r="8" fill="none" stroke="#333" strokeWidth="2" />
    <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke="#52a875" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ConfBar = ({ score, height = 3 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <div style={{ flex: 1, height, background: "#1a1a1a", borderRadius: height, overflow: "hidden" }}>
      <div style={{ width: `${score}%`, height: "100%", background: confColor(score), borderRadius: height, transition: "width 0.8s ease" }} />
    </div>
    <span style={{ color: "#555", fontSize: "0.7rem", minWidth: "30px", textAlign: "right", fontFamily: "system-ui" }}>{score}%</span>
  </div>
);

function LoginScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", fontFamily: "'Georgia', serif" }}>
      <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: "48px" }}>
          <p style={{ color: "#2a5c3a", fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "16px", fontFamily: "system-ui" }}>nowthink</p>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: "normal", color: "#f0f0f0", margin: "0 0 20px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            See the patterns<br />you never knew<br />were there.
          </h1>
          <p style={{ color: "#444", fontSize: "1rem", lineHeight: 1.7, margin: 0 }}>
            An evidence-based pattern discovery engine.<br />
            Not a journal. Not a chatbot. An investigation.
          </p>
        </div>

        <a href={`${API}/oauth2/authorization/google`} style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#fff", color: "#1a1a1a", padding: "14px 28px", borderRadius: "10px", fontSize: "0.9rem", textDecoration: "none", fontFamily: "system-ui", fontWeight: 500, transition: "opacity 0.2s", letterSpacing: "-0.01em" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </a>

        <p style={{ color: "#2a2a2a", fontSize: "0.75rem", marginTop: "32px", fontFamily: "system-ui" }}>
          Your observations stay private. Always.
        </p>
      </div>
    </div>
  );
}

function DiscoveryCard({ d, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onClick(d)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "#0d0d0d" : "#0a0a0a", border: `1px solid ${hovered ? "#2a3a2a" : "#161616"}`, borderRadius: "12px", padding: "20px 22px", marginBottom: "10px", cursor: "pointer", transition: "all 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px" }}>
        <span style={{ color: "#2a4a2a", fontSize: "0.65rem", letterSpacing: "0.2em", fontFamily: "system-ui" }}>CASE #{d.id}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {d.discoveryType && d.discoveryType !== "none" && <span style={{ color: "#333", fontSize: "0.65rem", fontFamily: "system-ui" }}>{d.discoveryType}</span>}
          <Badge status={d.status} />
        </div>
      </div>
      <p style={{ color: "#c8c8c8", lineHeight: 1.65, marginBottom: "16px", fontSize: "0.95rem", margin: "0 0 16px" }}>{d.claim}</p>
      <ConfBar score={d.confidenceScore} />
    </div>
  );
}

function CaseModal({ d, onClose }) {
  useEffect(() => {
    const handler = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!d) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "16px", padding: "32px", maxWidth: "580px", width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <span style={{ color: "#2a4a2a", fontSize: "0.65rem", letterSpacing: "0.2em", fontFamily: "system-ui", display: "block", marginBottom: "8px" }}>CASE #{d.id}</span>
            <Badge status={d.status} />
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#333", fontSize: "1.3rem", cursor: "pointer", padding: "0", lineHeight: 1 }}>×</button>
        </div>

        <p style={{ color: "#e8e8e8", fontSize: "1.15rem", lineHeight: 1.75, marginBottom: "28px", fontStyle: "italic" }}>{d.claim}</p>

        <div style={{ marginBottom: "28px" }}>
          <p style={{ color: "#333", fontSize: "0.65rem", letterSpacing: "0.2em", fontFamily: "system-ui", marginBottom: "10px" }}>CONFIDENCE</p>
          <ConfBar score={d.confidenceScore} height={4} />
        </div>

        {d.evidenceFor && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ color: "#2a5c2a", fontSize: "0.65rem", letterSpacing: "0.15em", fontFamily: "system-ui", marginBottom: "10px" }}>● EVIDENCE FOR</p>
            <p style={{ color: "#888", fontSize: "0.875rem", lineHeight: 1.7, paddingLeft: "14px", borderLeft: "2px solid #1a3a1a", fontStyle: "italic", margin: 0 }}>{d.evidenceFor}</p>
          </div>
        )}

        {d.evidenceAgainst && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ color: "#5c2a2a", fontSize: "0.65rem", letterSpacing: "0.15em", fontFamily: "system-ui", marginBottom: "10px" }}>● EVIDENCE AGAINST</p>
            <p style={{ color: "#888", fontSize: "0.875rem", lineHeight: 1.7, paddingLeft: "14px", borderLeft: "2px solid #3a1a1a", fontStyle: "italic", margin: 0 }}>{d.evidenceAgainst}</p>
          </div>
        )}

        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #111" }}>
          <span style={{ color: "#2a2a2a", fontSize: "0.7rem", fontFamily: "system-ui" }}>Discovery Type: {d.discoveryType}</span>
        </div>
      </div>
    </div>
  );
}

function EvolutionView({ evolutions }) {
  const themes = [...new Set(evolutions.map(e => e.theme))];

  if (!evolutions.length) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <p style={{ color: "#222", fontSize: "0.9rem", fontStyle: "italic", marginBottom: "8px" }}>No beliefs tracked yet.</p>
      <p style={{ color: "#1a1a1a", fontSize: "0.8rem", fontFamily: "system-ui" }}>File observations to start tracking how your thinking evolves.</p>
    </div>
  );

  return (
    <div>
      {themes.map(theme => {
        const entries = evolutions.filter(e => e.theme === theme).sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
        const color = themeHue(theme);
        return (
          <div key={theme} style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ background: color + "18", border: `1px solid ${color}30`, color, padding: "3px 12px", borderRadius: "20px", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "system-ui" }}>{theme}</span>
              <span style={{ color: "#2a2a2a", fontSize: "0.7rem", fontFamily: "system-ui" }}>{entries.length} belief{entries.length !== 1 ? "s" : ""}</span>
            </div>
            {entries.map((entry, i) => (
              <div key={entry.id} style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "12px", flexShrink: 0, paddingTop: "3px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  {i < entries.length - 1 && <div style={{ width: "1px", flex: 1, background: color + "25", marginTop: "6px", minHeight: "24px" }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: i < entries.length - 1 ? "0" : "0" }}>
                  <p style={{ color: "#c8c8c8", fontSize: "0.9rem", lineHeight: 1.6, fontStyle: "italic", margin: "0 0 4px" }}>{entry.belief}</p>
                  <p style={{ color: "#333", fontSize: "0.7rem", fontFamily: "system-ui", margin: "0 0 6px" }}>
                    {new Date(entry.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  <p style={{ color: "#1e1e1e", fontSize: "0.75rem", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>"{entry.sourceObservation?.slice(0, 90)}{entry.sourceObservation?.length > 90 ? "..." : ""}"</p>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState("discovery");
  const [observations, setObservations] = useState([]);
  const [discoveries, setDiscoveries] = useState([]);
  const [evolutions, setEvolutions] = useState([]);
  const [obsText, setObsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [totalObs, setTotalObs] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) { saveToken(token); window.history.replaceState({}, "", "/"); }
    const stored = getToken();
    if (!stored) { setAuthChecked(true); return; }
    authFetch(`${API}/api/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [obs, disc, evo] = await Promise.all([
        authFetch(`${API}/api/observe`).then(r => r.json()),
        authFetch(`${API}/api/discoveries`).then(r => r.json()),
        authFetch(`${API}/api/evolution`).then(r => r.json()),
      ]);
      setObservations(obs); setTotalObs(obs.length);
      setDiscoveries(disc);
      setEvolutions(evo);
    } catch (e) { setError("Failed to load data."); }
    setLoadingData(false);
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  const handleObserve = async () => {
    if (!obsText.trim() || submitting) return;
    setSubmitting(true); setError(null);
    try {
      const res = await authFetch(`${API}/api/observe`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: obsText });
      if (res.ok) {
        const data = await res.json();
        setLastResult(data); setTotalObs(data.totalObservations); setObsText("");
        setTimeout(loadData, 2500);
      } else { setError("Failed to file observation. Please try again."); }
    } catch { setError("Connection error."); }
    setSubmitting(false);
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true); setError(null);
    try {
      const res = await authFetch(`${API}/api/discoveries/generate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDiscoveries(prev => [data, ...prev.filter(d => d.id !== data.id)]);
        setSelectedCase(data);
      }
    } catch { setError("Discovery failed."); }
    setGenerating(false);
  };

  const handleLogout = () => { clearToken(); setUser(null); setObservations([]); setDiscoveries([]); setEvolutions([]); };

  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={24} />
    </div>
  );

  if (!user) return <LoginScreen />;

  const [greetWord, greetSub] = greet();
  const navItems = [
    { key: "discovery", label: "Discoveries", count: discoveries.length },
    { key: "observe", label: "Observe" },
    { key: "evidence", label: "Evidence", count: totalObs },
    { key: "evolution", label: "Evolution", count: evolutions.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e0e0e0", fontFamily: "'Georgia', serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0a0a; } ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
        textarea:focus { outline: none; border-color: #2a4a2a !important; }
      `}</style>

      {/* Top Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #111" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <span style={{ color: "#2a5c3a", fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "system-ui", fontWeight: 600 }}>nowthink</span>
            <div style={{ display: "flex", gap: "4px" }}>
              {navItems.map(item => (
                <button key={item.key} onClick={() => setView(item.key)} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", fontFamily: "system-ui", color: view === item.key ? "#e0e0e0" : "#444", background: view === item.key ? "#111" : "transparent", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px" }}>
                  {item.label}
                  {item.count > 0 && <span style={{ background: "#1a1a1a", color: "#444", fontSize: "0.6rem", padding: "1px 5px", borderRadius: "10px", fontFamily: "system-ui" }}>{item.count}</span>}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user.picture && <img src={user.picture} alt="" style={{ width: "26px", height: "26px", borderRadius: "50%", opacity: 0.8 }} />}
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#333", fontSize: "0.75rem", cursor: "pointer", fontFamily: "system-ui" }}>Sign out</button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>

        {error && (
          <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", color: "#a85252", fontSize: "0.8rem", fontFamily: "system-ui", display: "flex", justifyContent: "space-between", alignItems: "center", animation: "fadeIn 0.2s ease" }}>
            {error}
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem" }}>×</button>
          </div>
        )}

        {/* DISCOVERY VIEW */}
        {view === "discovery" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: "40px" }}>
              <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "normal", color: "#f0f0f0", marginBottom: "6px", letterSpacing: "-0.02em" }}>Discoveries</h1>
              <p style={{ color: "#444", fontSize: "0.875rem", fontFamily: "system-ui" }}>Evidence-based patterns found in your observations</p>
            </div>

            <div style={{ background: "#0a0f0a", border: "1px solid #111e11", borderRadius: "14px", padding: "28px 32px", marginBottom: "32px" }}>
              <p style={{ color: "#2a4a2a", fontSize: "0.75rem", fontFamily: "system-ui", letterSpacing: "0.1em", marginBottom: "12px" }}>
                {totalObs < 3 ? `${3 - totalObs} MORE OBSERVATION${3 - totalObs !== 1 ? "S" : ""} NEEDED` : "READY TO INVESTIGATE"}
              </p>
              <p style={{ color: "#555", fontSize: "0.9rem", fontStyle: "italic", marginBottom: "20px", lineHeight: 1.6 }}>
                {totalObs < 3 ? "The system needs at least 3 observations before it can build a case about you." : "The system has gathered enough evidence. Ask it what it found."}
              </p>
              {totalObs >= 3 && (
                <button onClick={handleGenerate} disabled={generating} style={{ background: generating ? "transparent" : "#0d2a0d", border: "1px solid #1a4a1a", color: generating ? "#2a4a2a" : "#52a875", padding: "11px 24px", borderRadius: "8px", fontSize: "0.85rem", cursor: generating ? "default" : "pointer", fontFamily: "system-ui", letterSpacing: "-0.01em", display: "inline-flex", alignItems: "center", gap: "10px", transition: "all 0.2s" }}>
                  {generating ? <><Spinner size={14} /><span style={{ animation: "pulse 1.5s infinite" }}>Investigating your patterns...</span></> : "Show me something I don't know →"}
                </button>
              )}
            </div>

            {loadingData && !discoveries.length ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><Spinner size={20} /></div>
            ) : !discoveries.length ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <p style={{ color: "#1e1e1e", fontSize: "0.9rem", fontStyle: "italic", marginBottom: "8px" }}>No cases opened yet.</p>
                <p style={{ color: "#161616", fontSize: "0.8rem", fontFamily: "system-ui" }}>File observations and generate your first discovery.</p>
              </div>
            ) : (
              <div>{discoveries.map(d => <DiscoveryCard key={d.id} d={d} onClick={setSelectedCase} />)}</div>
            )}
          </div>
        )}

        {/* OBSERVE VIEW */}
        {view === "observe" && (
          <div style={{ animation: "fadeIn 0.3s ease", maxWidth: "640px" }}>
            <div style={{ marginBottom: "40px" }}>
              <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "normal", color: "#f0f0f0", marginBottom: "6px", letterSpacing: "-0.02em" }}>{greetWord}</h1>
              <p style={{ color: "#444", fontSize: "0.875rem", fontFamily: "system-ui" }}>{greetSub}</p>
            </div>

            <p style={{ color: "#2a2a2a", fontSize: "0.8rem", fontStyle: "italic", marginBottom: "20px", lineHeight: 1.6 }}>
              Not "how was your day." What did you actually <em style={{ color: "#333" }}>notice</em>? Something that surprised you, keeps returning, or you've been avoiding.
            </p>

            <textarea ref={textareaRef} value={obsText} onChange={e => setObsText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleObserve(); } }}
              placeholder="Write freely. The system will extract what matters."
              style={{ width: "100%", minHeight: "140px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "10px", color: "#e0e0e0", padding: "18px", fontSize: "1rem", resize: "none", fontFamily: "'Georgia', serif", lineHeight: 1.7, transition: "border-color 0.2s" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", flexWrap: "wrap", gap: "12px" }}>
              <p style={{ color: "#222", fontSize: "0.7rem", fontFamily: "system-ui" }}>Press Enter to file · Shift+Enter for new line</p>
              <button onClick={handleObserve} disabled={submitting || !obsText.trim()} style={{ background: submitting ? "transparent" : "#0d2a0d", border: "1px solid #1a4a1a", color: submitting || !obsText.trim() ? "#2a2a2a" : "#52a875", padding: "10px 20px", borderRadius: "8px", fontSize: "0.8rem", cursor: submitting || !obsText.trim() ? "default" : "pointer", fontFamily: "system-ui", display: "inline-flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}>
                {submitting ? <><Spinner size={13} /> Filing...</> : "File observation →"}
              </button>
            </div>

            {lastResult && (
              <div style={{ marginTop: "28px", background: "#0a140a", border: "1px solid #111e11", borderRadius: "10px", padding: "18px 20px", animation: "fadeIn 0.3s ease" }}>
                <p style={{ color: "#2a5c2a", fontSize: "0.65rem", letterSpacing: "0.2em", fontFamily: "system-ui", marginBottom: "8px" }}>OBSERVATION FILED</p>
                <p style={{ color: "#a8c8a8", fontSize: "1rem", fontStyle: "italic", marginBottom: "8px" }}>{lastResult.theme}</p>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <span style={{ color: "#333", fontSize: "0.7rem", fontFamily: "system-ui" }}>Energy {lastResult.energyScore}/10</span>
                  <span style={{ color: "#333", fontSize: "0.7rem", fontFamily: "system-ui" }}>Total: {lastResult.totalObservations}</span>
                  {lastResult.readyForDiscovery && <span style={{ color: "#2a5c2a", fontSize: "0.7rem", fontFamily: "system-ui" }}>✓ Ready for discovery</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVIDENCE VIEW */}
        {view === "evidence" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: "40px" }}>
              <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "normal", color: "#f0f0f0", marginBottom: "6px", letterSpacing: "-0.02em" }}>Evidence</h1>
              <p style={{ color: "#444", fontSize: "0.875rem", fontFamily: "system-ui" }}>{totalObs} observation{totalObs !== 1 ? "s" : ""} on record</p>
            </div>

            {loadingData && !observations.length ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><Spinner size={20} /></div>
            ) : !observations.length ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <p style={{ color: "#1e1e1e", fontSize: "0.9rem", fontStyle: "italic" }}>No observations yet.</p>
              </div>
            ) : (
              <div>
                {observations.map(obs => (
                  <div key={obs.id} style={{ background: "#0a0a0a", border: "1px solid #131313", borderRadius: "10px", padding: "16px 18px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <span style={{ color: "#1e2e1e", fontSize: "0.65rem", letterSpacing: "0.15em", fontFamily: "system-ui" }}>OBS #{obs.id}</span>
                      {obs.extractedTheme && obs.extractedTheme !== "Unnamed observation" && (
                        <span style={{ color: "#3a5a3a", fontSize: "0.7rem", fontStyle: "italic" }}>{obs.extractedTheme}</span>
                      )}
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ display: "flex", gap: "3px" }}>
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} style={{ width: "4px", height: "12px", borderRadius: "2px", background: i < obs.energyScore ? confColor(obs.energyScore * 10) : "#111" }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p style={{ color: "#888", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: "8px" }}>{obs.rawText}</p>
                    <p style={{ color: "#222", fontSize: "0.7rem", fontFamily: "system-ui" }}>
                      {new Date(obs.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EVOLUTION VIEW */}
        {view === "evolution" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ marginBottom: "40px" }}>
              <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "normal", color: "#f0f0f0", marginBottom: "6px", letterSpacing: "-0.02em" }}>Thought Evolution</h1>
              <p style={{ color: "#444", fontSize: "0.875rem", fontFamily: "system-ui" }}>How your beliefs shift over time</p>
            </div>
            {loadingData && !evolutions.length ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><Spinner size={20} /></div>
            ) : (
              <EvolutionView evolutions={evolutions} />
            )}
          </div>
        )}

      </main>

      <CaseModal d={selectedCase} onClose={() => setSelectedCase(null)} />
    </div>
  );
}