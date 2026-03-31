import { jsPDF } from 'jspdf';

// ─── Zone mappings ───
const SHOT_ZONES_ORDER = ["l9", "l6", "c9", "c6", "r9", "r6", "lw", "rw", "7m"];
const ZONE_COL_LABEL = { l9: "9m", l6: "6m", c9: "9m", c6: "6m", r9: "9m", r6: "6m", lw: "Wing", rw: "Wing", "7m": "7m" };
// Aggregated position columns for IHF table
const POS_COLS = [
  { id: "9m", label: "9m", zones: ["l9", "c9", "r9"] },
  { id: "6m", label: "6m", zones: ["l6", "c6", "r6"] },
  { id: "wing", label: "Wing", zones: ["lw", "rw"] },
  { id: "7m", label: "7m", zones: ["7m"] },
  { id: "fb", label: "FB", zones: [] }, // fast break — tracked via event type
  { id: "brk", label: "Brk.", zones: [] }, // breakthrough — tracked via event type
];

// GK goal zones (2x3 grid on goal)
const GK_ZONES = ["tl", "tc", "tr", "bl", "bc", "br"];
const GK_ZONE_POS = {
  tl: { x: 0, y: 0 }, tc: { x: 1, y: 0 }, tr: { x: 2, y: 0 },
  bl: { x: 0, y: 1 }, bc: { x: 1, y: 1 }, br: { x: 2, y: 1 },
};

function isGoalEvent(e) {
  return ["goal", "penalty_goal"].includes(e.type) || (e.type === "fast_break" && e.outcome === "goal");
}

function isShotEvent(e) {
  return ["goal", "shot_missed", "shot_blocked", "shot_post", "penalty_goal", "penalty_miss"].includes(e.type) ||
    (e.type === "fast_break" && e.outcome);
}

function sf(doc, style) {
  try { doc.setFont("helvetica", style === "bold" ? "bold" : "normal"); } catch (e) { doc.setFont("helvetica", "normal"); }
}

function getPlayerData(match, side) {
  var tk = side === "home" ? "homeTeam" : "awayTeam";
  return match[tk].players.map(function(p) {
    var pe = match.events.filter(function(e) { return e.playerId === p.id; });
    var fb = pe.filter(function(e) { return e.type === "fast_break"; });
    var brk = pe.filter(function(e) { return e.type === "breakthrough"; });

    // Goals/shots by zone
    var goalsByZone = {};
    var shotsByZone = {};
    pe.filter(isGoalEvent).forEach(function(e) { var z = e.shotZone || "unknown"; goalsByZone[z] = (goalsByZone[z] || 0) + 1; });
    pe.filter(isShotEvent).forEach(function(e) { var z = e.shotZone || "unknown"; shotsByZone[z] = (shotsByZone[z] || 0) + 1; });

    // Fast break goals/shots
    var fbGoals = fb.filter(function(e) { return e.outcome === "goal"; }).length;
    var fbShots = fb.filter(function(e) { return e.outcome; }).length;

    var totalGoals = pe.filter(isGoalEvent).length;
    var totalShots = pe.filter(isShotEvent).length;

    // Aggregated by position column
    function zoneGoals(zones) { var s = 0; zones.forEach(function(z) { s += (goalsByZone[z] || 0); }); return s; }
    function zoneShots(zones) { var s = 0; zones.forEach(function(z) { s += (shotsByZone[z] || 0); }); return s; }

    return {
      number: p.number, name: p.name, position: p.position, isGK: p.position === "GK",
      totalGoals: totalGoals, totalShots: totalShots,
      eff: totalShots ? Math.round((totalGoals / totalShots) * 100) : 0,
      g9m: zoneGoals(["l9","c9","r9"]), s9m: zoneShots(["l9","c9","r9"]),
      g6m: zoneGoals(["l6","c6","r6"]), s6m: zoneShots(["l6","c6","r6"]),
      gWing: zoneGoals(["lw","rw"]), sWing: zoneShots(["lw","rw"]),
      g7m: zoneGoals(["7m"]), s7m: zoneShots(["7m"]),
      gFB: fbGoals, sFB: fbShots,
      gBrk: 0, sBrk: 0, // breakthrough tracked separately if needed
      assists: pe.filter(function(e) { return e.type === "assist"; }).length,
      steals: pe.filter(function(e) { return e.type === "steal"; }).length,
      blocks: pe.filter(function(e) { return e.type === "block"; }).length,
      turnovers: pe.filter(function(e) { return e.type === "turnover"; }).length,
      fouls: pe.filter(function(e) { return e.type === "foul_committed"; }).length,
      yellowCards: pe.filter(function(e) { return e.type === "yellow_card"; }).length,
      suspensions: pe.filter(function(e) { return e.type === "suspension"; }).length,
      saves: pe.filter(function(e) { return ["save","penalty_save"].includes(e.type); }).length,
      goalsByZone: goalsByZone, shotsByZone: shotsByZone,
    };
  });
}

