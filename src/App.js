import { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:9090";

function getToken() {
  return localStorage.getItem("nowthink_token");
}

function saveToken(token) {
  localStorage.setItem("nowthink_token", token);
}

function clearToken() {
  localStorage.removeItem("nowthink_token");
}

function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Still awake. What did you notice today?";
  if (hour < 12) return "Morning. What have you observed so far?";
  if (hour < 17) return "Afternoon. Something worth noting?";
  if (hour < 21) return "Evening. What patterns showed up today?";
  return "Late night. What did today reveal?";
}

function confidenceColor(score) {
  if (score >= 75) return "#5a8a5a";
  if (score >= 50) return "#8a7a3a";
  return "#6a4a4a";
}

function statusBadge(status) {
  const colors = {
    Supported: { bg: "#0a1f0a", border: "#2a5a2a", text: "#6abf6a" },
    Investigating: { bg: "#1a1a0a", border: "#5a5a2a", text: "#bfbf6a" },
    Refuted: { bg: "#1f0a0a", border: "#5a2a2a", text: "#bf6a6a" },
    pending: { bg: "#111", border: "#333", text: "#555" },
    error: { bg: "#111", border: "#333", text: "#555" },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      backgroundColor: c.bg, border: `1px solid ${c.border}`,
      color: c.text, padding: "2px 10px", borderRadius: "20px",
      fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase",
    }}>{status}</span>
  );
}

function themeColor(theme) {
  const colors = {
    confidence: "#5a8a5a", focus: "#5a7a8a", relationships: "#8a5a7a",
    identity: "#7a6a8a", productivity: "#8a7a3a", fear: "#8a4a4a",
    growth: "#4a8a6a", purpose: "#6a5a8a",
  };
  return colors[theme] || "#555";
}

function LoginScreen() {
  return (
    <div style={styles.loginContainer}>
      <h1 style={styles.title}>Nowthink</h1>
      <p style={styles.subtitle}>evidence-based pattern discovery</p>
      <p style={{ color: "#444", fontSize: "0.9rem", marginBottom: "40px", fontStyle: "italic", textAlign: "center", maxWidth: "400px" }}>
        See the patterns in yourself you never knew were there.
      </p>
      <a href={`${API}/oauth2/authorization/google`} style={styles.googleBtn}>
        <img src="https://www.google.com/favicon.ico" alt="" style={{ width: "16px", height: "16px", marginRight: "10px" }} />
        Sign in with Google
      </a>
    </div>
  );
}

function DiscoveryCard({ discovery, onClick }) {
  return (
    <div style={styles.discoveryCard} onClick={() => onClick(discovery)}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#2a3a2a"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1a"}>
      <div style={styles.cardHeader}>
        <span style={styles.caseLabel}>CASE #{discovery.id}</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ color: "#555", fontSize: "0.75rem" }}>{discovery.discoveryType}</span>
          {statusBadge(discovery.status)}
        </div>
      </div>
      <p style={styles.cardClaim}>{discovery.claim}</p>
      <div style={styles.confidenceRow}>
        <div style={styles.confidenceBarBg}>
          <div style={{ ...styles.confidenceBarFill, width: `${discovery.confidenceScore}%`, backgroundColor: confidenceColor(discovery.confidenceScore) }} />
        </div>
        <span style={{ color: "#555", fontSize: "0.75rem", marginLeft: "10px" }}>{discovery.confidenceScore}%</span>
      </div>
    </div>
  );
}

function CaseModal({ discovery, onClose }) {
  if (!discovery) return null;
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <span style={styles.caseLabel}>CASE #{discovery.id}</span>
            <div style={{ marginTop: "6px" }}>{statusBadge(discovery.status)}</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={styles.modalClaim}>{discovery.claim}</p>
        <div style={styles.confidenceSection}>
          <span style={{ color: "#555", fontSize: "0.75rem", letterSpacing: "0.1em" }}>CONFIDENCE</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
            <div style={{ ...styles.confidenceBarBg, flex: 1 }}>
              <div style={{ ...styles.confidenceBarFill, width: `${discovery.confidenceScore}%`, backgroundColor: confidenceColor(discovery.confidenceScore) }} />
            </div>
            <span style={{ color: "#ccc", fontSize: "1.1rem", fontWeight: "bold" }}>{discovery.confidenceScore}%</span>
          </div>
        </div>
        {discovery.evidenceFor && (
          <div style={styles.evidenceSection}>
            <p style={{ ...styles.evidenceLabel, color: "#4a8a4a" }}>● EVIDENCE FOR</p>
            <p style={styles.evidenceText}>{discovery.evidenceFor}</p>
          </div>
        )}
        {discovery.evidenceAgainst && (
          <div style={styles.evidenceSection}>
            <p style={{ ...styles.evidenceLabel, color: "#8a4a4a" }}>● EVIDENCE AGAINST</p>
            <p style={styles.evidenceText}>{discovery.evidenceAgainst}</p>
          </div>
        )}
        <div style={styles.discoveryType}>
          <span style={{ color: "#444", fontSize: "0.75rem" }}>Discovery Type: </span>
          <span style={{ color: "#888", fontSize: "0.75rem" }}>{discovery.discoveryType}</span>
        </div>
      </div>
    </div>
  );
}

