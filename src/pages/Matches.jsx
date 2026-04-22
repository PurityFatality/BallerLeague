import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Clock, MapPin } from 'lucide-react';
import api from '../lib/api';
import { getCurrentUser, isAdminUser } from '../lib/auth';
import { formatDateTime, toDateInputValue } from '../lib/date';
import { VenuePickerModal } from '../components/VenuePickerModal';
import { VenueDetailsModal } from '../components/VenueDetailsModal';
import { EmailSubscriptions } from '../components/EmailSubscriptions';

function toVenueModel(matchOrFormVenue, venueDetails) {
  if (venueDetails && typeof venueDetails === 'object') {
    return {
      name: venueDetails.name || matchOrFormVenue || '',
      address: venueDetails.address || '',
      latitude: venueDetails.latitude,
      longitude: venueDetails.longitude,
      place_id: venueDetails.place_id || null
    };
  }

  if (typeof matchOrFormVenue === 'string') {
    return {
      name: matchOrFormVenue,
      address: '',
      latitude: null,
      longitude: null,
      place_id: null
    };
  }

  return {
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    place_id: null
  };
}

function getVenueFromMatch(match) {
  return toVenueModel(match.venue, match.venue_details);
}

function AccordionSection({ title, open, onToggle, children, subtitle }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle ? <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p> : null}
        </div>
        <ChevronDown size={18} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="border-t border-slate-200 dark:border-slate-800 p-5">{children}</div> : null}
    </section>
  );
}

