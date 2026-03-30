import { useState, useEffect } from 'react';
import DB from './db';
import { theme } from './styles';
import HomeScreen from './components/HomeScreen';
import MatchSetup from './components/MatchSetup';
import LiveMatch from './components/LiveMatch';
import LiveStats from './components/LiveStats';
import TeamManager from './components/TeamManager';

export default function App() {
  const [screen, setScreen] = useState("home");
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setMatches(await DB.getAllMatches());
      setTeams(await DB.getAllTeams());
      setLoading(false);
    })();
  }, []);

  const refresh = async () => {
    setMatches(await DB.getAllMatches());
    setTeams(await DB.getAllTeams());
  };

  const startMatch = (m) => { setCurrentMatch(m); setScreen("live"); };
  const endMatch = async (m) => {
    await DB.saveMatch({ ...m, status: "finished" });
    await refresh();
    setCurrentMatch(null);
    setScreen("home");
  };

  if (loading) return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: `3px solid ${theme.border}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: 14, color: theme.textMuted }}>Učitavanje...</span>
    </div>
  );

  return (
    <div className="app-shell">
      {screen === "home" && <HomeScreen matches={matches} onNewMatch={() => setScreen("setup")} onViewMatch={(m) => { setCurrentMatch(m); setScreen("review"); }} onManageTeams={() => setScreen("teams")} onDeleteMatch={async (id) => { await DB.deleteMatch(id); await refresh(); }} />}
      {screen === "setup" && <MatchSetup teams={teams} onStart={startMatch} onBack={() => setScreen("home")} />}
      {screen === "live" && <LiveMatch match={currentMatch} onSave={async (m) => { await DB.saveMatch(m); }} onEnd={endMatch} />}
      {screen === "review" && <LiveStats match={currentMatch} onBack={() => { setCurrentMatch(null); setScreen("home"); }} />}
      {screen === "teams" && <TeamManager teams={teams} onSave={async (t) => { await DB.saveTeamTemplate(t); await refresh(); }} onBack={() => setScreen("home")} />}
    </div>
  );
}