function EvolutionView({ evolutions }) {
  const themes = [...new Set(evolutions.map(e => e.theme))];
  if (evolutions.length === 0) return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <p style={{ color: "#333", fontStyle: "italic" }}>No thought evolution tracked yet.</p>
    </div>
  );
  return (
    <div>
      {themes.map(theme => {
        const entries = evolutions.filter(e => e.theme === theme)
          .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
        return (
          <div key={theme} style={styles.themeBlock}>
            <div style={styles.themeHeader}>
              <span style={{ ...styles.themeBadge, backgroundColor: themeColor(theme) + "22", border: `1px solid ${themeColor(theme)}44`, color: themeColor(theme) }}>{theme}</span>
              <span style={{ color: "#333", fontSize: "0.7rem" }}>{entries.length} belief{entries.length !== 1 ? "s" : ""} tracked</span>
            </div>
            <div style={styles.evolutionTrack}>
              {entries.map((entry, i) => (
                <div key={entry.id} style={styles.evolutionEntry}>
                  <div style={styles.evolutionDot}>
                    <div style={{ ...styles.dot, backgroundColor: themeColor(theme) }} />
                    {i < entries.length - 1 && <div style={{ ...styles.connector, backgroundColor: themeColor(theme) + "33" }} />}
                  </div>
                  <div style={styles.evolutionContent}>
                    <p style={styles.beliefText}>{entry.belief}</p>
                    <p style={styles.beliefDate}>{new Date(entry.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    <p style={styles.sourceText}>"{entry.sourceObservation?.slice(0, 80)}..."</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function App() {
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      saveToken(token);
      window.history.replaceState({}, "", "/");
    }

    const stored = getToken();
    if (!stored) {
      setAuthChecked(true);
      return;
    }

    authFetch(`${API}/api/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setUser(data);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  const loadData = () => {
    authFetch(`${API}/api/observe`)
      .then(r => r.json())
      .then(data => { setObservations(data); setTotalObs(data.length); })
      .catch(() => {});

    authFetch(`${API}/api/discoveries`)
      .then(r => r.json())
      .then(setDiscoveries)
      .catch(() => {});

    authFetch(`${API}/api/evolution`)
      .then(r => r.json())
      .then(setEvolutions)
      .catch(() => {});
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleObserve = async () => {
    if (!obsText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`${API}/api/observe`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: obsText,
      });
      if (res.ok) {
        const data = await res.json();
        setLastResult(data);
        setTotalObs(data.totalObservations);
        setObsText("");
        setTimeout(() => loadData(), 3000);
      }
    } catch (err) {}
    setSubmitting(false);
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await authFetch(`${API}/api/discoveries/generate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDiscoveries(prev => [data, ...prev.filter(d => d.id !== data.id)]);
        setSelectedCase(data);
      }
    } catch (err) {}
    setGenerating(false);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setObservations([]);
    setDiscoveries([]);
    setEvolutions([]);
  };

  if (!authChecked) {
    return <div style={styles.loadingContainer}><p style={{ color: "#333", fontStyle: "italic" }}>loading...</p></div>;
  }

  if (!user) return <LoginScreen />;

  const navItems = [
    { key: "discovery", label: "discoveries" },
    { key: "observe", label: "observe" },
    { key: "evidence", label: `evidence (${totalObs})` },
    { key: "evolution", label: "evolution" },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={styles.title}>Nowthink</h1>
            <p style={styles.subtitle}>evidence-based pattern discovery</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user.picture && <img src={user.picture} alt={user.name} style={{ width: "32px", height: "32px", borderRadius: "50%" }} />}
            <div>
              <p style={{ color: "#888", fontSize: "0.8rem", margin: 0 }}>{user.name}</p>
              <button style={{ backgroundColor: "transparent", border: "none", color: "#444", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'Georgia', serif", padding: 0 }} onClick={handleLogout}>sign out</button>
            </div>
          </div>
        </div>
        <div style={styles.nav}>
          {navItems.map(item => (
            <button key={item.key}
              style={{ ...styles.navBtn, ...(view === item.key ? styles.navActive : {}) }}
              onClick={() => setView(item.key)}>{item.label}</button>
          ))}
        </div>
      </div>

      {view === "discovery" && (
        <div style={styles.section}>
          <div style={styles.heroAction}>
            <p style={styles.heroText}>
              {totalObs < 3 ? `Add ${3 - totalObs} more observation${3 - totalObs !== 1 ? "s" : ""} to unlock your first discovery` : "The system has enough evidence to investigate."}
            </p>
            <button style={{ ...styles.generateBtn, opacity: totalObs < 3 ? 0.4 : 1, cursor: totalObs < 3 ? "not-allowed" : "pointer" }}
              onClick={handleGenerate} disabled={totalObs < 3 || generating}>
              {generating ? "investigating..." : "show me something I don't know"}
            </button>
          </div>
          {discoveries.length === 0 ? <p style={styles.empty}>No discoveries yet.</p> :
            discoveries.map(d => <DiscoveryCard key={d.id} discovery={d} onClick={setSelectedCase} />)}
        </div>
      )}

      {view === "observe" && (
        <div style={styles.section}>
          <p style={styles.observePrompt}>{getGreeting()}</p>
          <p style={styles.observeHint}>Not "how was your day" — what did you actually <em>notice</em>?</p>
          <textarea style={styles.textarea}
            placeholder="Something surprising. Something recurring. Something you're avoiding..."
            value={obsText} onChange={e => setObsText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleObserve(); } }} />
          <button style={styles.submitBtn} onClick={handleObserve} disabled={submitting}>
            {submitting ? "filing observation..." : "file observation →"}
          </button>
          {lastResult && (
            <div style={styles.resultCard}>
              <p style={styles.resultLabel}>observation filed</p>
              <p style={styles.resultTheme}>{lastResult.theme}</p>
              <p style={styles.resultMeta}>Energy: {lastResult.energyScore}/10 · Total: {lastResult.totalObservations}{lastResult.readyForDiscovery && " · Ready ✓"}</p>
            </div>
          )}
        </div>
      )}

      {view === "evidence" && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>ALL OBSERVATIONS — {observations.length} FILED</p>
          {observations.length === 0 ? <p style={styles.empty}>No observations yet.</p> :
            observations.map(obs => (
              <div key={obs.id} style={styles.obsCard}>
                <div style={styles.obsHeader}>
                  <span style={styles.obsId}>OBS #{obs.id}</span>
                  <span style={styles.obsTheme}>{obs.extractedTheme}</span>
                  <span style={styles.obsEnergy}>energy: {obs.energyScore}/10</span>
                </div>
                <p style={styles.obsText}>{obs.rawText}</p>
                <p style={styles.obsDate}>{new Date(obs.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            ))}
        </div>
      )}

      {view === "evolution" && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>THOUGHT EVOLUTION — HOW YOUR BELIEFS CHANGE</p>
          <EvolutionView evolutions={evolutions} />
        </div>
      )}

      <CaseModal discovery={selectedCase} onClose={() => setSelectedCase(null)} />
    </div>
  );
}

const styles = {
  loadingContainer: { minHeight: "100vh", backgroundColor: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" },
  loginContainer: { minHeight: "100vh", backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif", padding: "40px 20px" },
  googleBtn: { display: "flex", alignItems: "center", backgroundColor: "#fff", color: "#333", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "0.95rem", cursor: "pointer", textDecoration: "none", fontFamily: "'Georgia', serif" },
  container: { minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#e0e0e0", fontFamily: "'Georgia', serif", maxWidth: "700px", margin: "0 auto", padding: "40px 20px" },
  header: { marginBottom: "40px" },
  title: { fontSize: "2rem", fontWeight: "normal", letterSpacing: "0.15em", margin: 0, color: "#fff" },
  subtitle: { color: "#444", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "6px" },
  nav: { display: "flex", gap: "4px", marginTop: "24px", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap" },
  navBtn: { backgroundColor: "transparent", border: "none", color: "#444", padding: "8px 16px", cursor: "pointer", fontFamily: "'Georgia', serif", fontSize: "0.85rem", borderBottom: "2px solid transparent", marginBottom: "-1px" },
  navActive: { color: "#a8c5a0", borderBottom: "2px solid #4a7a4a" },
  section: { marginTop: "32px" },
  heroAction: { backgroundColor: "#0f1a0f", border: "1px solid #1a2a1a", borderRadius: "12px", padding: "24px", marginBottom: "32px", textAlign: "center" },
  heroText: { color: "#555", fontSize: "0.9rem", marginBottom: "16px", fontStyle: "italic" },
  generateBtn: { backgroundColor: "#1a3a1a", border: "1px solid #2a5a2a", color: "#6abf6a", padding: "12px 28px", borderRadius: "8px", fontSize: "0.9rem", cursor: "pointer", fontFamily: "'Georgia', serif" },
  discoveryCard: { backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "20px", marginBottom: "16px", cursor: "pointer", transition: "border-color 0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  caseLabel: { color: "#444", fontSize: "0.7rem", letterSpacing: "0.2em" },
  cardClaim: { color: "#ccc", lineHeight: "1.6", marginBottom: "16px", fontSize: "0.95rem" },
  confidenceRow: { display: "flex", alignItems: "center" },
  confidenceBarBg: { flex: 1, height: "3px", backgroundColor: "#1a1a1a", borderRadius: "2px", overflow: "hidden" },
  confidenceBarFill: { height: "100%", borderRadius: "2px", transition: "width 0.5s ease" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" },
  modal: { backgroundColor: "#0f0f0f", border: "1px solid #222", borderRadius: "16px", padding: "32px", maxWidth: "560px", width: "100%", maxHeight: "85vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  closeBtn: { backgroundColor: "transparent", border: "none", color: "#444", fontSize: "1.2rem", cursor: "pointer" },
  modalClaim: { color: "#e0e0e0", fontSize: "1.1rem", lineHeight: "1.7", marginBottom: "24px", fontStyle: "italic" },
  confidenceSection: { marginBottom: "24px" },
  evidenceSection: { marginBottom: "20px" },
  evidenceLabel: { fontSize: "0.7rem", letterSpacing: "0.15em", marginBottom: "8px" },
  evidenceText: { color: "#888", fontSize: "0.85rem", lineHeight: "1.6", paddingLeft: "12px", borderLeft: "2px solid #222", fontStyle: "italic" },
  discoveryType: { marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #1a1a1a" },
  observePrompt: { color: "#888", fontSize: "1rem", marginBottom: "8px" },
  observeHint: { color: "#333", fontSize: "0.8rem", marginBottom: "20px", fontStyle: "italic" },
  textarea: { width: "100%", backgroundColor: "#0f0f0f", border: "1px solid #222", borderRadius: "8px", color: "#e0e0e0", padding: "16px", fontSize: "0.95rem", resize: "none", minHeight: "120px", fontFamily: "'Georgia', serif", outline: "none", lineHeight: "1.6", boxSizing: "border-box" },
  submitBtn: { marginTop: "12px", backgroundColor: "transparent", border: "1px solid #2a4a2a", borderRadius: "8px", color: "#4a7a4a", padding: "10px 20px", fontSize: "0.85rem", cursor: "pointer", fontFamily: "'Georgia', serif" },
  resultCard: { marginTop: "20px", backgroundColor: "#0a1a0a", border: "1px solid #1a2a1a", borderRadius: "8px", padding: "16px" },
  resultLabel: { color: "#4a7a4a", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" },
  resultTheme: { color: "#a8c5a0", fontSize: "1rem", marginBottom: "6px", fontStyle: "italic" },
  resultMeta: { color: "#444", fontSize: "0.75rem" },
  sectionTitle: { color: "#333", fontSize: "0.7rem", letterSpacing: "0.2em", marginBottom: "20px" },
  obsCard: { backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "16px", marginBottom: "12px" },
  obsHeader: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" },
  obsId: { color: "#333", fontSize: "0.7rem", letterSpacing: "0.15em" },
  obsTheme: { color: "#6a8a6a", fontSize: "0.75rem", fontStyle: "italic" },
  obsEnergy: { color: "#444", fontSize: "0.7rem", marginLeft: "auto" },
  obsText: { color: "#888", fontSize: "0.85rem", lineHeight: "1.6", marginBottom: "8px" },
  obsDate: { color: "#2a2a2a", fontSize: "0.7rem" },
  empty: { color: "#333", fontStyle: "italic", textAlign: "center", marginTop: "60px" },
  themeBlock: { marginBottom: "40px" },
  themeHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  themeBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" },
  evolutionTrack: { paddingLeft: "8px" },
  evolutionEntry: { display: "flex", gap: "16px", marginBottom: "24px" },
  evolutionDot: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: "16px" },
  dot: { width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0 },
  connector: { width: "2px", flex: 1, minHeight: "20px", marginTop: "4px" },
  evolutionContent: { flex: 1, paddingBottom: "8px" },
  beliefText: { color: "#ccc", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "4px", fontStyle: "italic" },
  beliefDate: { color: "#444", fontSize: "0.7rem", marginBottom: "6px" },
  sourceText: { color: "#2a2a2a", fontSize: "0.75rem", lineHeight: "1.4" },
};

export default App;