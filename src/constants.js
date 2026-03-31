export const EVENT_TYPES = {
  GOAL: { id: "goal", label: "Gol", icon: "⚽", color: "#00E676", category: "offense" },
  ASSIST: { id: "assist", label: "Asistencija", icon: "🤝", color: "#448AFF", category: "offense" },
  SHOT_MISSED: { id: "shot_missed", label: "Promašaj", icon: "✖", color: "#FF5252", category: "offense" },
  SHOT_BLOCKED: { id: "shot_blocked", label: "Blokirani šut", icon: "🛡", color: "#FF9100", category: "offense" },
  SHOT_POST: { id: "shot_post", label: "Stativa", icon: "🥅", color: "#FFD740", category: "offense" },
  SAVE: { id: "save", label: "Odbrana", icon: "🧤", color: "#00BFA5", category: "defense" },
  STEAL: { id: "steal", label: "Ukradena lopta", icon: "🏃", color: "#7C4DFF", category: "defense" },
  BLOCK: { id: "block", label: "Blokada", icon: "✋", color: "#E040FB", category: "defense" },
  TURNOVER: { id: "turnover", label: "Izgubljena lopta", icon: "💫", color: "#FF6E40", category: "offense" },
  FOUL_COMMITTED: { id: "foul_committed", label: "Napravljeni faul", icon: "⚠", color: "#FFAB40", category: "foul" },
  FOUL_RECEIVED: { id: "foul_received", label: "Pretrpljeni faul", icon: "💥", color: "#40C4FF", category: "foul" },
  FOUL_7M_COMMITTED: { id: "foul_7m_committed", label: "Faul za 7m (skrivio)", icon: "🎯⚠", color: "#FF6D00", category: "foul" },
  FOUL_7M_RECEIVED: { id: "foul_7m_received", label: "Faul za 7m (nad njim)", icon: "🎯💥", color: "#00B0FF", category: "foul" },
  YELLOW_CARD: { id: "yellow_card", label: "Žuti karton", icon: "🟨", color: "#FFD600", category: "discipline" },
  RED_CARD: { id: "red_card", label: "Crveni karton", icon: "🟥", color: "#D50000", category: "discipline" },
  SUSPENSION: { id: "suspension", label: "Isključenje 2min", icon: "⏱", color: "#FF1744", category: "discipline" },
  PENALTY_GOAL: { id: "penalty_goal", label: "Gol iz 7m", icon: "🎯", color: "#76FF03", category: "penalty" },
  PENALTY_MISS: { id: "penalty_miss", label: "Promašen 7m", icon: "❌", color: "#FF1744", category: "penalty" },
  PENALTY_SAVE: { id: "penalty_save", label: "Odbranjen 7m", icon: "🧱", color: "#18FFFF", category: "penalty" },
  FAST_BREAK: { id: "fast_break", label: "Kontranapad", icon: "⚡", color: "#EEFF41", category: "action" },
  BREAKTHROUGH: { id: "breakthrough", label: "Prodor", icon: "🔥", color: "#FF9100", category: "action" },
  TECHNICAL_FOUL: { id: "technical_foul", label: "Tehnički faul", icon: "📋", color: "#B388FF", category: "foul" },
  PASSIVE_PLAY: { id: "passive_play", label: "Pasivna igra", icon: "🐢", color: "#A1887F", category: "action" },
};

// Events available to GK in offense (only goal and assist)
export const GK_OFFENSE_EVENTS = ["goal", "assist"];

// Events hidden from field players in defense (save is GK-only)
export const FIELD_HIDDEN_DEFENSE = ["save", "penalty_save"];

export const POSITIONS = ["LW", "LB", "CB", "RB", "RW", "P", "GK"];

export const POS_LABELS = {
  LW: "Lijevo krilo", LB: "Lijevi bek", CB: "Srednji bek",
  RB: "Desni bek", RW: "Desno krilo", P: "Pivot", GK: "Golman",
};

export const EVENT_CATEGORIES = [
  { id: "offense", label: "Napad", icon: "⚽" },
  { id: "defense", label: "Odbrana", icon: "🛡" },
  { id: "penalty", label: "7m", icon: "🎯" },
  { id: "foul", label: "Faulovi", icon: "⚠" },
  { id: "discipline", label: "Kartoni", icon: "🟨" },
  { id: "action", label: "Akcije", icon: "⚡" },
];

// Categories available per position
export const GK_CATEGORIES = ["offense", "defense", "penalty", "foul", "discipline"];
export const FIELD_CATEGORIES = ["offense", "defense", "penalty", "foul", "discipline", "action"];
