const _get = (key) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
};
const _set = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch { return false; }
};
const _del = (key) => {
  try { localStorage.removeItem(key); return true; }
  catch { return false; }
};

const DB = {
  async saveMatch(match) {
    _set(`match:${match.id}`, match);
    const idx = _get("match_index") || [];
    if (!idx.includes(match.id)) { idx.push(match.id); _set("match_index", idx); }
  },

  async getMatch(id) {
    return _get(`match:${id}`);
  },

  async getAllMatches() {
    const idx = _get("match_index") || [];
    return idx
      .map(id => _get(`match:${id}`))
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async deleteMatch(id) {
    _del(`match:${id}`);
    const idx = (_get("match_index") || []).filter(i => i !== id);
    _set("match_index", idx);
  },

  async saveTeamTemplate(tmpl) {
    _set(`team:${tmpl.id}`, tmpl);
    const idx = _get("team_index") || [];
    if (!idx.includes(tmpl.id)) { idx.push(tmpl.id); _set("team_index", idx); }
  },

  async getAllTeams() {
    const idx = _get("team_index") || [];
    return idx.map(id => _get(`team:${id}`)).filter(Boolean);
  },
};

export default DB;