function getTeamStats(events, side) {
  var ev = events.filter(function(e) { return e.side === side; });
  var fb = ev.filter(function(e) { return e.type === "fast_break"; });
  var goals = ev.filter(isGoalEvent).length;
  var shots = ev.filter(isShotEvent).length;
  return {
    goals: goals, shots: shots, efficiency: shots ? Math.round((goals / shots) * 100) : 0,
    saves: ev.filter(function(e) { return ["save","penalty_save"].includes(e.type); }).length,
    assists: ev.filter(function(e) { return e.type === "assist"; }).length,
    turnovers: ev.filter(function(e) { return e.type === "turnover"; }).length,
    steals: ev.filter(function(e) { return e.type === "steal"; }).length,
    blocks: ev.filter(function(e) { return e.type === "block"; }).length,
    yellowCards: ev.filter(function(e) { return e.type === "yellow_card"; }).length,
    redCards: ev.filter(function(e) { return e.type === "red_card"; }).length,
    suspensions: ev.filter(function(e) { return e.type === "suspension"; }).length,
    fastBreaks: fb.length,
    fastBreakGoals: fb.filter(function(e) { return e.outcome === "goal"; }).length,
    breakthroughs: ev.filter(function(e) { return e.type === "breakthrough"; }).length,
    foulsCommitted: ev.filter(function(e) { return e.type === "foul_committed"; }).length,
    penaltyGoals: ev.filter(function(e) { return e.type === "penalty_goal"; }).length,
    penaltyMiss: ev.filter(function(e) { return e.type === "penalty_miss"; }).length,
  };
}

// ─── Draw goal frame with zone numbers ───
function drawGoalDiagram(doc, x, y, w, h, zoneData, title) {
  // zoneData = { tl: "2/3", tc: "0/1", ... }
  var cellW = w / 3;
  var cellH = h / 2;

  sf(doc, "bold");
  doc.setFontSize(7);
  doc.setTextColor(30, 30, 30);
  doc.text(title, x + w / 2, y - 2, { align: "center" });

  // Goal frame
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.5);
  doc.rect(x, y, w, h);

  // Grid lines
  doc.setLineWidth(0.2);
  doc.setDrawColor(150, 150, 150);
  doc.line(x + cellW, y, x + cellW, y + h);
  doc.line(x + cellW * 2, y, x + cellW * 2, y + h);
  doc.line(x, y + cellH, x + w, y + cellH);

  // Zone values
  doc.setFontSize(7);
  var zones = [["tl","tc","tr"],["bl","bc","br"]];
  for (var row = 0; row < 2; row++) {
    for (var col = 0; col < 3; col++) {
      var zid = zones[row][col];
      var val = zoneData[zid] || "0/0";
      var cx = x + col * cellW + cellW / 2;
      var cy = y + row * cellH + cellH / 2 + 1;

      // Color based on goals
      var parts = val.split("/");
      var gv = parseInt(parts[0]) || 0;
      if (gv > 0) {
        sf(doc, "bold");
        doc.setTextColor(0, 130, 90);
      } else {
        sf(doc, "normal");
        doc.setTextColor(120, 120, 120);
      }
      doc.text(val, cx, cy, { align: "center" });
    }
  }
}

