// PDF Export — light theme, per-player shot zones, GK zone conceded

import { jsPDF } from 'jspdf';

// ─── SHOT ZONE LABELS ───
const ZONE_SHORT = {
  lw: "LK", l6: "L6m", l9: "L9m", c6: "C6m", c9: "C9m",
  r6: "D6m", r9: "D9m", rw: "DK", "7m": "7m", unknown: "?",
};
const GK_ZONE_SHORT = {
  tl: "↑L", tc: "↑C", tr: "↑D", bl: "↓L", bc: "↓C", br: "↓D", unknown: "?",
};

function isGoalEvent(e) {
  return ["goal", "penalty_goal"].includes(e.type) || (e.type === "fast_break" && e.outcome === "goal");
}

function getTeamStats(events, side) {
  const ev = events.filter(e => e.side === side);
  const fb = ev.filter(e => e.type === "fast_break");
  const goals = ev.filter(e => ["goal","penalty_goal"].includes(e.type)).length + fb.filter(e => e.outcome === "goal").length;
  const shots = ev.filter(e => ["goal","shot_missed","shot_blocked","shot_post","penalty_goal","penalty_miss"].includes(e.type)).length + fb.filter(e => e.outcome).length;
  return {
    goals, shots,
    efficiency: shots ? Math.round((goals / shots) * 100) : 0,
    saves: ev.filter(e => ["save","penalty_save"].includes(e.type)).length,
    assists: ev.filter(e => e.type === "assist").length,
    turnovers: ev.filter(e => e.type === "turnover").length,
    steals: ev.filter(e => e.type === "steal").length,
    blocks: ev.filter(e => e.type === "block").length,
    yellowCards: ev.filter(e => e.type === "yellow_card").length,
    redCards: ev.filter(e => e.type === "red_card").length,
    suspensions: ev.filter(e => e.type === "suspension").length,
    fastBreaks: fb.length,
    fastBreakGoals: fb.filter(e => e.outcome === "goal").length,
    breakthroughs: ev.filter(e => e.type === "breakthrough").length,
    foulsCommitted: ev.filter(e => e.type === "foul_committed").length,
    penaltyGoals: ev.filter(e => e.type === "penalty_goal").length,
    penaltyMiss: ev.filter(e => e.type === "penalty_miss").length,
  };
}

function getPlayerStats(match, side) {
  const tk = side === "home" ? "homeTeam" : "awayTeam";
  return match[tk].players.map(p => {
    const pe = match.events.filter(e => e.playerId === p.id);
    const fb = pe.filter(e => e.type === "fast_break");
    const goals = pe.filter(e => ["goal","penalty_goal"].includes(e.type)).length + fb.filter(e => e.outcome === "goal").length;
    const shots = pe.filter(e => ["goal","shot_missed","shot_blocked","shot_post","penalty_goal","penalty_miss"].includes(e.type)).length + fb.filter(e => e.outcome).length;

    // Shot zone breakdown (goals only)
    const goalEvents = pe.filter(isGoalEvent);
    const shotZones = {};
    goalEvents.forEach(e => {
      const z = e.shotZone || "unknown";
      shotZones[z] = (shotZones[z] || 0) + 1;
    });

    // GK: goals conceded by zone (from opponent's shot events that have gkZone — or check opponent goal events)
    const isGK = p.position === "GK";

    return {
      number: p.number, name: p.name, position: p.position,
      goals, shots, efficiency: shots ? Math.round((goals / shots) * 100) : 0,
      assists: pe.filter(e => e.type === "assist").length,
      saves: pe.filter(e => ["save","penalty_save"].includes(e.type)).length,
      steals: pe.filter(e => e.type === "steal").length,
      turnovers: pe.filter(e => e.type === "turnover").length,
      fouls: pe.filter(e => e.type === "foul_committed").length,
      yellowCards: pe.filter(e => e.type === "yellow_card").length,
      suspensions: pe.filter(e => e.type === "suspension").length,
      shotZones, isGK,
    };
  }).sort((a, b) => b.goals - a.goals || b.assists - a.assists);
}

