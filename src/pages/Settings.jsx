import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Edit2, 
  Users, 
  Calendar, 
  Trophy, 
  UserPlus,
  ChevronRight,
  Search
} from 'lucide-react';
import api from '../lib/api';
import { getCurrentUser, isAdminUser } from '../lib/auth';


export function Settings() {
  const [activeTab, setActiveTab] = useState('leagues');
  const canManage = isAdminUser(getCurrentUser());

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            League Management
          </h1>
          <p className="text-slate-500 mt-1">Configure leagues, seasons, teams, and players.</p>
          {!canManage ? (
            <p className="text-xs text-slate-500 mt-2">These controls are visible but disabled. Only league admins/system admins can use these features.</p>
          ) : null}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-2">
              <NavButton 
                active={activeTab === 'leagues'} 
                onClick={() => setActiveTab('leagues')} 
                icon={<Trophy size={18} />} 
                label="Leagues" 
              />
              <NavButton 
                active={activeTab === 'seasons'} 
                onClick={() => setActiveTab('seasons')} 
                icon={<Calendar size={18} />} 
                label="Seasons" 
              />
              <NavButton 
                active={activeTab === 'teams'} 
                onClick={() => setActiveTab('teams')} 
                icon={<Users size={18} />} 
                label="Teams" 
              />
              <NavButton 
                active={activeTab === 'players'} 
                onClick={() => setActiveTab('players')} 
                icon={<UserPlus size={18} />} 
                label="Players" 
              />
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className={!canManage ? 'opacity-50 pointer-events-none select-none' : ''}>
              {activeTab === 'leagues' && <LeaguesManager />}
              {activeTab === 'seasons' && <SeasonsManager />}
              {activeTab === 'teams' && <TeamsManager />}
              {activeTab === 'players' && <PlayersManager />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-left ${
        active 
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      {icon}
      {label}
      {active && <ChevronRight size={16} className="ml-auto" />}
    </button>
  );
}

// --- Managers ---

function LeaguesManager() {
  const [leagues, setLeagues] = useState([]);
  const [formData, setFormData] = useState({ name: '', country: '', logo: '' });

  useEffect(() => {
    api.get('/leagues').then(({ data }) => setLeagues(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: newLeague } = await api.post('/leagues', formData);
    setLeagues([...leagues, newLeague]);
    setFormData({ name: '', country: '', logo: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Leagues</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
        <input 
          placeholder="League Name" 
          className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          required
        />
        <input 
          placeholder="Country" 
          className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          value={formData.country}
          onChange={e => setFormData({...formData, country: e.target.value})}
          required
        />
        <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <Plus size={18} /> Add League
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {leagues.map(league => (
              <tr key={league.id}>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{league.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{league.country}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SeasonsManager() {
  const [seasons, setSeasons] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [formData, setFormData] = useState({ league_id: '', name: '', start_date: '', end_date: '' });

  useEffect(() => {
    api.get('/seasons').then(({ data }) => setSeasons(data));
    api.get('/leagues').then(({ data }) => setLeagues(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/seasons', formData);
    // Refresh to get league name join
    api.get('/seasons').then(({ data }) => setSeasons(data));
    setFormData({ ...formData, name: '' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Seasons</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
        <select 
          className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          value={formData.league_id}
          onChange={e => setFormData({...formData, league_id: e.target.value})}
          required
        >
          <option value="">Select League</option>
          {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input 
          placeholder="Season Name (e.g. 2023/24)" 
          className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          required
        />
        <input 
          type="date"
          className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          value={formData.start_date}
          onChange={e => setFormData({...formData, start_date: e.target.value})}
        />
        <input 
          type="date"
          className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          value={formData.end_date}
          onChange={e => setFormData({...formData, end_date: e.target.value})}
        />
        <button type="submit" className="md:col-span-2 bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <Plus size={18} /> Create Season
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
            <tr>
              <th className="px-4 py-3">League</th>
              <th className="px-4 py-3">Season</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {seasons.map(season => (
              <tr key={season.id}>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{season.league_name}</td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{season.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{season.start_date}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{season.end_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamsManager() {
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [formData, setFormData] = useState({ name: '', stadium: '', city: '' });
  const [assignData, setAssignData] = useState({ team_id: '', season_id: '' });

  useEffect(() => {
    api.get('/teams').then(({ data }) => setTeams(data));
    api.get('/seasons').then(({ data }) => setSeasons(data));
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const { data: newTeam } = await api.post('/teams', formData);
    setTeams([...teams, newTeam]);
    setFormData({ name: '', stadium: '', city: '' });
  };

  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!assignData.season_id || !assignData.team_id) return;
    
    await api.post(`/seasons/${assignData.season_id}/teams`, { team_id: assignData.team_id });
    alert('Team assigned to season successfully');
    setAssignData({ team_id: '', season_id: '' });
  };

  return (
    <div className="space-y-8">
      {/* Create Team */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Team</h2>
        <form onSubmit={handleCreateTeam} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
          <input 
            placeholder="Team Name" 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <input 
            placeholder="Stadium" 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={formData.stadium}
            onChange={e => setFormData({...formData, stadium: e.target.value})}
          />
          <input 
            placeholder="City" 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={formData.city}
            onChange={e => setFormData({...formData, city: e.target.value})}
          />
          <button type="submit" className="md:col-span-3 bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Plus size={18} /> Add Team
          </button>
        </form>
      </div>

      {/* Assign Team to Season */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Assign Team to Season</h2>
        <form onSubmit={handleAssignTeam} className="flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
          <select 
            className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={assignData.season_id}
            onChange={e => setAssignData({...assignData, season_id: e.target.value})}
            required
          >
            <option value="">Select Season</option>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.league_name} - {s.name}</option>)}
          </select>
          <select 
            className="flex-1 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={assignData.team_id}
            onChange={e => setAssignData({...assignData, team_id: e.target.value})}
            required
          >
            <option value="">Select Team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button type="submit" className="bg-emerald-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-emerald-700 transition-colors">
            Assign
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Stadium</th>
              <th className="px-4 py-3">City</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {teams.map(team => (
              <tr key={team.id}>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{team.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{team.stadium}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{team.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayersManager() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [formData, setFormData] = useState({ name: '', position: '', number: '', nationality: '' });
  const [assignData, setAssignData] = useState({ player_id: '', team_id: '', season_id: '' });

  useEffect(() => {
    api.get('/players').then(({ data }) => setPlayers(data));
    api.get('/teams').then(({ data }) => setTeams(data));
    api.get('/seasons').then(({ data }) => setSeasons(data));
  }, []);

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    const { data: newPlayer } = await api.post('/players', formData);
    setPlayers([...players, newPlayer]);
    setFormData({ name: '', position: '', number: '', nationality: '' });
  };

  const handleAssignPlayer = async (e) => {
    e.preventDefault();
    if (!assignData.team_id || !assignData.player_id || !assignData.season_id) return;
    
    await api.post(`/teams/${assignData.team_id}/players`, {
      player_id: assignData.player_id,
      season_id: assignData.season_id
    });
    alert('Player added to team roster successfully');
    setAssignData({ player_id: '', team_id: '', season_id: '' });
  };

  return (
    <div className="space-y-8">
      {/* Create Player */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Player</h2>
        <form onSubmit={handleCreatePlayer} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
          <input 
            placeholder="Player Name" 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <input 
            placeholder="Position (e.g. FW)" 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={formData.position}
            onChange={e => setFormData({...formData, position: e.target.value})}
          />
          <input 
            type="number"
            placeholder="Number" 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={formData.number}
            onChange={e => setFormData({...formData, number: e.target.value})}
          />
          <input 
            placeholder="Nationality" 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={formData.nationality}
            onChange={e => setFormData({...formData, nationality: e.target.value})}
          />
          <button type="submit" className="md:col-span-4 bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Plus size={18} /> Add Player
          </button>
        </form>
      </div>

      {/* Assign Player to Team */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add Player to Roster</h2>
        <form onSubmit={handleAssignPlayer} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
          <select 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={assignData.season_id}
            onChange={e => setAssignData({...assignData, season_id: e.target.value})}
            required
          >
            <option value="">Select Season</option>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.league_name} - {s.name}</option>)}
          </select>
          <select 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={assignData.team_id}
            onChange={e => setAssignData({...assignData, team_id: e.target.value})}
            required
          >
            <option value="">Select Team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select 
            className="rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            value={assignData.player_id}
            onChange={e => setAssignData({...assignData, player_id: e.target.value})}
            required
          >
            <option value="">Select Player</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
          </select>
          <button type="submit" className="md:col-span-3 bg-emerald-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-emerald-700 transition-colors">
            Add to Roster
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Nationality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {players.map(player => (
              <tr key={player.id}>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{player.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{player.position}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{player.number}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{player.nationality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

