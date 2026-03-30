import { useState } from 'react';
import Header from './Header';
import { POSITIONS } from '../constants';
import { theme, mono, font, inputStyle, btnPrimary, btnSecondary } from '../styles';

export default function TeamManager({ teams, onSave, onBack }) {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState([{ id: "t1", number: "", name: "", position: "CB" }]);
  const [editing, setEditing] = useState(null);

  const addPlayer = () => setPlayers(prev => [...prev, { id: `t${Date.now()}`, number: "", name: "", position: "CB" }]);
  const updatePlayer = (id, field, val) => setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  const removePlayer = (id) => setPlayers(prev => prev.filter(p => p.id !== id));

  const save = async () => {
    if (!name.trim()) return;
    await onSave({ id: editing || `team_${Date.now()}`, name, players: players.filter(p => p.name.trim()) });
    setName(""); setPlayers([{ id: "t1", number: "", name: "", position: "CB" }]); setEditing(null);
  };

  const loadForEdit = (t) => { setEditing(t.id); setName(t.name); setPlayers(t.players.map((p, i) => ({ ...p, id: `t${i}` }))); };

  return (
    <div style={{ padding: "0 16px 100px", paddingTop: "env(safe-area-inset-top, 16px)" }}>
      <Header title="Upravljanje timovima" onBack={onBack} />
      {teams.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Sačuvani timovi</div>
          {teams.map(t => (
            <div key={t.id} onClick={() => loadForEdit(t)} style={{ background: theme.surface, borderRadius: 12, padding: 14, marginBottom: 8, border: `1px solid ${theme.border}`, cursor: "pointer" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{t.players.length} igrača: {t.players.map(p => `#${p.number} ${p.name}`).join(", ")}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: theme.surface, borderRadius: 16, padding: 16, border: `1px solid ${theme.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{editing ? "Uredi tim" : "Novi tim"}</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Naziv tima" style={{ ...inputStyle, marginBottom: 10, fontSize: 15, fontWeight: 700 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {players.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input value={p.number} onChange={e => updatePlayer(p.id, "number", e.target.value)} placeholder="#" style={{ ...inputStyle, width: 44, textAlign: "center", fontFamily: mono, fontWeight: 700 }} />
              <input value={p.name} onChange={e => updatePlayer(p.id, "name", e.target.value)} placeholder="Ime igrača" style={{ ...inputStyle, flex: 1 }} />
              <select value={p.position} onChange={e => updatePlayer(p.id, "position", e.target.value)} style={{ ...inputStyle, width: 64, padding: "8px 4px", fontSize: 12 }}>
                {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
              {players.length > 1 && <button onClick={() => removePlayer(p.id)} style={{ background: "none", border: "none", color: theme.textDim, fontSize: 16, cursor: "pointer" }}>✕</button>}
            </div>
          ))}
        </div>
        <button onClick={addPlayer} style={{ ...btnSecondary, marginTop: 10, width: "100%", padding: "10px 0", fontSize: 12 }}>+ Dodaj igrača</button>
        <button onClick={save} disabled={!name.trim()} style={{ ...btnPrimary, marginTop: 10, width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 700, opacity: name.trim() ? 1 : 0.4 }}>💾 Sačuvaj tim</button>
      </div>
    </div>
  );
}
