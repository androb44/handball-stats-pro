import { useState } from 'react';
import Header from './Header';
import { POSITIONS } from '../constants';
import { theme, mono, font, inputStyle, btnPrimary, btnSecondary } from '../styles';

export default function MatchSetup({ teams, onStart, onBack }) {
  const [homeName, setHomeName] = useState("");
  const [awayName, setAwayName] = useState("");
  const [homePlayers, setHomePlayers] = useState([{ id: "h1", number: "", name: "", position: "CB" }]);
  const [awayPlayers, setAwayPlayers] = useState([{ id: "a1", number: "", name: "", position: "CB" }]);
  const [tab, setTab] = useState("home");

  const addPlayer = (side) => {
    const setter = side === "home" ? setHomePlayers : setAwayPlayers;
    const prefix = side === "home" ? "h" : "a";
    setter(prev => [...prev, { id: `${prefix}${Date.now()}`, number: "", name: "", position: "CB" }]);
  };
  const updatePlayer = (side, id, field, value) => {
    const setter = side === "home" ? setHomePlayers : setAwayPlayers;
    setter(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const removePlayer = (side, id) => {
    const setter = side === "home" ? setHomePlayers : setAwayPlayers;
    setter(prev => prev.filter(p => p.id !== id));
  };
  const loadTeam = (side, team) => {
    if (side === "home") { setHomeName(team.name); setHomePlayers(team.players.map((p, i) => ({ ...p, id: `h${i}` }))); }
    else { setAwayName(team.name); setAwayPlayers(team.players.map((p, i) => ({ ...p, id: `a${i}` }))); }
  };

  const canStart = homeName.trim() && awayName.trim() && homePlayers.some(p => p.name.trim()) && awayPlayers.some(p => p.name.trim());
  const handleStart = () => {
    onStart({
      id: `m_${Date.now()}`, date: new Date().toISOString(), status: "live", halfDuration: 30,
      homeTeam: { name: homeName, score: 0, players: homePlayers.filter(p => p.name.trim()), timeouts: 3, timeoutsUsed: 0 },
      awayTeam: { name: awayName, score: 0, players: awayPlayers.filter(p => p.name.trim()), timeouts: 3, timeoutsUsed: 0 },
      events: [], currentHalf: 1, elapsedSeconds: 0,
    });
  };

  const players = tab === "home" ? homePlayers : awayPlayers;

  return (
    <div style={{ padding: "0 16px 120px", paddingTop: "env(safe-area-inset-top, 16px)" }}>
      <Header title="Nova utakmica" onBack={onBack} />
      <div style={{ display: "flex", gap: 4, background: theme.surface, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {["home", "away"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: tab === t ? (t === "home" ? theme.accent + "22" : theme.accent3 + "22") : "transparent", color: tab === t ? (t === "home" ? theme.accent : theme.accent3) : theme.textMuted, fontFamily: font, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{t === "home" ? "🏠 Domaći" : "✈ Gosti"}</button>
        ))}
      </div>
      <input value={tab === "home" ? homeName : awayName} onChange={e => tab === "home" ? setHomeName(e.target.value) : setAwayName(e.target.value)} placeholder="Naziv tima" style={{ ...inputStyle, marginBottom: 8, fontSize: 16, fontWeight: 700 }} />
      {teams.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {teams.map(t => (
            <button key={t.id} onClick={() => loadTeam(tab, t)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surface2, color: theme.textMuted, fontFamily: font, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>📂 {t.name}</button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {players.map(p => (
          <div key={p.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={p.number} onChange={e => updatePlayer(tab, p.id, "number", e.target.value)} placeholder="#" style={{ ...inputStyle, width: 44, textAlign: "center", fontFamily: mono, fontWeight: 700 }} />
            <input value={p.name} onChange={e => updatePlayer(tab, p.id, "name", e.target.value)} placeholder="Ime igrača" style={{ ...inputStyle, flex: 1 }} />
            <select value={p.position} onChange={e => updatePlayer(tab, p.id, "position", e.target.value)} style={{ ...inputStyle, width: 64, padding: "8px 4px", fontSize: 12 }}>
              {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
            {players.length > 1 && <button onClick={() => removePlayer(tab, p.id)} style={{ background: "none", border: "none", color: theme.textDim, fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>}
          </div>
        ))}
      </div>
      <button onClick={() => addPlayer(tab)} style={{ ...btnSecondary, marginTop: 10, padding: "10px 0", width: "100%", fontSize: 13 }}>+ Dodaj igrača</button>
      <button disabled={!canStart} onClick={handleStart} style={{ ...btnPrimary, marginTop: 24, padding: "16px 0", width: "100%", fontSize: 16, fontWeight: 800, opacity: canStart ? 1 : 0.4, borderRadius: 14 }}>🏟 Započni utakmicu</button>
    </div>
  );
}
