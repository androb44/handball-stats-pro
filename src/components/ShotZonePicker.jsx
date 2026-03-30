import { theme, mono, font } from '../styles';

const SHOT_ZONES = [
  { id: "lw", label: "Lijevo krilo", x: 8, y: 35, w: 16, h: 30 },
  { id: "l6", label: "Lijeva 6m", x: 24, y: 25, w: 18, h: 22 },
  { id: "l9", label: "Lijeva 9m", x: 24, y: 5, w: 18, h: 20 },
  { id: "c6", label: "Centar 6m", x: 42, y: 25, w: 16, h: 22 },
  { id: "c9", label: "Centar 9m", x: 42, y: 5, w: 16, h: 20 },
  { id: "r6", label: "Desna 6m", x: 58, y: 25, w: 18, h: 22 },
  { id: "r9", label: "Desna 9m", x: 58, y: 5, w: 18, h: 20 },
  { id: "rw", label: "Desno krilo", x: 76, y: 35, w: 16, h: 30 },
  { id: "7m", label: "7m", x: 42, y: 47, w: 16, h: 10 },
];

export function ShotZonePicker({ onSelect, title = "Odakle je bio šut?" }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 8, textAlign: "center" }}>{title}</div>
      <div style={{ position: "relative", width: "100%", paddingBottom: "60%", background: theme.success + "0A", border: `2px solid ${theme.success}33`, borderRadius: 14, overflow: "hidden" }}>
        {/* Field markings */}
        <svg viewBox="0 0 100 60" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
          {/* Goal */}
          <rect x="38" y="55" width="24" height="5" rx="1" fill={theme.surface2} stroke={theme.border} strokeWidth="0.5" />
          <text x="50" y="59" textAnchor="middle" fill={theme.textDim} fontSize="2.5" fontFamily="Outfit">GOL</text>
          {/* 6m arc */}
          <path d="M 25 58 Q 25 30 50 28 Q 75 30 75 58" fill="none" stroke={theme.accent + "44"} strokeWidth="0.5" strokeDasharray="2,1" />
          <text x="50" y="38" textAnchor="middle" fill={theme.textDim} fontSize="2" fontFamily="Outfit">6m</text>
          {/* 9m arc */}
          <path d="M 20 58 Q 20 10 50 8 Q 80 10 80 58" fill="none" stroke={theme.accent2 + "44"} strokeWidth="0.5" strokeDasharray="2,1" />
          <text x="50" y="17" textAnchor="middle" fill={theme.textDim} fontSize="2" fontFamily="Outfit">9m</text>
          {/* 7m line */}
          <line x1="45" y1="50" x2="55" y2="50" stroke={theme.warning + "66"} strokeWidth="0.5" />
        </svg>
        {/* Clickable zones */}
        {SHOT_ZONES.map(z => (
          <button key={z.id} onClick={() => onSelect(z.id, z.label)} style={{
            position: "absolute", left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
            background: "transparent", border: `1px dashed ${theme.accent}55`, borderRadius: 6,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, color: theme.accent, fontWeight: 600, fontFamily: font,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.target.style.background = theme.accent + "22"; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; }}
          >
            {z.label.replace("Lijeva ", "L").replace("Desna ", "D").replace("Centar ", "C").replace("Lijevo ", "L").replace("Desno ", "D")}
          </button>
        ))}
      </div>
    </div>
  );
}

const GK_ZONES = [
  { id: "tl", label: "Gore lijevo", x: 0, y: 0, w: 33.3, h: 50 },
  { id: "tc", label: "Gore centar", x: 33.3, y: 0, w: 33.3, h: 50 },
  { id: "tr", label: "Gore desno", x: 66.6, y: 0, w: 33.3, h: 50 },
  { id: "bl", label: "Dolje lijevo", x: 0, y: 50, w: 33.3, h: 50 },
  { id: "bc", label: "Dolje centar", x: 33.3, y: 50, w: 33.3, h: 50 },
  { id: "br", label: "Dolje desno", x: 66.6, y: 50, w: 33.3, h: 50 },
];

export function GoalkeeperZonePicker({ onSelect, title = "Koji ugao?" }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 8, textAlign: "center" }}>{title}</div>
      <div style={{ position: "relative", width: "100%", maxWidth: 280, margin: "0 auto", paddingBottom: "40%", background: theme.surface2, border: `2px solid ${theme.accent2}55`, borderRadius: 12, overflow: "hidden" }}>
        {/* Goal frame */}
        <svg viewBox="0 0 100 55" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
          <rect x="5" y="5" width="90" height="45" rx="2" fill="none" stroke={theme.text + "33"} strokeWidth="1.5" />
          <line x1="5" y1="27.5" x2="95" y2="27.5" stroke={theme.border} strokeWidth="0.5" strokeDasharray="3,2" />
          <line x1="38.3" y1="5" x2="38.3" y2="50" stroke={theme.border} strokeWidth="0.5" strokeDasharray="3,2" />
          <line x1="71.6" y1="5" x2="71.6" y2="50" stroke={theme.border} strokeWidth="0.5" strokeDasharray="3,2" />
          {/* Net pattern */}
          {[15,25,35,45,55,65,75,85].map(x => <line key={`v${x}`} x1={x} y1="5" x2={x} y2="50" stroke={theme.border + "33"} strokeWidth="0.3" />)}
          {[12,20,28,35,42].map(y => <line key={`h${y}`} x1="5" y1={y} x2="95" y2={y} stroke={theme.border + "33"} strokeWidth="0.3" />)}
        </svg>
        {GK_ZONES.map(z => (
          <button key={z.id} onClick={() => onSelect(z.id, z.label)} style={{
            position: "absolute", left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: theme.accent2, fontWeight: 600, fontFamily: font,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.target.style.background = theme.accent2 + "22"; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; }}
          >
            {z.label.replace("Gore ", "↑").replace("Dolje ", "↓")}
          </button>
        ))}
      </div>
    </div>
  );
}

export { SHOT_ZONES, GK_ZONES };