// Get goals conceded by the opposing team, broken down by GK zone from the save perspective
// Since we track shotZone on goals, we look at opponent goals and their shotZone
function getGKConcededZones(match, side) {
  const oppSide = side === "home" ? "away" : "home";
  const oppGoals = match.events.filter(e => e.side === oppSide && isGoalEvent(e));
  const zones = {};
  oppGoals.forEach(e => {
    const z = e.shotZone || "unknown";
    zones[z] = (zones[z] || 0) + 1;
  });
  return zones;
}

function formatZoneBreakdown(zones, labels) {
  const parts = [];
  for (const [z, count] of Object.entries(zones)) {
    if (z === "unknown" || !count) continue;
    parts.push(`${labels[z] || z}: ${count}`);
  }
  return parts.length ? parts.join(", ") : "-";
}

export async function exportMatchPDF(match) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, H = 297, mg = 15;
  let y = 0;

  const black = [30, 30, 30];
  const darkGray = [60, 60, 60];
  const midGray = [120, 120, 120];
  const lightGray = [200, 200, 200];
  const bgStripe = [245, 245, 248];
  const headerBg = [25, 35, 55];
  const homeColor = [0, 130, 90];
  const awayColor = [190, 40, 70];
  const zoneColor = [50, 90, 160];

  const checkPage = (needed) => { if (y > H - needed) { doc.addPage(); y = mg; } };

  const sectionTitle = (text, yPos) => {
    checkPage(20);
    doc.setFillColor(235, 237, 242);
    doc.roundedRect(mg, yPos, W - mg * 2, 8, 1.5, 1.5, 'F');
    doc.setTextColor(...black);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(text, W / 2, yPos + 5.5, { align: "center" });
    return yPos + 12;
  };

  // ─── HEADER ───
  doc.setFillColor(...headerBg);
  doc.rect(0, 0, W, 44, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("HANDBALL STATS PRO", W / 2, 13, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(180, 190, 200);
  doc.text("Izvjestaj sa utakmice", W / 2, 20, { align: "center" });
  doc.text(new Date(match.date).toLocaleDateString("sr-Latn", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), W / 2, 26, { align: "center" });

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 220, 180);
  doc.text(match.homeTeam.name, 40, 35, { align: "center" });
  doc.setTextColor(255, 140, 160);
  doc.text(match.awayTeam.name, W - 40, 35, { align: "center" });
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(`${match.homeTeam.score}`, W / 2 - 12, 37, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(180, 190, 200);
  doc.text(":", W / 2, 36, { align: "center" });
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(`${match.awayTeam.score}`, W / 2 + 12, 37, { align: "center" });

  y = 52;

  // ─── TEAM STATS ───
  y = sectionTitle("STATISTIKA TIMOVA", y);
  const hs = getTeamStats(match.events, "home");
  const as = getTeamStats(match.events, "away");

  const statRows = [
    ["Golovi", hs.goals, as.goals],
    ["Sutevi", hs.shots, as.shots],
    ["Efikasnost", hs.efficiency + "%", as.efficiency + "%"],
    ["Odbrane", hs.saves, as.saves],
    ["Asistencije", hs.assists, as.assists],
    ["Ukradene lopte", hs.steals, as.steals],
    ["Blokade", hs.blocks, as.blocks],
    ["Izgubljene lopte", hs.turnovers, as.turnovers],
    ["Kontranapadi", `${hs.fastBreakGoals}/${hs.fastBreaks}`, `${as.fastBreakGoals}/${as.fastBreaks}`],
    ["Prodori", hs.breakthroughs, as.breakthroughs],
    ["Faulovi", hs.foulsCommitted, as.foulsCommitted],
    ["Zuti kartoni", hs.yellowCards, as.yellowCards],
    ["Iskljucenja 2min", hs.suspensions, as.suspensions],
    ["Crveni kartoni", hs.redCards, as.redCards],
    ["7m golovi", hs.penaltyGoals, as.penaltyGoals],
    ["7m promasaji", hs.penaltyMiss, as.penaltyMiss],
  ];

  doc.setFontSize(9);
  statRows.forEach(([label, home, away], idx) => {
    checkPage(8);
    if (idx % 2 === 0) { doc.setFillColor(...bgStripe); doc.rect(mg, y - 3.5, W - mg * 2, 6, 'F'); }
    doc.setTextColor(...homeColor); doc.setFont("helvetica", "bold");
    doc.text(`${home}`, mg + 22, y, { align: "center" });
    doc.setTextColor(...darkGray); doc.setFont("helvetica", "normal");
    doc.text(label, W / 2, y, { align: "center" });
    doc.setTextColor(...awayColor); doc.setFont("helvetica", "bold");
    doc.text(`${away}`, W - mg - 22, y, { align: "center" });
    y += 6;
  });

  y += 8;

  // ─── PLAYER STATS + SHOT ZONES ───
  for (const side of ["home", "away"]) {
    const teamName = match[side === "home" ? "homeTeam" : "awayTeam"].name;
    const color = side === "home" ? homeColor : awayColor;
    const ps = getPlayerStats(match, side);
    const gkConceded = getGKConcededZones(match, side);

    y = sectionTitle(teamName.toUpperCase(), y);

    // Table header
    const cols = ["#", "Ime", "Poz", "G", "S", "%", "A", "Od", "Uk", "Il", "F", "ZK", "2m"];
    const colW = [10, 36, 12, 10, 10, 10, 12, 10, 10, 10, 10, 10, 10];
    let cx = mg;
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...midGray);
    for (let i = 0; i < cols.length; i++) { doc.text(cols[i], cx + colW[i] / 2, y, { align: "center" }); cx += colW[i]; }
    y += 1;
    doc.setDrawColor(...lightGray); doc.line(mg, y, W - mg, y);
    y += 3.5;

    // Player rows
    doc.setFontSize(7);
    for (const p of ps) {
      // Main row needs ~5.5mm, zone row needs ~4.5mm
      const hasZones = p.goals > 0 && Object.keys(p.shotZones).some(z => z !== "unknown");
      const hasGkZones = p.isGK && Object.keys(gkConceded).some(z => z !== "unknown");
      const extraRows = (hasZones ? 1 : 0) + (hasGkZones ? 1 : 0);
      checkPage(6 + extraRows * 5);

      // Zebra
      const rowH = 5.5 + extraRows * 4.5;
      if (ps.indexOf(p) % 2 === 0) { doc.setFillColor(...bgStripe); doc.rect(mg, y - 3, W - mg * 2, rowH, 'F'); }

      cx = mg;
      const vals = [p.number, p.name, p.position, p.goals || "-", p.shots || "-", p.efficiency ? p.efficiency + "%" : "-", p.assists || "-", p.saves || "-", p.steals || "-", p.turnovers || "-", p.fouls || "-", p.yellowCards || "-", p.suspensions || "-"];
      for (let i = 0; i < vals.length; i++) {
        if (i === 3 && p.goals > 0) { doc.setFont("helvetica", "bold"); doc.setTextColor(...color); }
        else { doc.setFont("helvetica", "normal"); doc.setTextColor(...black); }
        const tx = i === 1 ? cx + 1 : cx + colW[i] / 2;
        doc.text(`${vals[i]}`, tx, y, { align: i === 1 ? "left" : "center" });
        cx += colW[i];
      }
      y += 5.5;

      // Shot zone breakdown line
      if (hasZones) {
        const zoneStr = formatZoneBreakdown(p.shotZones, ZONE_SHORT);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...zoneColor);
        doc.text(`Golovi po poziciji: ${zoneStr}`, mg + 12, y, { align: "left" });
        y += 4.5;
      }

      // GK conceded zones line
      if (hasGkZones) {
        const gkStr = formatZoneBreakdown(gkConceded, ZONE_SHORT);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...awayColor);
        doc.text(`Primljeni golovi po poziciji: ${gkStr}`, mg + 12, y, { align: "left" });
        y += 4.5;
      }
    }

    // Bottom border
    doc.setDrawColor(...lightGray); doc.line(mg, y, W - mg, y);
    y += 10;
  }

  // ─── SHOT MAP SUMMARY (per team) ───
  for (const side of ["home", "away"]) {
    checkPage(50);
    const teamName = match[side === "home" ? "homeTeam" : "awayTeam"].name;
    const color = side === "home" ? homeColor : awayColor;

    y = sectionTitle(`MAPA SUTEVA — ${teamName.toUpperCase()}`, y);

    // Collect all goals by zone for this team
    const teamGoals = match.events.filter(e => e.side === side && isGoalEvent(e));
    const teamMisses = match.events.filter(e => e.side === side && ["shot_missed","shot_blocked","shot_post","penalty_miss"].includes(e.type));

    const zoneGoals = {};
    const zoneMisses = {};
    teamGoals.forEach(e => { const z = e.shotZone || "unknown"; zoneGoals[z] = (zoneGoals[z] || 0) + 1; });
    teamMisses.forEach(e => { const z = e.shotZone || "unknown"; zoneMisses[z] = (zoneMisses[z] || 0) + 1; });

    // Draw zone table
    const zones = ["lw", "l6", "l9", "c6", "c9", "r6", "r9", "rw", "7m"];
    const zoneLabels = { lw: "L. krilo", l6: "L. 6m", l9: "L. 9m", c6: "C. 6m", c9: "C. 9m", r6: "D. 6m", r9: "D. 9m", rw: "D. krilo", "7m": "7m" };

    // Header
    const zcW = (W - mg * 2) / 10;
    let zx = mg;
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...midGray);
    doc.text("Zona", zx + zcW / 2, y, { align: "center" });
    zx += zcW;
    for (const z of zones) { doc.text(zoneLabels[z], zx + zcW / 2, y, { align: "center" }); zx += zcW; }
    y += 1;
    doc.setDrawColor(...lightGray); doc.line(mg, y, W - mg, y);
    y += 4;

    // Goals row
    zx = mg;
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...color);
    doc.text("Golovi", zx + zcW / 2, y, { align: "center" });
    zx += zcW;
    for (const z of zones) {
      const v = zoneGoals[z] || 0;
      doc.setTextColor(v > 0 ? [...color] : [...midGray]);
      doc.text(`${v}`, zx + zcW / 2, y, { align: "center" });
      zx += zcW;
    }
    y += 5;

    // Misses row
    zx = mg;
    doc.setFont("helvetica", "normal"); doc.setTextColor(...darkGray);
    doc.text("Prom.", zx + zcW / 2, y, { align: "center" });
    zx += zcW;
    for (const z of zones) {
      const v = zoneMisses[z] || 0;
      doc.setTextColor(v > 0 ? [...darkGray] : [...midGray]);
      doc.text(`${v}`, zx + zcW / 2, y, { align: "center" });
      zx += zcW;
    }
    y += 5;

    // Efficiency row
    zx = mg;
    doc.setFont("helvetica", "normal"); doc.setTextColor(...zoneColor);
    doc.text("Efik.", zx + zcW / 2, y, { align: "center" });
    zx += zcW;
    for (const z of zones) {
      const g = zoneGoals[z] || 0;
      const m = zoneMisses[z] || 0;
      const total = g + m;
      const eff = total > 0 ? Math.round((g / total) * 100) + "%" : "-";
      doc.text(eff, zx + zcW / 2, y, { align: "center" });
      zx += zcW;
    }
    y += 10;
  }

  // ─── FOOTER ───
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...lightGray); doc.line(mg, H - 12, W - mg, H - 12);
    doc.setFontSize(7); doc.setTextColor(...midGray); doc.setFont("helvetica", "normal");
    doc.text("HandballStats Pro", mg, H - 7);
    doc.text(`${match.homeTeam.name} vs ${match.awayTeam.name}`, W / 2, H - 7, { align: "center" });
    doc.text(`Stranica ${i}/${pageCount}`, W - mg, H - 7, { align: "right" });
  }

  const filename = `${match.homeTeam.name}_vs_${match.awayTeam.name}_${new Date(match.date).toLocaleDateString("sr-Latn").replace(/\./g, "-")}.pdf`;
  doc.save(filename);
}