// ─── Draw shot map (half-court view) ───
function drawShotMap(doc, x, y, w, h, zoneData, title) {
  sf(doc, "bold");
  doc.setFontSize(7);
  doc.setTextColor(30, 30, 30);
  doc.text(title, x + w / 2, y - 2, { align: "center" });

  // Court outline
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h);

  // Goal at bottom
  var goalW = w * 0.4;
  var goalX = x + (w - goalW) / 2;
  doc.setFillColor(220, 220, 220);
  doc.rect(goalX, y + h - 3, goalW, 3, "F");
  doc.setFontSize(5);
  doc.setTextColor(100, 100, 100);
  sf(doc, "normal");
  doc.text("GOL", x + w / 2, y + h - 0.5, { align: "center" });

  // 6m arc (simplified as line)
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  var arc6y = y + h * 0.6;
  doc.line(x + w * 0.2, arc6y, x + w * 0.8, arc6y);
  doc.setFontSize(4);
  doc.text("6m", x + w / 2, arc6y - 1, { align: "center" });

  // 9m arc
  var arc9y = y + h * 0.3;
  doc.line(x + w * 0.1, arc9y, x + w * 0.9, arc9y);
  doc.text("9m", x + w / 2, arc9y - 1, { align: "center" });

  // Zone positions on court {zone: {px, py}} relative to court
  var zonePos = {
    lw:  { px: 0.08, py: 0.65 }, rw:  { px: 0.92, py: 0.65 },
    l6:  { px: 0.28, py: 0.55 }, c6:  { px: 0.50, py: 0.55 }, r6:  { px: 0.72, py: 0.55 },
    l9:  { px: 0.25, py: 0.20 }, c9:  { px: 0.50, py: 0.20 }, r9:  { px: 0.75, py: 0.20 },
    "7m": { px: 0.50, py: 0.78 },
  };

  doc.setFontSize(6);
  var allZones = ["lw","rw","l6","c6","r6","l9","c9","r9","7m"];
  for (var i = 0; i < allZones.length; i++) {
    var zid = allZones[i];
    var pos = zonePos[zid];
    var val = zoneData[zid] || "0/0";
    var zx = x + pos.px * w;
    var zy = y + pos.py * h;

    var parts = val.split("/");
    var gv = parseInt(parts[0]) || 0;
    if (gv > 0) {
      sf(doc, "bold");
      doc.setTextColor(0, 130, 90);
    } else {
      sf(doc, "normal");
      doc.setTextColor(150, 150, 150);
    }
    doc.text(val, zx, zy, { align: "center" });
  }
}

