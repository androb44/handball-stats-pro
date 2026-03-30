let jsPDFModule = null;

async function loadJsPDF() {
  if (jsPDFModule) return jsPDFModule;
  return new Promise((resolve, reject) => {
    if (window.jspdf) { jsPDFModule = window.jspdf; resolve(jsPDFModule); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => { jsPDFModule = window.jspdf; resolve(jsPDFModule); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
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
    };
  }).sort((a, b) => b.goals - a.goals || b.assists - a.assists);
}

export async function exportMatchPDF(match) {
  const lib = await loadJsPDF();
  const doc = new lib.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, H = 297, mg = 15;
  let y = 0;

  // LIGHT THEME COLORS
  const black = [30, 30, 30];
  const darkGray = [60, 60, 60];
  const midGray = [120, 120, 120];
  const lightGray = [200, 200, 200];
  const bgStripe = [245, 245, 248];
  const headerBg = [25, 35, 55];
  const homeColor = [0, 130, 90];
  const awayColor = [190, 40, 70];

  // ─── HEADER (dark bar) ───
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

  // Teams + Score in header
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

  // ─── Section title helper ───
  const sectionTitle = (text, yPos) => {
    doc.setFillColor(235, 237, 242);
    doc.roundedRect(mg, yPos, W - mg * 2, 8, 1.5, 1.5, 'F');
    doc.setTextColor(...black);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(text, W / 2, yPos + 5.5, { align: "center" });
    return yPos + 12;
  };

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
    if (y > H - 20) { doc.addPage(); y = mg; }
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

  // ─── PLAYER STATS ───
  for (const side of ["home", "away"]) {
    if (y > H - 50) { doc.addPage(); y = mg; }
    const teamName = match[side === "home" ? "homeTeam" : "awayTeam"].name;
    const color = side === "home" ? homeColor : awayColor;
    const ps = getPlayerStats(match, side);

    y = sectionTitle(teamName.toUpperCase(), y);

    const cols = ["#", "Ime", "Poz", "G", "A", "S", "%", "Od", "Uk", "Il", "F", "ZK", "2m"];
    const colW = [10, 36, 12, 10, 10, 10, 12, 10, 10, 10, 10, 10, 10];
    let cx = mg;

    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...midGray);
    for (let i = 0; i < cols.length; i++) { doc.text(cols[i], cx + colW[i] / 2, y, { align: "center" }); cx += colW[i]; }
    y += 1;
    doc.setDrawColor(...lightGray); doc.line(mg, y, W - mg, y);
    y += 3.5;

    doc.setFontSize(7);
    ps.forEach((p, idx) => {
      if (y > H - 15) { doc.addPage(); y = mg; }
      if (idx % 2 === 0) { doc.setFillColor(...bgStripe); doc.rect(mg, y - 3, W - mg * 2, 5.5, 'F'); }
      cx = mg;
      const vals = [p.number, p.name, p.position, p.goals || "-", p.assists || "-", p.shots || "-", p.efficiency ? p.efficiency + "%" : "-", p.saves || "-", p.steals || "-", p.turnovers || "-", p.fouls || "-", p.yellowCards || "-", p.suspensions || "-"];
      for (let i = 0; i < vals.length; i++) {
        if (i === 3 && p.goals > 0) { doc.setFont("helvetica", "bold"); doc.setTextColor(...color); }
        else { doc.setFont("helvetica", "normal"); doc.setTextColor(...black); }
        const tx = i === 1 ? cx + 1 : cx + colW[i] / 2;
        doc.text(`${vals[i]}`, tx, y, { align: i === 1 ? "left" : "center" });
        cx += colW[i];
      }
      y += 5.5;
    });
    y += 8;
  }

  // ─── FOOTER ───
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...lightGray); doc.line(mg, H - 12, W - mg, H - 12);
    doc.setFontSize(7); doc.setTextColor(...midGray); doc.setFont("helvetica", "normal");
    doc.text("HandballStats Pro", mg, H - 7);
    doc.text(`Stranica ${i}/${pageCount}`, W - mg, H - 7, { align: "right" });
  }

  const filename = `${match.homeTeam.name}_vs_${match.awayTeam.name}_${new Date(match.date).toLocaleDateString("sr-Latn").replace(/\./g, "-")}.pdf`;
  doc.save(filename);
}
