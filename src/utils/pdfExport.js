import { jsPDF } from 'jspdf';

const ZONE_SHORT = {
  lw: "LK", l6: "L6m", l9: "L9m", c6: "C6m", c9: "C9m",
  r6: "D6m", r9: "D9m", rw: "DK", "7m": "7m", unknown: "?",
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
    const goalEvents = pe.filter(isGoalEvent);
    const shotZones = {};
    goalEvents.forEach(e => { const z = e.shotZone || "unknown"; shotZones[z] = (shotZones[z] || 0) + 1; });
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
      shotZones, isGK: p.position === "GK",
    };
  }).sort((a, b) => b.goals - a.goals || b.assists - a.assists);
}

function getGKConcededZones(match, side) {
  const oppSide = side === "home" ? "away" : "home";
  const oppGoals = match.events.filter(e => e.side === oppSide && isGoalEvent(e));
  const zones = {};
  oppGoals.forEach(e => { const z = e.shotZone || "unknown"; zones[z] = (zones[z] || 0) + 1; });
  return zones;
}

function formatZoneBreakdown(zones) {
  const parts = [];
  for (const [z, count] of Object.entries(zones)) {
    if (z === "unknown" || !count) continue;
    parts.push((ZONE_SHORT[z] || z) + ": " + count);
  }
  return parts.length ? parts.join(", ") : "-";
}

// Safe font setter — only uses "bold" or "normal"
function setFont(doc, style) {
  try {
    doc.setFont("helvetica", style === "bold" ? "bold" : "normal");
  } catch (e) {
    doc.setFont("helvetica", "normal");
  }
}