export async function exportMatchPDF(match) {
  var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  var W = 210, H = 297, mg = 12;
  var y = 0;

  function checkPage(n) { if (y > H - n) { doc.addPage(); y = mg; } }

  // ─── HEADER ───
  doc.setFillColor(25, 35, 55);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  sf(doc, "bold");
  doc.text("Match Team Statistics", W / 2, 12, { align: "center" });

  doc.setFontSize(18);
  doc.text(match.homeTeam.name + "  " + match.homeTeam.score + " - " + match.awayTeam.score + "  " + match.awayTeam.name, W / 2, 24, { align: "center" });

  doc.setFontSize(8);
  sf(doc, "normal");
  doc.setTextColor(180, 190, 200);
  var dateStr = "";
  try { dateStr = new Date(match.date).toLocaleDateString("sr-Latn", { year: "numeric", month: "long", day: "numeric" }); } catch(e) { dateStr = match.date; }
  doc.text(dateStr, W / 2, 32, { align: "center" });

  y = 44;

  // ─── FOR EACH TEAM ───
  for (var ti = 0; ti < 2; ti++) {
    var side = ti === 0 ? "home" : "away";
    var teamName = match[side === "home" ? "homeTeam" : "awayTeam"].name;
    var teamColor = side === "home" ? [0, 130, 90] : [190, 40, 70];
    var players = getPlayerData(match, side);
    var fieldPlayers = players.filter(function(p) { return !p.isGK; });
    var goalkeepers = players.filter(function(p) { return p.isGK; });

    // ─── TEAM HEADER ───
    checkPage(80);
    doc.setFillColor(teamColor[0], teamColor[1], teamColor[2]);
    doc.rect(mg, y, W - mg * 2, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    sf(doc, "bold");
    doc.text(teamName, W / 2, y + 5, { align: "center" });
    y += 10;

    // ─── PLAYERS TABLE (IHF style) ───
    // Cols: #, Name, Tot, %, 9m, 6m, Wing, 7m, FB, Brk, As, TF, St, Blk, YC, 2m
    var pCols = ["#", "Ime", "Tot.", "%", "9m", "6m", "Wing", "7m", "FB", "Brk", "As", "TF", "St", "Blk", "YC", "2m"];
    var pW = [8, 30, 14, 10, 14, 14, 14, 14, 14, 14, 8, 8, 8, 8, 8, 8];
    var tableW = 0;
    for (var wi = 0; wi < pW.length; wi++) tableW += pW[wi];
    var tableX = mg;

    // Header row
    doc.setFillColor(235, 237, 242);
    doc.rect(tableX, y, tableW, 5, "F");
    doc.setFontSize(5.5);
    sf(doc, "bold");
    doc.setTextColor(60, 60, 60);
    var cx = tableX;
    for (var ci = 0; ci < pCols.length; ci++) {
      doc.text(pCols[ci], cx + pW[ci] / 2, y + 3.5, { align: "center" });
      cx += pW[ci];
    }
    y += 5.5;

    doc.setDrawColor(200, 200, 200);
    doc.line(tableX, y - 0.5, tableX + tableW, y - 0.5);

    // Sub-headers for goals/shots columns
    doc.setFillColor(245, 246, 250);
    doc.rect(tableX, y, tableW, 3.5, "F");
    doc.setFontSize(4.5);
    sf(doc, "normal");
    doc.setTextColor(120, 120, 120);
    cx = tableX;
    var subHeaders = ["", "", "G/S", "", "G/S", "G/S", "G/S", "G/S", "G/S", "G/S", "", "", "", "", "", ""];
    for (var si = 0; si < subHeaders.length; si++) {
      if (subHeaders[si]) doc.text(subHeaders[si], cx + pW[si] / 2, y + 2.5, { align: "center" });
      cx += pW[si];
    }
    y += 4;

    // Player rows
    doc.setFontSize(5.5);
    for (var pi = 0; pi < fieldPlayers.length; pi++) {
      checkPage(6);
      var p = fieldPlayers[pi];
      if (pi % 2 === 0) { doc.setFillColor(250, 250, 252); doc.rect(tableX, y - 2.5, tableW, 5, "F"); }

      cx = tableX;
      var vals = [
        String(p.number),
        p.name,
        p.totalGoals + "/" + p.totalShots,
        p.eff ? String(p.eff) : "",
        p.s9m ? p.g9m + "/" + p.s9m : "",
        p.s6m ? p.g6m + "/" + p.s6m : "",
        p.sWing ? p.gWing + "/" + p.sWing : "",
        p.s7m ? p.g7m + "/" + p.s7m : "",
        p.sFB ? p.gFB + "/" + p.sFB : "",
        p.sBrk ? p.gBrk + "/" + p.sBrk : "",
        p.assists ? String(p.assists) : "",
        p.turnovers ? String(p.turnovers) : "",
        p.steals ? String(p.steals) : "",
        p.blocks ? String(p.blocks) : "",
        p.yellowCards ? String(p.yellowCards) : "",
        p.suspensions ? String(p.suspensions) : "",
      ];

      for (var vi = 0; vi < vals.length; vi++) {
        if (vi === 2 && p.totalGoals > 0) { sf(doc, "bold"); doc.setTextColor(teamColor[0], teamColor[1], teamColor[2]); }
        else { sf(doc, "normal"); doc.setTextColor(30, 30, 30); }
        var tx = vi === 1 ? cx + 1 : cx + pW[vi] / 2;
        doc.text(vals[vi], tx, y, { align: vi === 1 ? "left" : "center" });
        cx += pW[vi];
      }
      y += 5;
    }

    // TOTAL row
    checkPage(6);
    doc.setFillColor(235, 237, 242);
    doc.rect(tableX, y - 2.5, tableW, 5, "F");
    sf(doc, "bold");
    doc.setTextColor(teamColor[0], teamColor[1], teamColor[2]);
    doc.setFontSize(5.5);
    cx = tableX;
    var ts = getTeamStats(match.events, side);
    doc.text("UKUPNO", cx + pW[0] / 2 + pW[1] / 2, y, { align: "center" });
    cx = tableX + pW[0] + pW[1];
    doc.text(ts.goals + "/" + ts.shots, cx + pW[2] / 2, y, { align: "center" });
    cx += pW[2];
    doc.text(String(ts.efficiency), cx + pW[3] / 2, y, { align: "center" });
    y += 8;

    // ─── GOALKEEPERS TABLE ───
    checkPage(30);
    doc.setFillColor(235, 237, 242);
    doc.rect(tableX, y, tableW, 5, "F");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    sf(doc, "bold");
    doc.text("Golmani — Odbrane / sutevi", tableX + 3, y + 3.5);
    y += 6;

    var gkCols = ["#", "Ime", "Tot.", "%", "9m", "6m", "Wing", "7m", "FB", "Brk"];
    var gkW = [8, 30, 14, 10, 14, 14, 14, 14, 14, 14];

    // GK header
    doc.setFontSize(5.5);
    sf(doc, "bold");
    doc.setTextColor(60, 60, 60);
    cx = tableX;
    for (var gi = 0; gi < gkCols.length; gi++) {
      doc.text(gkCols[gi], cx + gkW[gi] / 2, y, { align: "center" });
      cx += gkW[gi];
    }
    y += 1;
    doc.setDrawColor(200, 200, 200);
    doc.line(tableX, y, tableX + tableW, y);
    y += 3;

    for (var gki = 0; gki < goalkeepers.length; gki++) {
      checkPage(6);
      var gk = goalkeepers[gki];
      sf(doc, "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(5.5);
      cx = tableX;
      var gkVals = [
        String(gk.number), gk.name,
        gk.saves + "/" + (gk.saves + gk.totalGoals),
        (gk.saves + gk.totalGoals) > 0 ? String(Math.round(gk.saves / (gk.saves + gk.totalGoals) * 100)) : "",
        "", "", "", "", "", "", // GK saves by zone would go here
      ];
      for (var gvi = 0; gvi < gkVals.length; gvi++) {
        var gtx = gvi === 1 ? cx + 1 : cx + gkW[Math.min(gvi, gkW.length-1)] / 2;
        doc.text(gkVals[gvi], gtx, y, { align: gvi === 1 ? "left" : "center" });
        cx += gkW[Math.min(gvi, gkW.length-1)];
      }
      y += 5;
    }
    y += 6;

    // ─── SHOT DISTRIBUTION DIAGRAM ───
    checkPage(55);
    // Shot map (half court)
    var teamGoals = {};
    var teamShots = {};
    match.events.filter(function(e) { return e.side === side; }).forEach(function(e) {
      var z = e.shotZone || "unknown";
      if (isGoalEvent(e)) teamGoals[z] = (teamGoals[z] || 0) + 1;
      if (isShotEvent(e)) teamShots[z] = (teamShots[z] || 0) + 1;
    });
    var shotMapData = {};
    ["lw","rw","l6","c6","r6","l9","c9","r9","7m"].forEach(function(z) {
      shotMapData[z] = (teamGoals[z] || 0) + "/" + (teamShots[z] || 0);
    });

    drawShotMap(doc, mg, y, 80, 45, shotMapData, "Sutevi po poziciji — " + teamName);

    // GK conceded diagram (goal frame)
    var oppSide = side === "home" ? "away" : "home";
    var oppGoals = match.events.filter(function(e) { return e.side === oppSide && isGoalEvent(e); });
    var oppShots = match.events.filter(function(e) { return e.side === oppSide && isShotEvent(e); });
    var gkZoneData = {};
    GK_ZONES.forEach(function(z) {
      var g = 0, s = 0;
      oppGoals.forEach(function(e) { if ((e.shotZone || "unknown") === z) g++; }); // Note: we don't track gk save zones this way
      gkZoneData[z] = String(g);
    });
    // Simple conceded display
    var gkFrameData = {};
    GK_ZONES.forEach(function(z) {
      var conceded = 0;
      oppGoals.forEach(function(e) { /* We'd need gkZone on opponent shots — skip for now */ });
      gkFrameData[z] = "0/0";
    });

    // Shooting statistics table (IHF style)
    var ssX = mg + 95;
    sf(doc, "bold");
    doc.setFontSize(7);
    doc.setTextColor(30, 30, 30);
    doc.text("Shooting statistics", ssX + 40, y - 2, { align: "center" });

    var ssColW = [22, 10, 10, 10, 10, 10, 10];
    var ssHeaders = ["Position", "Goals", "Sav.", "Miss.", "Total", "%"];

    doc.setFillColor(235, 237, 242);
    doc.rect(ssX, y, 82, 4.5, "F");
    doc.setFontSize(5.5);
    sf(doc, "bold");
    doc.setTextColor(60, 60, 60);
    var ssx = ssX;
    for (var shi = 0; shi < ssHeaders.length; shi++) {
      doc.text(ssHeaders[shi], ssx + ssColW[shi] / 2, y + 3, { align: "center" });
      ssx += ssColW[shi];
    }
    y += 5;

    // Compute shooting stats by position
    var positions = [
      { label: "Back (9m)", zones: ["l9","c9","r9"] },
      { label: "Line (6m)", zones: ["l6","c6","r6"] },
      { label: "Wing", zones: ["lw","rw"] },
      { label: "7m penalties", zones: ["7m"] },
    ];

    var sideEvents = match.events.filter(function(e) { return e.side === side; });

    doc.setFontSize(5.5);
    sf(doc, "normal");
    var totalG = 0, totalSav = 0, totalMiss = 0, totalAll = 0;

    for (var spi = 0; spi < positions.length; spi++) {
      var pos = positions[spi];
      var g = 0, sav = 0, miss = 0;
      sideEvents.forEach(function(e) {
        var z = e.shotZone || "unknown";
        if (!pos.zones.includes(z)) return;
        if (isGoalEvent(e)) g++;
        else if (["save","penalty_save"].includes(e.type)) sav++;
        else if (isShotEvent(e)) miss++;
      });
      // Also count opponent saves against us from these zones
      var oppSaves = match.events.filter(function(e) { return e.side !== side && ["save","penalty_save"].includes(e.type); });
      var total = g + sav + miss;
      var eff = total > 0 ? Math.round((g / total) * 100) : 0;

      totalG += g; totalMiss += miss; totalAll += total;

      doc.setTextColor(30, 30, 30);
      ssx = ssX;
      var ssVals = [pos.label, String(g), String(sav), String(miss), String(total), total > 0 ? String(eff) : "-"];
      for (var ssvi = 0; ssvi < ssVals.length; ssvi++) {
        doc.text(ssVals[ssvi], ssx + ssColW[ssvi] / 2, y + 2, { align: "center" });
        ssx += ssColW[ssvi];
      }
      y += 4.5;
    }

    // FB + Brk rows
    var fbEvents = sideEvents.filter(function(e) { return e.type === "fast_break" && e.outcome; });
    var fbG = fbEvents.filter(function(e) { return e.outcome === "goal"; }).length;
    ssx = ssX;
    doc.text("Fastbreak", ssx + ssColW[0] / 2, y + 2, { align: "center" }); ssx += ssColW[0];
    doc.text(String(fbG), ssx + ssColW[1] / 2, y + 2, { align: "center" }); ssx += ssColW[1];
    doc.text(String(fbEvents.filter(function(e) { return e.outcome === "save"; }).length), ssx + ssColW[2] / 2, y + 2, { align: "center" }); ssx += ssColW[2];
    doc.text(String(fbEvents.filter(function(e) { return e.outcome === "miss"; }).length), ssx + ssColW[3] / 2, y + 2, { align: "center" }); ssx += ssColW[3];
    doc.text(String(fbEvents.length), ssx + ssColW[4] / 2, y + 2, { align: "center" }); ssx += ssColW[4];
    doc.text(fbEvents.length > 0 ? String(Math.round((fbG / fbEvents.length) * 100)) : "-", ssx + ssColW[5] / 2, y + 2, { align: "center" });
    y += 4.5;

    // Total row
    doc.setFillColor(235, 237, 242);
    doc.rect(ssX, y - 1, 82, 5, "F");
    sf(doc, "bold");
    doc.setTextColor(teamColor[0], teamColor[1], teamColor[2]);
    ssx = ssX;
    doc.text("Total", ssx + ssColW[0] / 2, y + 2.5, { align: "center" }); ssx += ssColW[0];
    doc.text(String(ts.goals), ssx + ssColW[1] / 2, y + 2.5, { align: "center" });
    y += 10;

    y += 5;
  }

  // ─── FOOTER ───
  var pageCount = doc.internal.getNumberOfPages();
  for (var fi = 1; fi <= pageCount; fi++) {
    doc.setPage(fi);
    doc.setDrawColor(200, 200, 200);
    doc.line(mg, H - 10, W - mg, H - 10);
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    sf(doc, "normal");
    doc.text("HandballStats Pro", mg, H - 6);
    doc.text(match.homeTeam.name + " vs " + match.awayTeam.name, W / 2, H - 6, { align: "center" });
    doc.text("Str. " + fi + "/" + pageCount, W - mg, H - 6, { align: "right" });
  }

  var filename = match.homeTeam.name + "_vs_" + match.awayTeam.name + ".pdf";
  doc.save(filename);
}
