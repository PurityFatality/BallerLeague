import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  Trophy, 
  Activity, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatDateLabel, formatDateTime, formatTime24 } from '../lib/date';

export function Overview() {
  const [teams, setTeams] = useState([]);
  const [pastMatches, setPastMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadSeasons() {
      try {
        const { data } = await api.get('/seasons');
        const seasonRows = Array.isArray(data) ? data : [];
        setSeasons(seasonRows);

        if (seasonRows.length > 0 && !selectedSeasonId) {
          setSelectedSeasonId(String(seasonRows[0].id));
        } else if (seasonRows.length === 0) {
          setTeams([]);
          setPastMatches([]);
          setUpcomingMatches([]);
          setIsLoading(false);
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Failed to load dashboard data');
        setIsLoading(false);
      }
    }

    loadSeasons();
  }, []);

  useEffect(() => {
    async function loadOverview() {
      if (!selectedSeasonId) {
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const [{ data: teamRows }, { data: pastRows }, { data: upcomingRows }] = await Promise.all([
          api.get(`/seasons/${selectedSeasonId}/teams`),
          api.get('/matches/past', { params: { season_id: Number(selectedSeasonId) } }),
          api.get('/matches/upcoming', { params: { season_id: Number(selectedSeasonId) } })
        ]);

        setTeams(Array.isArray(teamRows) ? teamRows : []);
        setPastMatches(Array.isArray(pastRows) ? pastRows : []);
        setUpcomingMatches(Array.isArray(upcomingRows) ? upcomingRows : []);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    loadOverview();
  }, [selectedSeasonId]);

  const completedMatches = useMemo(
    () => pastMatches.filter((match) => match.status === 'completed'),
    [pastMatches]
  );

  const goalsScored = useMemo(
    () => completedMatches.reduce((sum, match) => sum + Number(match.home_score || 0) + Number(match.away_score || 0), 0),
    [completedMatches]
  );

  const averageGoals = useMemo(() => {
    if (completedMatches.length === 0) {
      return '0.0';
    }

    return (goalsScored / completedMatches.length).toFixed(1);
  }, [completedMatches.length, goalsScored]);

  const activityData = useMemo(() => {
    return [...completedMatches]
      .sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at))
      .slice(-7)
      .map((match) => ({
        name: formatDateLabel(match.kickoff_at),
        goals: Number(match.home_score || 0) + Number(match.away_score || 0)
      }));
  }, [completedMatches]);

  const recentActivity = useMemo(() => {
    return [...pastMatches]
      .sort((a, b) => new Date(b.kickoff_at) - new Date(a.kickoff_at))
      .slice(0, 5);
  }, [pastMatches]);

  const selectedSeason = useMemo(
    () => seasons.find((season) => String(season.id) === String(selectedSeasonId)) || null,
    [seasons, selectedSeasonId]
  );

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Baller League Overview
          </h1>
          <p className="text-slate-500 mt-1">
            {selectedSeason ? `${selectedSeason.league_name} • ${selectedSeason.name}` : 'Live competition snapshot'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="overview-season">
            Season
          </label>
          <select
            id="overview-season"
            value={selectedSeasonId}
            onChange={(event) => setSelectedSeasonId(event.target.value)}
            className="min-w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.league_name} - {season.name}
              </option>
            ))}
          </select>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Teams" 
            value={String(teams.length)} 
            icon={<Users className="text-blue-600" size={24} />}
            trend={isLoading ? '...' : `${upcomingMatches.length} upcoming`} 
            trendUp={true}
            label="registered"
          />
          <StatCard 
            title="Matches Played" 
            value={String(completedMatches.length)} 
            icon={<Calendar className="text-emerald-600" size={24} />}
            trend={isLoading ? '...' : `${pastMatches.length} past fixtures`} 
            trendUp={true}
            label="completed"
          />
          <StatCard 
            title="Goals Scored" 
            value={String(goalsScored)} 
            icon={<Activity className="text-orange-600" size={24} />}
            trend={isLoading ? '...' : `${averageGoals} per match`} 
            trendUp={true}
            label="completed fixtures"
          />
          <StatCard 
            title="Upcoming Fixtures" 
            value={String(upcomingMatches.length)} 
            icon={<Trophy className="text-purple-600" size={24} />}
            trend={isLoading ? '...' : `${teams.length > 0 ? (upcomingMatches.length / teams.length).toFixed(1) : '0.0'} per team`} 
            trendUp={upcomingMatches.length > 0}
            label="published"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Goals in Recent Completed Matches</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last {activityData.length} fixtures</span>
            </div>

            {activityData.length === 0 ? (
              <div className="h-75 w-full flex items-center justify-center text-sm text-slate-500">
                No completed match data yet.
              </div>
            ) : (
              <div className="h-75 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="goals" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorGoals)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6">Upcoming Matches</h3>
            <div className="space-y-6">
              {upcomingMatches.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming fixtures published yet.</p>
              ) : upcomingMatches.slice(0, 5).map((match) => (
                <div key={match.id} className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="flex flex-col items-center min-w-15 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{formatDateLabel(match.kickoff_at)}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{formatTime24(match.kickoff_at)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{match.home_team_name}</div>
                    <div className="text-xs text-slate-500 my-1">vs</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{match.away_team_name}</div>
                  </div>
                  <Link to="/matches" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-blue-600">
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              ))}
            </div>
            <Link to="/matches" className="block text-center w-full mt-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              View Full Schedule
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent League Activity</h3>
            <Link to="/results" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Match</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-sm text-slate-500">No recent match activity yet.</td>
                  </tr>
                ) : recentActivity.map((match) => (
                  <tr key={match.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{match.home_team_name} vs {match.away_team_name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDateTime(match.kickoff_at)}</td>
                    <td className="px-4 py-4 font-bold text-slate-900 dark:text-slate-100">{Number(match.home_score || 0)} - {Number(match.away_score || 0)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${match.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link to={`/results?matchId=${match.id}`} className="text-slate-400 hover:text-blue-600 transition-colors">Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, icon, trend, trendUp, label }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div>
        <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</span>
          <span className="text-xs text-slate-400">{label}</span>
        </div>
      </div>
    </div>
  );
}
