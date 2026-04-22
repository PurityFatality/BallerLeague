import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Shield, Save, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getCurrentUser, hasAnyRole } from '../lib/auth';
import api from '../lib/api';
import { formatDateTime } from '../lib/date';

export function MatchEntryCard() {
  const canEditResult = hasAnyRole(getCurrentUser(), ['league_admin', 'system_admin']);
  const [searchParams] = useSearchParams();
  const initialMatchIdRef = useRef(searchParams.get('matchId') || '');
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [goalMinute, setGoalMinute] = useState('');
  const [goalTeamId, setGoalTeamId] = useState('');
  const [scorerPlayerId, setScorerPlayerId] = useState('');
  const [assistPlayerId, setAssistPlayerId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedMatch = useMemo(
    () => matches.find((match) => String(match.id) === String(selectedMatchId)) || null,
    [matches, selectedMatchId]
  );

  const playerNames = useMemo(() => {
    return new Map(players.map((player) => [Number(player.id), player.name]));
  }, [players]);

  const goalEvents = useMemo(() => {
    if (!selectedMatch || !Array.isArray(selectedMatch.goal_events)) {
      return [];
    }

    return [...selectedMatch.goal_events].sort((left, right) => {
      const minuteDiff = Number(left.minute) - Number(right.minute);
      if (minuteDiff !== 0) {
        return minuteDiff;
      }

      return Number(left.id) - Number(right.id);
    });
  }, [selectedMatch]);

  const scheduledMatches = useMemo(
    () => matches.filter((match) => match.status !== 'completed'),
    [matches]
  );

  const completedMatches = useMemo(
    () => matches.filter((match) => match.status === 'completed'),
    [matches]
  );

  const teamPlayers = useMemo(() => {
    if (!selectedMatch || !goalTeamId) {
      return [];
    }

    const goalTeam = Number(goalTeamId);
    return players.filter((player) => Number(player.team_id) === goalTeam);
  }, [players, selectedMatch, goalTeamId]);

  function resetGoalForm() {
    setGoalMinute('');
    setScorerPlayerId('');
    setAssistPlayerId('');
  }

  async function refreshData() {
    try {
      let matchResponse;
      let upcomingResponse;
      let allPlayersResponse;

      if (canEditResult) {
        [matchResponse, allPlayersResponse] = await Promise.all([api.get('/matches/admin/all'), api.get('/players')]);
      } else {
        [matchResponse, upcomingResponse, allPlayersResponse] = await Promise.all([
          api.get('/matches/past'),
          api.get('/matches/upcoming'),
          api.get('/players')
        ]);
      }

      const matchRows = canEditResult
        ? (Array.isArray(matchResponse?.data) ? matchResponse.data : [])
        : [
            ...(Array.isArray(matchResponse?.data) ? matchResponse.data : []),
            ...(Array.isArray(upcomingResponse?.data) ? upcomingResponse.data : [])
          ].filter((match, index, rows) => rows.findIndex((item) => String(item.id) === String(match.id)) === index);

      setMatches(matchRows);
      setPlayers(Array.isArray(allPlayersResponse.data) ? allPlayersResponse.data : []);

      if (matchRows.length > 0) {
        const preferredMatchId = selectedMatchId || initialMatchIdRef.current;
        const currentMatch = matchRows.find((match) => String(match.id) === String(preferredMatchId)) || matchRows[0];
        setSelectedMatchId(String(currentMatch.id));
        setHomeScore(String(currentMatch.home_score ?? 0));
        setAwayScore(String(currentMatch.away_score ?? 0));
        setGoalTeamId(String(currentMatch.home_team_id));
      } else {
        setSelectedMatchId('');
        setHomeScore('0');
        setAwayScore('0');
        setGoalTeamId('');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to load match results data');
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!selectedMatch) {
      return;
    }

    setHomeScore(String(selectedMatch.home_score ?? 0));
    setAwayScore(String(selectedMatch.away_score ?? 0));
    setGoalTeamId(String(selectedMatch.home_team_id));
    resetGoalForm();
  }, [selectedMatch]);

  async function handleSaveResult(event) {
    event.preventDefault();

    if (!selectedMatch) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      await api.patch(`/matches/${selectedMatch.id}/result`, {
        home_score: Number(homeScore),
        away_score: Number(awayScore),
        status: 'completed'
      });

      await refreshData();
      setSuccessMessage('Match result saved and standings recalculated.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to save match result');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRecordGoal(event) {
    event.preventDefault();

    if (!selectedMatch) {
      return;
    }

    if (!goalMinute || !goalTeamId || !scorerPlayerId) {
      setErrorMessage('Minute, team, and scorer are required to record a goal event.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      await api.post(`/matches/${selectedMatch.id}/goals`, {
        minute: Number(goalMinute),
        team_id: Number(goalTeamId),
        scorer_player_id: Number(scorerPlayerId),
        assist_player_id: assistPlayerId ? Number(assistPlayerId) : null
      });

      await refreshData();
      resetGoalForm();
      setSuccessMessage('Goal event recorded and player stats updated.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to record goal event');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteGoal(goalId) {
    if (!selectedMatch || !window.confirm('Delete this goal event? Match score and player stats will be recalculated.')) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      await api.delete(`/matches/${selectedMatch.id}/goals/${goalId}`);
      await refreshData();
      setSuccessMessage('Goal event removed and player stats updated.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to delete goal event');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="text-blue-600" size={24} />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Record Match Result</h2>
      </div>

      {!canEditResult ? (
        <p className="text-[11px] text-slate-500 mb-4">Your role does not allow you to record match results or goal events.</p>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-rose-600 mb-4">{errorMessage}</p>
      ) : null}

      {successMessage ? (
        <p className="text-sm text-emerald-600 mb-4">{successMessage}</p>
      ) : null}
      
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Match</label>
        <select
          value={selectedMatchId}
          onChange={(event) => setSelectedMatchId(event.target.value)}
          className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3"
        >
          {scheduledMatches.length > 0 ? (
            <optgroup label="Scheduled Matches">
              {scheduledMatches.map((match) => (
                <option key={match.id} value={String(match.id)}>
                  #{match.id} - {formatDateTime(match.kickoff_at)} - {match.home_team_name} vs {match.away_team_name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {scheduledMatches.length > 0 && completedMatches.length > 0 ? (
            <option disabled value="divider">
              ─────────────
            </option>
          ) : null}
          {completedMatches.length > 0 ? (
            <optgroup label="Completed Matches">
              {completedMatches.map((match) => (
                <option key={match.id} value={String(match.id)}>
                  #{match.id} - {formatDateTime(match.kickoff_at)} - {match.home_team_name} vs {match.away_team_name}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      </div>

      <form className="space-y-6" onSubmit={handleSaveResult}>
        <fieldset disabled={!canEditResult} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-3">
            <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Shield className="text-slate-400" size={32} />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">{selectedMatch?.home_team_name || 'Home Team'}</span>
            <input 
              type="number" 
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-24 h-16 text-center text-3xl font-black rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 text-slate-900 dark:text-slate-100" 
              placeholder="0" 
            />
          </div>
          
          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold text-slate-500 uppercase">vs</div>
            <p className="text-xs text-slate-400 mt-2">{selectedMatch?.venue || 'Venue TBA'}</p>
            <p className="text-[10px] text-slate-400">Status: {selectedMatch?.status || 'scheduled'}</p>
          </div>
          
          {/* Away Team */}
          <div className="flex flex-col items-center gap-3">
            <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Shield className="text-slate-400" size={32} />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">{selectedMatch?.away_team_name || 'Away Team'}</span>
            <input 
              type="number" 
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-24 h-16 text-center text-3xl font-black rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 text-slate-900 dark:text-slate-100" 
              placeholder="0" 
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Goal Events</h3>
              <p className="text-xs text-slate-500 mt-1">
                Goal events recorded for {selectedMatch ? `${selectedMatch.home_team_name} vs ${selectedMatch.away_team_name}` : 'the selected match'}.
              </p>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {goalEvents.length} Event{goalEvents.length === 1 ? '' : 's'}
            </span>
          </div>

          {goalEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-5 text-sm text-slate-500">
              No goal events recorded for this match yet.
            </div>
          ) : (
            <div className="space-y-3">
              {goalEvents.map((goalEvent, index) => {
                const scoringTeamName = Number(goalEvent.team_id) === Number(selectedMatch?.home_team_id)
                  ? selectedMatch?.home_team_name
                  : selectedMatch?.away_team_name;
                const scorerName = playerNames.get(Number(goalEvent.scorer_player_id)) || `Player ${goalEvent.scorer_player_id}`;
                const assistName = goalEvent.assist_player_id
                  ? playerNames.get(Number(goalEvent.assist_player_id)) || `Player ${goalEvent.assist_player_id}`
                  : null;

                return (
                  <div key={goalEvent.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-4 py-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white">
                          {goalEvent.minute}'
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{scoringTeamName || 'Unknown Team'}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Scorer: <span className="font-semibold text-slate-900 dark:text-slate-100">{scorerName}</span>
                        {assistName ? (
                          <span>
                            {' '}
                            • Assist: <span className="font-semibold text-slate-900 dark:text-slate-100">{assistName}</span>
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 md:shrink-0 md:w-32">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap leading-none">
                        Goal #{index + 1}
                      </div>
                      {canEditResult ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(goalEvent.id)}
                          disabled={isSaving}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Goal Minute</span>
            <input
              type="number"
              min="0"
              max="130"
              value={goalMinute}
              onChange={(event) => setGoalMinute(event.target.value)}
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-blue-600 focus:border-blue-600 py-3 px-4 text-slate-900 dark:text-slate-100"
              placeholder="e.g. 67"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Scoring Team</span>
            <select
              value={goalTeamId}
              onChange={(event) => setGoalTeamId(event.target.value)}
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Team</option>
              {selectedMatch ? (
                <>
                  <option value={String(selectedMatch.home_team_id)}>{selectedMatch.home_team_name}</option>
                  <option value={String(selectedMatch.away_team_id)}>{selectedMatch.away_team_name}</option>
                </>
              ) : null}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Scorer</span>
            <select
              value={scorerPlayerId}
              onChange={(event) => setScorerPlayerId(event.target.value)}
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Scorer</option>
              {teamPlayers.map((player) => (
                <option key={player.id} value={String(player.id)}>{player.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Assist (optional)</span>
            <select
              value={assistPlayerId}
              onChange={(event) => setAssistPlayerId(event.target.value)}
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-slate-900 dark:text-slate-100"
            >
              <option value="">No Assist</option>
              {teamPlayers.map((player) => (
                <option key={player.id} value={String(player.id)}>{player.name}</option>
              ))}
            </select>
          </label>
        </div>
        
        <div className="flex flex-wrap justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleRecordGoal}
            disabled={isSaving || !selectedMatch}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all active:scale-95"
          >
            Record Goal Event
          </button>
          <button 
            type="submit" 
            disabled={isSaving || !selectedMatch}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <Save size={20} />
            Save & Recalculate Standings
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
}