export async function exportMatchPDF(match) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const H = 297;
  const mg = 15;
  let y = 0;

  function checkPage(needed) {
    if (y > H - needed) { doc.addPage(); y = mg; }
  }

  // ─── HEADER ───
  doc.setFillColor(25, 35, 55);
  doc.rect(0, 0, W, 44, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  setFont(doc, "bold");
  doc.text("HANDBALL STATS PRO", W / 2, 13, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(180, 190, 200);
  setFont(doc, "normal");
  doc.text("Izvjestaj sa utakmice", W / 2, 20, { align: "center" });

  var dateStr = "";
  try { dateStr = new Date(match.date).toLocaleDateString("sr-Latn", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
  catch (e) { dateStr = match.date; }
  doc.text(dateStr, W / 2, 26, { align: "center" });

  // Teams + Score
  doc.setFontSize(13);
  setFont(doc, "bold");
  doc.setTextColor(100, 220, 180);
  doc.text(match.homeTeam.name, 40, 35, { align: "center" });
  doc.setTextColor(255, 140, 160);
  doc.text(match.awayTeam.name, W - 40, 35, { align: "center" });

  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(String(match.homeTeam.score), W / 2 - 12, 37, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(180, 190, 200);
  doc.text(":", W / 2, 36, { align: "center" });
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(String(match.awayTeam.score), W / 2 + 12, 37, { align: "center" });

  y = 52;

  // ─── SECTION TITLE HELPER ───
  function sectionTitle(text) {
    checkPage(20);
    doc.setFillColor(235, 237, 242);
    doc.rect(mg, y, W - mg * 2, 8, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    setFont(doc, "bold");
    doc.text(text, W / 2, y + 5.5, { align: "center" });
    y += 12;
  }

  // ─── TEAM STATS ───
  sectionTitle("STATISTIKA TIMOVA");
  var hs = getTeamStats(match.events, "home");
  var as = getTeamStats(match.events, "away");

  var statRows = [
    ["Golovi", hs.goals, as.goals],
    ["Sutevi", hs.shots, as.shots],
    ["Efikasnost", hs.efficiency + "%", as.efficiency + "%"],
    ["Odbrane", hs.saves, as.saves],
    ["Asistencije", hs.assists, as.assists],
    ["Ukradene lopte", hs.steals, as.steals],
    ["Blokade", hs.blocks, as.blocks],
    ["Izgubljene lopte", hs.turnovers, as.turnovers],
    ["Kontranapadi", hs.fastBreakGoals + "/" + hs.fastBreaks, as.fastBreakGoals + "/" + as.fastBreaks],
    ["Prodori", hs.breakthroughs, as.breakthroughs],
    ["Faulovi", hs.foulsCommitted, as.foulsCommitted],
    ["Zuti kartoni", hs.yellowCards, as.yellowCards],
    ["Iskljucenja 2min", hs.suspensions, as.suspensions],
    ["Crveni kartoni", hs.redCards, as.redCards],
    ["7m golovi", hs.penaltyGoals, as.penaltyGoals],
    ["7m promasaji", hs.penaltyMiss, as.penaltyMiss],
  ];

  doc.setFontSize(9);
  for (var si = 0; si < statRows.length; si++) {
    checkPage(8);
    var row = statRows[si];
    if (si % 2 === 0) { doc.setFillColor(245, 245, 248); doc.rect(mg, y - 3.5, W - mg * 2, 6, "F"); }

    doc.setTextColor(0, 130, 90);
    setFont(doc, "bold");
    doc.text(String(row[1]), mg + 22, y, { align: "center" });

    doc.setTextColor(60, 60, 60);
    setFont(doc, "normal");
    doc.text(row[0], W / 2, y, { align: "center" });

    doc.setTextColor(190, 40, 70);
    setFont(doc, "bold");
    doc.text(String(row[2]), W - mg - 22, y, { align: "center" });

    y += 6;
  }

  y += 8;

  // ─── PLAYER STATS ───
  for (var ti = 0; ti < 2; ti++) {
    var side = ti === 0 ? "home" : "away";
    var teamName = match[side === "home" ? "homeTeam" : "awayTeam"].name;
    var teamColor = side === "home" ? [0, 130, 90] : [190, 40, 70];
    var ps = getPlayerStats(match, side);
    var gkConceded = getGKConcededZones(match, side);

    sectionTitle(teamName.toUpperCase());

    // Table header
    var cols = ["#", "Ime", "Poz", "G", "S", "%", "A", "Od", "Uk", "Il", "F", "ZK", "2m"];
    var colW = [10, 36, 12, 10, 10, 10, 12, 10, 10, 10, 10, 10, 10];
    var cx = mg;

    doc.setFontSize(7);
    setFont(doc, "bold");
    doc.setTextColor(120, 120, 120);
    for (var ci = 0; ci < cols.length; ci++) {
      doc.text(cols[ci], cx + colW[ci] / 2, y, { align: "center" });
      cx += colW[ci];
    }
    y += 1;
    doc.setDrawColor(200, 200, 200);
    doc.line(mg, y, W - mg, y);
    y += 3.5;

    // Player rows
    doc.setFontSize(7);
    for (var pi = 0; pi < ps.length; pi++) {
      var p = ps[pi];
      var hasZones = p.goals > 0 && Object.keys(p.shotZones).some(function(z) { return z !== "unknown"; });
      var hasGkZones = p.isGK && Object.keys(gkConceded).some(function(z) { return z !== "unknown"; });
      var extraH = (hasZones ? 4.5 : 0) + (hasGkZones ? 4.5 : 0);
      checkPage(6 + extraH);

      // Zebra
      if (pi % 2 === 0) {
        doc.setFillColor(245, 245, 248);
        doc.rect(mg, y - 3, W - mg * 2, 5.5 + extraH, "F");
      }

      cx = mg;
      var vals = [
        String(p.number), p.name, p.position,
        p.goals ? String(p.goals) : "-",
        p.shots ? String(p.shots) : "-",
        p.efficiency ? p.efficiency + "%" : "-",
        p.assists ? String(p.assists) : "-",
        p.saves ? String(p.saves) : "-",
        p.steals ? String(p.steals) : "-",
        p.turnovers ? String(p.turnovers) : "-",
        p.fouls ? String(p.fouls) : "-",
        p.yellowCards ? String(p.yellowCards) : "-",
        p.suspensions ? String(p.suspensions) : "-"
      ];

      for (var vi = 0; vi < vals.length; vi++) {
        if (vi === 3 && p.goals > 0) {
          setFont(doc, "bold");
          doc.setTextColor(teamColor[0], teamColor[1], teamColor[2]);
        } else {
          setFont(doc, "normal");
          doc.setTextColor(30, 30, 30);
        }
        var tx = vi === 1 ? cx + 1 : cx + colW[vi] / 2;
        var align = vi === 1 ? "left" : "center";
        doc.text(vals[vi], tx, y, { align: align });
        cx += colW[vi];
      }
      y += 5.5;

      // Shot zone line
      if (hasZones) {
        doc.setFontSize(6.5);
        setFont(doc, "normal");
        doc.setTextColor(50, 90, 160);
        doc.text("Golovi po poziciji: " + formatZoneBreakdown(p.shotZones), mg + 12, y);
        y += 4.5;
      }

      // GK conceded line
      if (hasGkZones) {
        doc.setFontSize(6.5);
        setFont(doc, "normal");
        doc.setTextColor(190, 40, 70);
        doc.text("Primljeni golovi po poziciji: " + formatZoneBreakdown(gkConceded), mg + 12, y);
        y += 4.5;
      }

      doc.setFontSize(7);
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(mg, y, W - mg, y);
    y += 10;
  }

  // ─── SHOT MAP PER TEAM ───
  var zones = ["lw", "l6", "l9", "c6", "c9", "r6", "r9", "rw", "7m"];
  var zLabels = { lw: "L.krilo", l6: "L.6m", l9: "L.9m", c6: "C.6m", c9: "C.9m", r6: "D.6m", r9: "D.9m", rw: "D.krilo", "7m": "7m" };

  for (var mi = 0; mi < 2; mi++) {
    var mSide = mi === 0 ? "home" : "away";
    var mName = match[mSide === "home" ? "homeTeam" : "awayTeam"].name;
    var mColor = mSide === "home" ? [0, 130, 90] : [190, 40, 70];

    checkPage(40);
    sectionTitle("MAPA SUTEVA - " + mName.toUpperCase());

    var teamGoals = match.events.filter(function(e) { return e.side === mSide && isGoalEvent(e); });
    var teamMisses = match.events.filter(function(e) { return e.side === mSide && ["shot_missed","shot_blocked","shot_post","penalty_miss"].includes(e.type); });

    var zGoals = {};
    var zMisses = {};
    teamGoals.forEach(function(e) { var z = e.shotZone || "unknown"; zGoals[z] = (zGoals[z] || 0) + 1; });
    teamMisses.forEach(function(e) { var z = e.shotZone || "unknown"; zMisses[z] = (zMisses[z] || 0) + 1; });

    var zcW = (W - mg * 2) / 10;

    // Header
    var zx = mg;
    doc.setFontSize(7);
    setFont(doc, "bold");
    doc.setTextColor(120, 120, 120);
    doc.text("Zona", zx + zcW / 2, y, { align: "center" });
    zx += zcW;
    for (var zi = 0; zi < zones.length; zi++) {
      doc.text(zLabels[zones[zi]], zx + zcW / 2, y, { align: "center" });
      zx += zcW;
    }
    y += 1;
    doc.setDrawColor(200, 200, 200);
    doc.line(mg, y, W - mg, y);
    y += 4;

    // Goals row
    zx = mg;
    doc.setFontSize(7.5);
    setFont(doc, "bold");
    doc.setTextColor(mColor[0], mColor[1], mColor[2]);
    doc.text("Golovi", zx + zcW / 2, y, { align: "center" });
    zx += zcW;
    for (var gi = 0; gi < zones.length; gi++) {
      var gv = zGoals[zones[gi]] || 0;
      if (gv > 0) { doc.setTextColor(mColor[0], mColor[1], mColor[2]); }
      else { doc.setTextColor(120, 120, 120); }
      doc.text(String(gv), zx + zcW / 2, y, { align: "center" });
      zx += zcW;
    }
    y += 5;

    // Misses row
    zx = mg;
    setFont(doc, "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Prom.", zx + zcW / 2, y, { align: "center" });
    zx += zcW;
    for (var mmi = 0; mmi < zones.length; mmi++) {
      var mv = zMisses[zones[mmi]] || 0;
      if (mv > 0) { doc.setTextColor(60, 60, 60); } else { doc.setTextColor(120, 120, 120); }
      doc.text(String(mv), zx + zcW / 2, y, { align: "center" });
      zx += zcW;
    }
    y += 5;

    // Efficiency row
    zx = mg;
    setFont(doc, "normal");
    doc.setTextColor(50, 90, 160);
    doc.text("Efik.", zx + zcW / 2, y, { align: "center" });
    zx += zcW;
    for (var ei = 0; ei < zones.length; ei++) {
      var eg = zGoals[zones[ei]] || 0;
      var em = zMisses[zones[ei]] || 0;
      var et = eg + em;
      var eff = et > 0 ? Math.round((eg / et) * 100) + "%" : "-";
      doc.text(eff, zx + zcW / 2, y, { align: "center" });
      zx += zcW;
    }
    y += 10;
  }

  // ─── FOOTER ───
  var pageCount = doc.internal.getNumberOfPages();
  for (var fi = 1; fi <= pageCount; fi++) {
    doc.setPage(fi);
    doc.setDrawColor(200, 200, 200);
    doc.line(mg, H - 12, W - mg, H - 12);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    setFont(doc, "normal");
    doc.text("HandballStats Pro", mg, H - 7);
    doc.text(match.homeTeam.name + " vs " + match.awayTeam.name, W / 2, H - 7, { align: "center" });
    doc.text("Stranica " + fi + "/" + pageCount, W - mg, H - 7, { align: "right" });
  }

  var filename = match.homeTeam.name + "_vs_" + match.awayTeam.name + ".pdf";
  doc.save(filename);
}
