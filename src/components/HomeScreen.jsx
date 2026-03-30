import { theme, mono, btnPrimary, btnSecondary } from '../styles';

export default function HomeScreen({ matches, onNewMatch, onViewMatch, onManageTeams, onDeleteMatch }) {
  return (
    <div style={{ padding: "0 16px 100px", paddingTop: "env(safe-area-inset-top, 16px)" }}>
      <div style={{ textAlign: "center", padding: "40px 0 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🤾</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px", margin: 0, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HandballStats</h1>
        <p style={{ fontSize: 13, color: theme.textMuted, margin: "6px 0 0", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 500 }}>Pro Statistika</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        <button onClick={onNewMatch} style={{ ...btnPrimary, padding: "18px 16px", fontSize: 15, fontWeight: 700, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24 }}>🏟</span>Nova utakmica
        </button>
        <button onClick={onManageTeams} style={{ ...btnSecondary, padding: "18px 16px", fontSize: 15, fontWeight: 700, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24 }}>👥</span>Timovi
        </button>
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1.5px" }}>Posljednje utakmice</h2>
      {matches.length === 0 ? (
        <div style={{ background: theme.surface, borderRadius: 16, padding: "40px 20px", textAlign: "center", border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ color: theme.textMuted, fontSize: 14, margin: 0 }}>Nema zabilježenih utakmica</p>
          <p style={{ color: theme.textDim, fontSize: 12, margin: "4px 0 0" }}>Započni novu utakmicu za praćenje statistike</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {matches.map(m => (
            <div key={m.id} style={{ background: theme.surface, borderRadius: 14, padding: 16, border: `1px solid ${theme.border}`, cursor: "pointer" }} onClick={() => onViewMatch(m)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontFamily: mono, color: theme.textDim }}>{new Date(m.date).toLocaleDateString("sr-Latn")}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: m.status === "finished" ? theme.success + "22" : theme.warning + "22", color: m.status === "finished" ? theme.success : theme.warning, fontWeight: 600 }}>{m.status === "finished" ? "Završena" : "U toku"}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {m.homeTeam.name} <span style={{ fontFamily: mono, fontSize: 18, color: theme.accent, fontWeight: 800 }}>{m.homeTeam.score}</span>
                    <span style={{ color: theme.textDim, margin: "0 6px" }}>:</span>
                    <span style={{ fontFamily: mono, fontSize: 18, color: theme.accent3, fontWeight: 800 }}>{m.awayTeam.score}</span> {m.awayTeam.name}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); if (confirm("Obriši utakmicu?")) onDeleteMatch(m.id); }} style={{ background: "none", border: "none", color: theme.textDim, fontSize: 18, cursor: "pointer", padding: 4 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
