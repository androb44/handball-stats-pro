import { useState } from 'react';
import Header from './Header';
import { theme, mono, font, thStyle, tdStyle, btnPrimary, btnSmall } from '../styles';
import { useResponsive } from '../hooks/useResponsive';
import { exportMatchPDF } from '../utils/pdfExport';

export default function LiveStats({ match, onBack }) {
  const [tab, setTab] = useState("summary");
  const [exporting, setExporting] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const handleExportPDF = async () => {
    setExporting(true);
    try { await exportMatchPDF(match); }
    catch (e) { console.error("PDF export error:", e); alert("Greška pri izvozu PDF-a."); }
    finally { setExporting(false); }
  };

  const getTeamStats = (side) => {
    const ev = match.events.filter(e => e.side === side);
    const fastBreaks = ev.filter(e => e.type === "fast_break");
    return {
      goals: ev.filter(e => ["goal","penalty_goal"].includes(e.type)).length + fastBreaks.filter(e => e.outcome === "goal").length,
      shots: ev.filter(e => ["goal","shot_missed","shot_blocked","shot_post","penalty_goal","penalty_miss"].includes(e.type)).length + fastBreaks.filter(e => e.outcome).length,
      saves: ev.filter(e => ["save","penalty_save"].includes(e.type)).length,
      assists: ev.filter(e => e.type === "assist").length,
      turnovers: ev.filter(e => e.type === "turnover").length,
      steals: ev.filter(e => e.type === "steal").length,
      blocks: ev.filter(e => e.type === "block").length,
      yellowCards: ev.filter(e => e.type === "yellow_card").length,
      redCards: ev.filter(e => e.type === "red_card").length,
      suspensions: ev.filter(e => e.type === "suspension").length,
      fastBreaks: fastBreaks.length,
      fastBreakGoals: fastBreaks.filter(e => e.outcome === "goal").length,
      breakthroughs: ev.filter(e => e.type === "breakthrough").length,
      foulsCommitted: ev.filter(e => e.type === "foul_committed").length,
      penaltyGoals: ev.filter(e => e.type === "penalty_goal").length,
      penaltyMiss: ev.filter(e => e.type === "penalty_miss").length,
    };
  };

  const getPlayerStats = (side) => {
    const tk = side === "home" ? "homeTeam" : "awayTeam";
    return match[tk].players.map(p => {
      const pe = match.events.filter(e => e.playerId === p.id);
      const fb = pe.filter(e => e.type === "fast_break");
      const goals = pe.filter(e => ["goal","penalty_goal"].includes(e.type)).length + fb.filter(e => e.outcome === "goal").length;
      const shots = pe.filter(e => ["goal","shot_missed","shot_blocked","shot_post","penalty_goal","penalty_miss"].includes(e.type)).length + fb.filter(e => e.outcome).length;
      return { ...p, goals, shots,
        assists: pe.filter(e => e.type === "assist").length,
        saves: pe.filter(e => ["save","penalty_save"].includes(e.type)).length,
        turnovers: pe.filter(e => e.type === "turnover").length,
        steals: pe.filter(e => e.type === "steal").length,
        yellowCards: pe.filter(e => e.type === "yellow_card").length,
        suspensions: pe.filter(e => e.type === "suspension").length,
        fouls: pe.filter(e => e.type === "foul_committed").length,
      };
    }).sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  };

  const hs = getTeamStats("home"), as = getTeamStats("away");
  const fmt = (s) => `${Math.floor(s/60)}'${String(s%60).padStart(2,"0")}`;

  const StatBar = ({ label, home, away }) => {
    const total = home + away || 1;
    const hStr = typeof home === "string" ? home : `${home}`;
    const aStr = typeof away === "string" ? away : `${away}`;
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
          <span style={{ fontFamily: mono, fontWeight: 700, color: theme.accent }}>{hStr}</span>
          <span style={{ color: theme.textMuted, fontWeight: 500 }}>{label}</span>
          <span style={{ fontFamily: mono, fontWeight: 700, color: theme.accent3 }}>{aStr}</span>
        </div>
        <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: theme.surface2 }}>
          <div style={{ width: `${(parseFloat(home)/total)*100}%`, background: theme.accent, transition: "width 0.3s" }} />
          <div style={{ width: `${(parseFloat(away)/total)*100}%`, background: theme.accent3, marginLeft: "auto", transition: "width 0.3s" }} />
        </div>
      </div>
    );
  };

  const effH = hs.shots ? Math.round((hs.goals / hs.shots) * 100) : 0;
  const effA = as.shots ? Math.round((as.goals / as.shots) * 100) : 0;

  return (
    <div style={{ padding: "0 12px 100px", paddingTop: "env(safe-area-inset-top, 8px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Header title="Statistika" onBack={onBack} />
        <button onClick={handleExportPDF} disabled={exporting} style={{ ...btnSmall, display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: theme.accent2 + "22", border: `1px solid ${theme.accent2}44`, color: theme.accent2, opacity: exporting ? 0.5 : 1 }}>
          {exporting ? "⏳" : "📄"} PDF
        </button>
      </div>

      <div style={{ display: "flex", gap: 4, background: theme.surface, borderRadius: 10, padding: 3, marginBottom: 14 }}>
        {[{id:"summary",label:"Pregled"},{id:"players",label:"Igrači"},{id:"timeline",label:"Timeline"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: tab === t.id ? theme.accent + "22" : "transparent", color: tab === t.id ? theme.accent : theme.textMuted, fontFamily: font, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t.label}</button>
        ))}
      </div>

      {tab === "summary" && (
        <div style={{ background: theme.surface, borderRadius: 14, padding: isMobile ? 14 : 20, border: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: theme.accent }}>{match.homeTeam.name}</span>
            <span style={{ color: theme.accent3 }}>{match.awayTeam.name}</span>
          </div>
          <StatBar label="Golovi" home={hs.goals} away={as.goals} />
          <StatBar label="Šutevi" home={hs.shots} away={as.shots} />
          {(hs.shots>0||as.shots>0) && <StatBar label="Efikasnost (%)" home={effH} away={effA} />}
          <StatBar label="Odbrane" home={hs.saves} away={as.saves} />
          <StatBar label="Asistencije" home={hs.assists} away={as.assists} />
          <StatBar label="Ukradene lopte" home={hs.steals} away={as.steals} />
          <StatBar label="Blokade" home={hs.blocks} away={as.blocks} />
          <StatBar label="Izgubljene lopte" home={hs.turnovers} away={as.turnovers} />
          <StatBar label={`Kontra (gol/ukupno)`} home={`${hs.fastBreakGoals}/${hs.fastBreaks}`} away={`${as.fastBreakGoals}/${as.fastBreaks}`} />
          <StatBar label="Prodori" home={hs.breakthroughs} away={as.breakthroughs} />
          <StatBar label="Faulovi" home={hs.foulsCommitted} away={as.foulsCommitted} />
          <StatBar label="Žuti kartoni" home={hs.yellowCards} away={as.yellowCards} />
          <StatBar label="Isključenja 2min" home={hs.suspensions} away={as.suspensions} />
          <StatBar label="Crveni kartoni" home={hs.redCards} away={as.redCards} />
          <StatBar label="7m golovi" home={hs.penaltyGoals} away={as.penaltyGoals} />
          <StatBar label="7m promašaji" home={hs.penaltyMiss} away={as.penaltyMiss} />
        </div>
      )}

      {tab === "players" && (
        <div className="stats-grid">
          {["home","away"].map(side => {
            const ps = getPlayerStats(side);
            const tn = match[side==="home"?"homeTeam":"awayTeam"].name;
            return (
              <div key={side} style={{ marginBottom: isMobile ? 16 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: side==="home"?theme.accent:theme.accent3, marginBottom: 8 }}>{tn}</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: mono }}>
                    <thead><tr style={{ color: theme.textDim }}>
                      <th style={{ textAlign: "left", padding: "6px 4px", fontWeight: 500 }}>#</th>
                      <th style={{ textAlign: "left", padding: "6px 4px", fontWeight: 500 }}>Ime</th>
                      <th style={thStyle}>G</th><th style={thStyle}>Š</th><th style={thStyle}>%</th><th style={thStyle}>A</th><th style={thStyle}>Od</th><th style={thStyle}>Uk</th><th style={thStyle}>Il</th><th style={thStyle}>F</th><th style={thStyle}>🟨</th><th style={thStyle}>⏱</th>
                    </tr></thead>
                    <tbody>{ps.map(p => (
                      <tr key={p.id} style={{ borderTop: `1px solid ${theme.border}` }}>
                        <td style={{ padding: "6px 4px", fontWeight: 700 }}>{p.number}</td>
                        <td style={{ padding: "6px 4px", fontFamily: font, fontSize: 11, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                        <td style={tdStyle}>{p.goals||""}</td><td style={tdStyle}>{p.shots||""}</td><td style={tdStyle}>{p.shots?Math.round((p.goals/p.shots)*100):""}</td><td style={tdStyle}>{p.assists||""}</td><td style={tdStyle}>{p.saves||""}</td><td style={tdStyle}>{p.steals||""}</td><td style={tdStyle}>{p.turnovers||""}</td><td style={tdStyle}>{p.fouls||""}</td><td style={tdStyle}>{p.yellowCards||""}</td><td style={tdStyle}>{p.suspensions||""}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 10, color: theme.textDim, marginTop: 4, gridColumn: isTablet || isDesktop ? "1 / -1" : undefined }}>G=Golovi Š=Šutevi %=Efikasnost A=Asist Od=Odbrane Uk=Ukradene Il=Izgubljene F=Faulovi</div>
        </div>
      )}

      {tab === "timeline" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {match.events.length === 0 && <div style={{ textAlign: "center", padding: 30, color: theme.textMuted, fontSize: 13 }}>Nema zabilježenih događaja</div>}
          {[...match.events].reverse().map(ev => (
            <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: theme.surface, borderRadius: 8, border: `1px solid ${theme.border}`, borderLeftWidth: 3, borderLeftColor: ev.side==="home"?theme.accent:theme.accent3 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: theme.textDim, minWidth: 40 }}>{fmt(ev.time)}</span>
              <span style={{ fontSize: 16 }}>{ev.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {ev.label}
                  {ev.outcome && <span style={{ fontSize: 10, color: theme.gold, marginLeft: 4 }}>→ {ev.outcomeLabel || ev.outcome}</span>}
                </div>
                {ev.playerName && <div style={{ fontSize: 10, color: theme.textMuted }}>#{ev.playerNumber} {ev.playerName}
                  {ev.shotZoneLabel && ev.shotZoneLabel !== "Nepoznato" && <span style={{ color: theme.accent2, marginLeft: 4 }}>📍{ev.shotZoneLabel}</span>}
                  {ev.gkZoneLabel && ev.gkZoneLabel !== "Nepoznato" && <span style={{ color: theme.accent2, marginLeft: 4 }}>🧤{ev.gkZoneLabel}</span>}
                </div>}
              </div>
              <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: ev.side==="home"?theme.accent+"22":theme.accent3+"22", color: ev.side==="home"?theme.accent:theme.accent3, fontWeight: 600 }}>{ev.half <= 2 ? ev.half+". pol" : "Pr. "+(ev.half-2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