export function Matches() {
  const [playedMatches, setPlayedMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [adminMatches, setAdminMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAdminControlsOpen, setIsAdminControlsOpen] = useState(true);
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState(false);
  const [isVenuePickerOpen, setIsVenuePickerOpen] = useState(false);
  const [venuePickerTarget, setVenuePickerTarget] = useState({ type: 'create', match: null });
  const [detailsVenue, setDetailsVenue] = useState(null);
  const [scheduleEditor, setScheduleEditor] = useState({
    isOpen: false,
    matchId: null,
    date: '',
    time: ''
  });

  const user = getCurrentUser();
  const canManageFixtures = isAdminUser(user);

  const [createForm, setCreateForm] = useState({
    season_id: '',
    home_team_id: '',
    away_team_id: '',
    kickoff_date: '',
    kickoff_time: '',
    venue: '',
    venue_details: null
  });

  async function loadPublicFixtures() {
    const [{ data: past }, { data: upcoming }] = await Promise.all([
      api.get('/matches/past'),
      api.get('/matches/upcoming')
    ]);

    setPlayedMatches(Array.isArray(past) ? past : []);
    setUpcomingMatches(Array.isArray(upcoming) ? upcoming : []);
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

  async function loadData() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await Promise.all([loadPublicFixtures(), loadAdminFixtures()]);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to load fixture data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [canManageFixtures]);

  const adminVisibleMatches = useMemo(() => {
    if (!canManageFixtures) {
      return [];
    }

    return adminMatches;
  }, [adminMatches, canManageFixtures]);

  async function handleCreateMatch(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const kickoffAtLocal = `${createForm.kickoff_date}T${createForm.kickoff_time}`;
    try {
      await api.post('/matches/manual', {
        season_id: Number(createForm.season_id),
        home_team_id: Number(createForm.home_team_id),
        away_team_id: Number(createForm.away_team_id),
        kickoff_at: new Date(kickoffAtLocal).toISOString(),
        venue: createForm.venue,
        venue_details: createForm.venue_details,
        published: true
      });

      setCreateForm({
        season_id: '',
        home_team_id: '',
        away_team_id: '',
        kickoff_date: '',
        kickoff_time: '',
        venue: '',
        venue_details: null
      });
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to create fixture');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteMatch(match) {
    const confirmed = window.confirm(`Delete ${match.home_team_name} vs ${match.away_team_name}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/matches/${match.id}`);
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to delete match');
    }
  }

  function openScheduleEditor(match) {
    const nextDateValue = toDateInputValue(match.kickoff_at);
    const [datePart = '', timePart = ''] = nextDateValue.split('T');
    const normalizedTime = timePart.slice(0, 5);

    setScheduleEditor({
      isOpen: true,
      matchId: match.id,
      date: datePart,
      time: normalizedTime
    });
  }

  function closeScheduleEditor() {
    setScheduleEditor({
      isOpen: false,
      matchId: null,
      date: '',
      time: ''
    });
  }

  async function handleSaveSchedule() {
    if (!scheduleEditor.matchId || !scheduleEditor.date || !scheduleEditor.time) {
      return;
    }

    try {
      await api.patch(`/matches/${scheduleEditor.matchId}/schedule`, {
        kickoff_at: new Date(`${scheduleEditor.date}T${scheduleEditor.time}`).toISOString()
      });
      closeScheduleEditor();
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to edit schedule');
    }
  }

  function openVenuePickerForCreate() {
    setVenuePickerTarget({ type: 'create', match: null });
    setIsVenuePickerOpen(true);
  }

  function openVenuePickerForMatch(match) {
    setVenuePickerTarget({ type: 'match', match });
    setIsVenuePickerOpen(true);
  }

  async function handleVenueSelected(selectedVenue) {
    if (!selectedVenue) {
      return;
    }

    if (venuePickerTarget.type === 'create') {
      setCreateForm((prev) => ({
        ...prev,
        venue: selectedVenue.name || selectedVenue.address || '',
        venue_details: selectedVenue
      }));
      return;
    }

    if (!venuePickerTarget.match) {
      return;
    }

    try {
      await api.patch(`/matches/${venuePickerTarget.match.id}/schedule`, {
        venue: selectedVenue.name || selectedVenue.address || '',
        venue_details: selectedVenue
      });
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update venue');
    }
  }

  function openVenueDetails(match) {
    const venue = getVenueFromMatch(match);
    setDetailsVenue({
      ...venue,
      kickoff_at: match.kickoff_at,
      status: match.status
    });
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Match Fixtures & Scheduling
            </h1>
            <p className="text-slate-500 mt-1">Create, edit, delete, and browse fixtures.</p>
          </div>
          <EmailSubscriptions />
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40">
            {errorMessage}
          </div>
        ) : null}

        <AccordionSection
          title="League Admin Fixture Controls"
          subtitle={!canManageFixtures ? 'Only league admins/system admins can use these controls.' : ''}
          open={isAdminControlsOpen}
          onToggle={() => setIsAdminControlsOpen((prev) => !prev)}
        >
          <div className="space-y-4">
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
                type="date"
                value={createForm.kickoff_date}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, kickoff_date: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />

              <input
                required
                type="time"
                lang="en-GB"
                step="60"
                value={createForm.kickoff_time}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, kickoff_time: event.target.value }))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={openVenuePickerForCreate}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                {createForm.venue || 'Choose a venue'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="md:col-span-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5"
              >
                {isSubmitting ? 'Creating Fixture...' : 'Create Match Manually'}
              </button>
              </fieldset>
            </form>
          </div>
        </AccordionSection>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Current/Played Fixtures</h2>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              Loading fixtures...
            </div>
          ) : playedMatches.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              No current/played fixtures available.
            </div>
          ) : (
            <div className="space-y-3">
              {playedMatches.map((match) => (
                <article key={`played-${match.id}`} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-center md:gap-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold md:self-start">
                      <Clock size={12} />
                      {formatDateTime(match.kickoff_at)}
                    </div>

                    <div className="min-w-0 grid grid-cols-3 items-center gap-4 w-full">
                      <div className="text-right font-bold text-slate-900 dark:text-slate-100 whitespace-normal wrap-break-word">
                        {match.home_team_name}
                      </div>
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">vs</span>
                      </div>
                      <div className="text-left font-bold text-slate-900 dark:text-slate-100 whitespace-normal wrap-break-word">
                        {match.away_team_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 md:justify-self-end md:flex-nowrap">
                      <MapPin size={14} />
                      <span>{match.venue || 'Venue TBA'}</span>
                      <button
                        type="button"
                        onClick={() => openVenueDetails(match)}
                        className="rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Venue
                      </button>
                    </div>

                    <span className="text-[11px] font-semibold uppercase px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 md:justify-self-end">
                      {match.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Upcoming Fixtures</h2>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              Loading fixtures...
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
              No upcoming fixtures available.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <article key={`upcoming-${match.id}`} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                      <Clock size={12} />
                      {formatDateTime(match.kickoff_at)}
                    </div>

                    <div className="flex-1 grid grid-cols-3 items-center gap-4 w-full">
                      <div className="text-right font-bold text-slate-900 dark:text-slate-100 whitespace-normal wrap-break-word">
                        {match.home_team_name}
                      </div>
                      <div className="flex justify-center">
                        <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest">vs</span>
                      </div>
                      <div className="text-left font-bold text-slate-900 dark:text-slate-100 whitespace-normal wrap-break-word">
                        {match.away_team_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={14} />
                      <span>{match.venue || 'Venue TBA'}</span>
                      <button
                        type="button"
                        onClick={() => openVenueDetails(match)}
                        className="rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Venue
                      </button>
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

        <AccordionSection
          title="Admin Fixture Management"
          subtitle={!canManageFixtures ? 'Only league admins/system admins can use these controls.' : ''}
          open={isAdminManagementOpen}
          onToggle={() => setIsAdminManagementOpen((prev) => !prev)}
        >
          {adminVisibleMatches.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500">
                No fixtures to manage.
              </div>
          ) : (
              <div className="space-y-3">
                {adminVisibleMatches.map((match) => (
                  <article key={`admin-${match.id}`} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {match.home_team_name} vs {match.away_team_name}
                      </div>
                      <div className="text-xs text-slate-500">ID #{match.id} • {formatDateTime(match.kickoff_at)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openScheduleEditor(match)} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">Edit Date/Time</button>
                      <button type="button" onClick={() => openVenuePickerForMatch(match)} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed">Edit Venue</button>
                      <button type="button" onClick={() => handleDeleteMatch(match)} disabled={!canManageFixtures} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300 disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                    </div>
                  </article>
                ))}
              </div>
          )}
        </AccordionSection>

        {scheduleEditor.isOpen ? (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
            <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit Kickoff</h3>
              <p className="text-xs text-slate-500">Use 24-hour time format (HH:mm).</p>

              <input
                type="date"
                value={scheduleEditor.date}
                onChange={(event) => setScheduleEditor((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />

              <input
                type="time"
                lang="en-GB"
                step="60"
                value={scheduleEditor.time}
                onChange={(event) => setScheduleEditor((prev) => ({ ...prev, time: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeScheduleEditor}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <VenuePickerModal
          isOpen={isVenuePickerOpen}
          onClose={() => setIsVenuePickerOpen(false)}
          onSelect={handleVenueSelected}
          initialVenue={venuePickerTarget.type === 'create' ? createForm.venue_details : getVenueFromMatch(venuePickerTarget.match || {})}
        />

        <VenueDetailsModal
          isOpen={Boolean(detailsVenue)}
          onClose={() => setDetailsVenue(null)}
          venue={detailsVenue}
        />
      </div>
    </main>
  );
}
