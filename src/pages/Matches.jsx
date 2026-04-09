import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { getCurrentUser, isAdminUser } from '../lib/auth';

function formatDateTime(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function toDateInputValue(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function Matches() {
  const [view, setView] = useState('upcoming');
  const [publicMatches, setPublicMatches] = useState([]);
  const [adminMatches, setAdminMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const user = getCurrentUser();
  const canManageFixtures = isAdminUser(user);

  const [createForm, setCreateForm] = useState({
    season_id: '',
    home_team_id: '',
    away_team_id: '',
    kickoff_at: '',
    venue: ''
  });

  async function loadPublicFixtures(selectedView) {
    const endpoint = selectedView === 'past' ? '/matches/past' : '/matches/upcoming';
    const { data } = await api.get(endpoint);
    setPublicMatches(Array.isArray(data) ? data : []);
  }

  async function loadAdminFixtures() {
    if (!canManageFixtures) {
      return;
    }

    const [{ data: all }, { data: allTeams }, { data: allSeasons }] = await Promise.all([
      api.get('/matches/admin/all'),
      api.get('/teams'),
      api.get('/seasons')
    ]);

    setAdminMatches(Array.isArray(all) ? all : []);
    setTeams(Array.isArray(allTeams) ? allTeams : []);
    setSeasons(Array.isArray(allSeasons) ? allSeasons : []);
  }

  async function loadData(selectedView = view) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await Promise.all([loadPublicFixtures(selectedView), loadAdminFixtures()]);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to load fixture data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData(view);
  }, [view]);

  const adminVisibleMatches = useMemo(() => {
    if (!canManageFixtures) {
      return [];
    }

    if (view === 'past') {
      return adminMatches.filter((match) => ['completed', 'cancelled'].includes(match.status) || new Date(match.kickoff_at) < new Date());
    }

    return adminMatches.filter((match) => !(['completed', 'cancelled'].includes(match.status) || new Date(match.kickoff_at) < new Date()));
  }, [adminMatches, canManageFixtures, view]);

  const visibleAdminMatches = canManageFixtures ? adminVisibleMatches : publicMatches;

  async function handleCreateMatch(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.post('/matches/manual', {
        season_id: Number(createForm.season_id),
        home_team_id: Number(createForm.home_team_id),
        away_team_id: Number(createForm.away_team_id),
        kickoff_at: new Date(createForm.kickoff_at).toISOString(),
        venue: createForm.venue,
        published: false
      });

      setCreateForm({ season_id: '', home_team_id: '', away_team_id: '', kickoff_at: '', venue: '' });
      await loadData(view);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to create fixture');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePublishToggle(match) {
    try {
      await api.patch(`/matches/${match.id}/publish`, { published: !match.published });
      await loadData(view);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to publish fixture');
    }
  }

  async function handleStatusUpdate(match, status) {
    const statusNote = window.prompt(`Add note for ${status} (optional):`, match.status_note || '') || '';
    try {
      await api.patch(`/matches/${match.id}/status`, { status, status_note: statusNote });
      await loadData(view);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update fixture status');
    }
  }

  async function handleEditSchedule(match) {
    const nextDateValue = window.prompt('New kickoff date/time (YYYY-MM-DDTHH:mm)', toDateInputValue(match.kickoff_at));
    if (!nextDateValue) {
      return;
    }

    const nextVenue = window.prompt('New venue', match.venue || '') ?? match.venue;

    try {
      await api.patch(`/matches/${match.id}/schedule`, {
        kickoff_at: new Date(nextDateValue).toISOString(),
        venue: nextVenue
      });
      await loadData(view);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to edit schedule');
    }
  }

  async function handlePublishAll() {
    try {
      await api.post('/matches/publish', { published: true });
      await loadData(view);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to publish all fixtures');
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Match Fixtures & Scheduling
            </h1>
            <p className="text-slate-500 mt-1">Create, edit, postpone, cancel, publish, and browse fixtures.</p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setView('upcoming')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${view === 'upcoming' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setView('past')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${view === 'past' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Past
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40">
            {errorMessage}
          </div>
        ) : null}

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">League Admin Fixture Controls</h2>
              {!canManageFixtures ? <p className="text-[11px] text-slate-500 mt-1">Only league admins/system admins can use these controls.</p> : null}
            </div>
            <button
              type="button"
              onClick={handlePublishAll}
              disabled={!canManageFixtures}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} />
              Publish All
            </button>
          </div>

          <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <fieldset disabled={!canManageFixtures} className="contents">
              <select
                required
                value={createForm.season_id}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, season_id: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Season</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>

              <select
                required
                value={createForm.home_team_id}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, home_team_id: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Home Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>

              <select
                required
                value={createForm.away_team_id}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, away_team_id: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Away Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>

              <input
                required
                type="datetime-local"
                value={createForm.kickoff_at}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, kickoff_at: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />

              <input
                placeholder="Venue"
                value={createForm.venue}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, venue: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="md:col-span-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5"
              >
                {isSubmitting ? 'Creating Fixture...' : 'Create Match Manually'}
              </button>
            </fieldset>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {view === 'past' ? 'Past Matches' : 'Upcoming Fixtures'}
          </h2>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              Loading fixtures...
            </div>
          ) : publicMatches.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              No {view} fixtures available.
            </div>
          ) : (
            <div className="space-y-3">
              {publicMatches.map((match) => (
                <article key={match.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                      <Clock size={12} />
                      {formatDateTime(match.kickoff_at)}
                    </div>

                    <div className="flex-1 grid grid-cols-3 items-center gap-4 w-full">
                      <div className="text-right font-bold text-slate-900 dark:text-slate-100 truncate">
                        {match.home_team_name}
                      </div>
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">vs</span>
                      </div>
                      <div className="text-left font-bold text-slate-900 dark:text-slate-100 truncate">
                        {match.away_team_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={14} />
                      <span>{match.venue || 'Venue TBA'}</span>
                    </div>

                    <span className="text-[11px] font-semibold uppercase px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {match.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admin Fixture Management</h2>
            {!canManageFixtures ? <p className="text-[11px] text-slate-500 mt-1">Only league admins/system admins can use these controls.</p> : null}
          </div>
          {visibleAdminMatches.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
                No fixtures to manage in this view.
              </div>
          ) : (
              <div className="space-y-3">
                {visibleAdminMatches.map((match) => (
                  <article key={`admin-${match.id}`} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {match.home_team_name} vs {match.away_team_name}
                      </div>
                      <div className="text-xs text-slate-500">ID #{match.id} • {formatDateTime(match.kickoff_at)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleEditSchedule(match)} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">Edit Schedule</button>
                      <button type="button" onClick={() => handleStatusUpdate(match, 'postponed')} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed">Postpone</button>
                      <button type="button" onClick={() => handleStatusUpdate(match, 'cancelled')} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300 disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                      <button type="button" onClick={() => handlePublishToggle(match)} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        {match.published ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
          )}
        </section>
      </div>
    </main>
  );
}
