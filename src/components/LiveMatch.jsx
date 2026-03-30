import { useState, useEffect, useRef } from 'react';
import LiveStats from './LiveStats';
import { ShotZonePicker, GoalkeeperZonePicker } from './ShotZonePicker';
import { EVENT_TYPES, EVENT_CATEGORIES } from '../constants';
import { theme, mono, font, btnSmall } from '../styles';
import { useResponsive } from '../hooks/useResponsive';

// Events that need a shot zone after selection
const SHOT_EVENTS = ["goal", "shot_missed", "shot_blocked", "shot_post", "penalty_goal", "penalty_miss"];
const SAVE_EVENTS = ["save", "penalty_save"];
const FAST_BREAK_OUTCOMES = [
  { id: "goal", label: "Gol", icon: "⚽", color: "#00E676" },
  { id: "shot_missed", label: "Promašaj", icon: "✖", color: "#FF5252" },
  { id: "save", label: "Odbrana", icon: "🧤", color: "#00BFA5" },
];

export default function LiveMatch({ match: initialMatch, onSave, onEnd }) {
  const [match, setMatch] = useState(initialMatch);
  const [timerRunning, setTimerRunning] = useState(false);
  const [selectedSide, setSelectedSide] = useState("home");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [eventCategory, setEventCategory] = useState("offense");
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [showStats, setShowStats] = useState(false);
  // Zone picker state
  const [pendingEvent, setPendingEvent] = useState(null); // event waiting for zone
  const [zoneStep, setZoneStep] = useState(null); // "shot_zone" | "gk_zone" | "fast_break"
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const { isMobile, isDesktop, playerColumns } = useResponsive();

  useEffect(() => {
    if (timerRunning) { timerRef.current = setInterval(() => { setMatch(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 })); }, 1000); }
    else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => {
    autoSaveRef.current = setInterval(() => { onSave(match); }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [match]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const isTied = match.homeTeam.score === match.awayTeam.score;
  const halfLabel = match.currentHalf === 1 ? "1. poluvrijeme" : match.currentHalf === 2 ? "2. poluvrijeme" : match.currentHalf === 3 ? "1. produžetak" : match.currentHalf === 4 ? "2. produžetak" : `Produžetak ${match.currentHalf - 2}`;

  // ─── EVENT HANDLING WITH ZONES ───
  const commitEvent = (eventData) => {
    const updated = { ...match, events: [...match.events, eventData] };
    if (["goal", "penalty_goal"].includes(eventData.type)) {
      if (eventData.side === "home") updated.homeTeam = { ...updated.homeTeam, score: updated.homeTeam.score + 1 };
      else updated.awayTeam = { ...updated.awayTeam, score: updated.awayTeam.score + 1 };
    }
    setUndoStack(prev => [...prev, match]);
    setMatch(updated);
    setPendingEvent(null);
    setZoneStep(null);
    setShowEventPanel(false);
    setSelectedPlayer(null);
  };

  const addEvent = (eventType) => {
    if (!selectedPlayer) return;
    const baseEvent = {
      id: `e_${Date.now()}`, type: eventType.id, label: eventType.label, icon: eventType.icon,
      side: selectedSide, playerId: selectedPlayer?.id, playerName: selectedPlayer?.name, playerNumber: selectedPlayer?.number,
      time: match.elapsedSeconds, half: match.currentHalf, timestamp: new Date().toISOString(),
    };

    // Fast break → ask for outcome
    if (eventType.id === "fast_break") {
      setPendingEvent(baseEvent);
      setZoneStep("fast_break");
      return;
    }

    // Shot events → ask for zone
    if (SHOT_EVENTS.includes(eventType.id)) {
      setPendingEvent(baseEvent);
      setZoneStep("shot_zone");
      return;
    }

    // Save events → ask for GK zone
    if (SAVE_EVENTS.includes(eventType.id)) {
      setPendingEvent(baseEvent);
      setZoneStep("gk_zone");
      return;
    }

    // Everything else → commit directly
    commitEvent(baseEvent);
  };

  // Fast break outcome selected
  const handleFastBreakOutcome = (outcomeId) => {
    if (!pendingEvent) return;
    const outcome = FAST_BREAK_OUTCOMES.find(o => o.id === outcomeId);
    const updatedEvent = { ...pendingEvent, outcome: outcomeId, outcomeLabel: outcome.label };

    // If it was a goal, also update the type so it counts as a goal in stats
    if (outcomeId === "goal") {
      updatedEvent.type = "fast_break";
      updatedEvent.outcome = "goal";
      // Ask for shot zone
      setPendingEvent(updatedEvent);
      setZoneStep("shot_zone");
      return;
    }
    if (outcomeId === "save") {
      updatedEvent.outcome = "save";
      commitEvent(updatedEvent);
      return;
    }
    // miss
    updatedEvent.outcome = "miss";
    commitEvent(updatedEvent);
  };

  // Shot zone selected
  const handleShotZone = (zoneId, zoneLabel) => {
    if (!pendingEvent) return;
    const updated = { ...pendingEvent, shotZone: zoneId, shotZoneLabel: zoneLabel };
    commitEvent(updated);
  };

  // GK zone selected
  const handleGkZone = (zoneId, zoneLabel) => {
    if (!pendingEvent) return;
    const updated = { ...pendingEvent, gkZone: zoneId, gkZoneLabel: zoneLabel };
    commitEvent(updated);
  };

  const cancelZone = () => { setPendingEvent(null); setZoneStep(null); };

  const addTimeout = (side) => {
    const tk = side === "home" ? "homeTeam" : "awayTeam";
    const team = match[tk];
    if (team.timeoutsUsed >= team.timeouts) return;
    const event = { id: `e_${Date.now()}`, type: "timeout", label: "Timeout", icon: "⏸", side, playerName: team.name, time: match.elapsedSeconds, half: match.currentHalf, timestamp: new Date().toISOString() };
    setUndoStack(prev => [...prev, match]);
    setMatch({ ...match, events: [...match.events, event], [tk]: { ...team, timeoutsUsed: team.timeoutsUsed + 1 } });
  };

  const undo = () => { if (!undoStack.length) return; setMatch(undoStack[undoStack.length - 1]); setUndoStack(prev => prev.slice(0, -1)); };

  const nextHalf = () => {
    setTimerRunning(false);
    if (match.currentHalf === 1) { setMatch(prev => ({ ...prev, currentHalf: 2, elapsedSeconds: 0 })); }
    else if (match.currentHalf >= 2 && isTied) { setMatch(prev => ({ ...prev, currentHalf: prev.currentHalf + 1, elapsedSeconds: 0 })); }
  };

  const handleEndMatch = () => {
    setTimerRunning(false);
    if (match.currentHalf >= 2 && isTied) {
      if (confirm("Rezultat je neriješen! Želiš li produžetke (2x5min)?")) { setMatch(prev => ({ ...prev, currentHalf: 3, elapsedSeconds: 0 })); return; }
    }
    if (confirm("Završi utakmicu?")) onEnd(match);
  };

  const side = match[selectedSide === "home" ? "homeTeam" : "awayTeam"];

  if (showStats) return <LiveStats match={match} onBack={() => setShowStats(false)} />;

  // ─── ZONE PICKER OVERLAY ───
  if (zoneStep) {
    return (
      <div style={{ padding: "0 16px 100px", paddingTop: "env(safe-area-inset-top, 16px)" }}>
        {zoneStep === "fast_break" && (
          <div style={{ background: theme.surface, borderRadius: 16, padding: 20, border: `1px solid ${theme.border}`, animation: "slideUp 0.2s ease" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent, marginBottom: 4, textAlign: "center" }}>⚡ Kontranapad</div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 16, textAlign: "center" }}>#{pendingEvent?.playerNumber} {pendingEvent?.playerName} — Ishod?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {FAST_BREAK_OUTCOMES.map(o => (
                <button key={o.id} onClick={() => handleFastBreakOutcome(o.id)} style={{
                  background: o.color + "18", border: `2px solid ${o.color}55`, borderRadius: 12, padding: "16px 8px",
                  cursor: "pointer", textAlign: "center", fontFamily: font,
                }}>
                  <div style={{ fontSize: 28 }}>{o.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: o.color, marginTop: 6 }}>{o.label}</div>
                </button>
              ))}
            </div>
            <button onClick={cancelZone} style={{ ...btnSmall, width: "100%", marginTop: 12, padding: "10px 0", color: theme.textMuted }}>✕ Otkaži</button>
          </div>
        )}
        {zoneStep === "shot_zone" && (
          <div style={{ background: theme.surface, borderRadius: 16, padding: 16, border: `1px solid ${theme.border}`, animation: "slideUp 0.2s ease" }}>
            <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", marginBottom: 4 }}>#{pendingEvent?.playerNumber} {pendingEvent?.playerName}</div>
            <ShotZonePicker onSelect={handleShotZone} />
            <button onClick={() => handleShotZone("unknown", "Nepoznato")} style={{ ...btnSmall, width: "100%", marginTop: 4, padding: "8px 0", color: theme.textMuted }}>Preskoči</button>
            <button onClick={cancelZone} style={{ ...btnSmall, width: "100%", marginTop: 4, padding: "8px 0", color: theme.danger }}>✕ Otkaži</button>
          </div>
        )}
        {zoneStep === "gk_zone" && (
          <div style={{ background: theme.surface, borderRadius: 16, padding: 16, border: `1px solid ${theme.border}`, animation: "slideUp 0.2s ease" }}>
            <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", marginBottom: 4 }}>#{pendingEvent?.playerNumber} {pendingEvent?.playerName}</div>
            <GoalkeeperZonePicker onSelect={handleGkZone} />
            <button onClick={() => handleGkZone("unknown", "Nepoznato")} style={{ ...btnSmall, width: "100%", marginTop: 4, padding: "8px 0", color: theme.textMuted }}>Preskoči</button>
            <button onClick={cancelZone} style={{ ...btnSmall, width: "100%", marginTop: 4, padding: "8px 0", color: theme.danger }}>✕ Otkaži</button>
          </div>
        )}
      </div>
    );
  }

  // ─── MAIN LAYOUT ───
  return (
    <div style={{ padding: "0 12px 120px", paddingTop: "env(safe-area-inset-top, 8px)" }}>
      {/* Scoreboard */}
      <div style={{ background: `linear-gradient(135deg, ${theme.surface}, ${theme.surface2})`, borderRadius: 18, padding: isMobile ? "14px 12px" : "16px 24px", marginBottom: 12, border: `1px solid ${theme.border}` }}>
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: match.currentHalf > 2 ? theme.warning : theme.textMuted, fontWeight: 600, letterSpacing: 1 }}>{halfLabel}{match.currentHalf > 2 ? " (5 min)" : " (30 min)"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 12 : 24 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 600, color: theme.accent, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{match.homeTeam.name}</div>
            <div style={{ fontSize: isMobile ? 38 : 48, fontWeight: 900, fontFamily: mono, lineHeight: 1 }}>{match.homeTeam.score}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontFamily: mono, fontSize: isMobile ? 20 : 26, fontWeight: 700, color: timerRunning ? theme.accent : theme.textMuted, minWidth: 80, textAlign: "center" }}>{fmt(match.elapsedSeconds)}</div>
            <button onClick={() => setTimerRunning(!timerRunning)} style={{ background: timerRunning ? theme.danger + "33" : theme.success + "33", border: "none", borderRadius: 8, padding: "6px 14px", color: timerRunning ? theme.danger : theme.success, fontSize: 16, cursor: "pointer" }}>{timerRunning ? "⏸" : "▶"}</button>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 600, color: theme.accent3, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{match.awayTeam.name}</div>
            <div style={{ fontSize: isMobile ? 38 : 48, fontWeight: 900, fontFamily: mono, lineHeight: 1 }}>{match.awayTeam.score}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
          <button onClick={() => addTimeout("home")} style={{ ...btnSmall, fontSize: 10 }}>⏸ TO ({match.homeTeam.timeouts - match.homeTeam.timeoutsUsed})</button>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={undo} disabled={!undoStack.length} style={{ ...btnSmall, opacity: undoStack.length ? 1 : 0.3 }}>↩</button>
            <button onClick={() => setShowStats(true)} style={btnSmall}>📊</button>
            <button onClick={nextHalf} style={btnSmall}>⏭</button>
            <button onClick={handleEndMatch} style={{ ...btnSmall, color: theme.danger }}>🏁</button>
          </div>
          <button onClick={() => addTimeout("away")} style={{ ...btnSmall, fontSize: 10 }}>⏸ TO ({match.awayTeam.timeouts - match.awayTeam.timeoutsUsed})</button>
        </div>
      </div>

      {/* Desktop: side-by-side, Mobile: stacked */}
      <div className="live-layout">
        <div className="live-left">
          {/* Team Toggle */}
          <div style={{ display: "flex", gap: 4, background: theme.surface, borderRadius: 12, padding: 4, marginBottom: 10 }}>
            {["home", "away"].map(s => (
              <button key={s} onClick={() => { setSelectedSide(s); setSelectedPlayer(null); }} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", background: selectedSide === s ? (s === "home" ? theme.accent + "22" : theme.accent3 + "22") : "transparent", color: selectedSide === s ? (s === "home" ? theme.accent : theme.accent3) : theme.textMuted, fontFamily: font, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{match[s === "home" ? "homeTeam" : "awayTeam"].name}</button>
            ))}
          </div>

          {/* Players */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${playerColumns}, 1fr)`, gap: 6, marginBottom: 12 }}>
            {side.players.map(p => {
              const isSel = selectedPlayer?.id === p.id;
              const pe = match.events.filter(e => e.playerId === p.id);
              const goals = pe.filter(e => ["goal","penalty_goal"].includes(e.type)).length + pe.filter(e => e.type === "fast_break" && e.outcome === "goal").length;
              const sus = pe.filter(e => e.type === "suspension").length;
              return (
                <button key={p.id} onClick={() => { setSelectedPlayer(isSel ? null : p); setShowEventPanel(!isSel); }} style={{ background: isSel ? (selectedSide === "home" ? theme.accent + "22" : theme.accent3 + "22") : theme.surface, border: `1.5px solid ${isSel ? (selectedSide === "home" ? theme.accent : theme.accent3) : theme.border}`, borderRadius: 12, padding: "10px 4px", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 800, color: isSel ? (selectedSide === "home" ? theme.accent : theme.accent3) : theme.text }}>#{p.number || "?"}</div>
                  <div style={{ fontSize: 10, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 9, color: theme.textDim, marginTop: 2 }}>{p.position}</div>
                  {(goals > 0 || sus > 0) && <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
                    {goals > 0 && <span style={{ fontSize: 9, background: theme.success + "33", color: theme.success, borderRadius: 4, padding: "1px 4px", fontFamily: mono }}>⚽{goals}</span>}
                    {sus > 0 && <span style={{ fontSize: 9, background: theme.danger + "33", color: theme.danger, borderRadius: 4, padding: "1px 4px", fontFamily: mono }}>⏱{sus}</span>}
                  </div>}
                </button>
              );
            })}
          </div>

          {/* Event Panel */}
          {showEventPanel && selectedPlayer && (
            <div style={{ background: theme.surface, borderRadius: 16, padding: 14, border: `1px solid ${theme.border}`, animation: "slideUp 0.2s ease" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: selectedSide === "home" ? theme.accent : theme.accent3 }}>#{selectedPlayer.number} {selectedPlayer.name}</div>
              <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 10, paddingBottom: 4 }}>
                {EVENT_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setEventCategory(c.id)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${eventCategory === c.id ? theme.accent : theme.border}`, background: eventCategory === c.id ? theme.accent + "18" : "transparent", color: eventCategory === c.id ? theme.accent : theme.textMuted, fontFamily: font, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{c.icon} {c.label}</button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {Object.values(EVENT_TYPES).filter(e => e.category === eventCategory).map(et => (
                  <button key={et.id} onClick={() => addEvent(et)} style={{ background: et.color + "18", border: `1px solid ${et.color}44`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", textAlign: "center", fontFamily: font }}>
                    <div style={{ fontSize: 20 }}>{et.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: et.color, marginTop: 4 }}>{et.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="live-right">
          {/* Event Log */}
          <div style={{ marginTop: isDesktop ? 0 : 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Posljednji događaji</div>
            {match.events.length === 0 && <div style={{ padding: 20, textAlign: "center", color: theme.textDim, fontSize: 12 }}>Nema događaja</div>}
            {match.events.slice(isDesktop ? -12 : -6).reverse().map(ev => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: theme.surface, borderRadius: 8, marginBottom: 4, border: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: 16 }}>{ev.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{ev.label}</span>
                  {ev.outcome && <span style={{ fontSize: 9, color: theme.gold, marginLeft: 4 }}>→ {ev.outcomeLabel || ev.outcome}</span>}
                  {ev.shotZoneLabel && ev.shotZoneLabel !== "Nepoznato" && <span style={{ fontSize: 9, color: theme.accent2, marginLeft: 4 }}>📍{ev.shotZoneLabel}</span>}
                  {ev.gkZoneLabel && ev.gkZoneLabel !== "Nepoznato" && <span style={{ fontSize: 9, color: theme.accent2, marginLeft: 4 }}>🧤{ev.gkZoneLabel}</span>}
                  {ev.playerName && <span style={{ fontSize: 10, color: theme.textMuted, marginLeft: 6 }}>#{ev.playerNumber} {ev.playerName}</span>}
                </div>
                <span style={{ fontSize: 10, fontFamily: mono, color: theme.textDim }}>{fmt(ev.time)}</span>
                <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: ev.side === "home" ? theme.accent + "22" : theme.accent3 + "22", color: ev.side === "home" ? theme.accent : theme.accent3 }}>{ev.side === "home" ? "H" : "A"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
