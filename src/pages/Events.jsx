import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock3, MapPin, Plus, RefreshCw } from 'lucide-react';
import { DatePicker } from 'rsuite';
import api from '../lib/api';

function formatDateTime(dateTime, timeZone) {
  if (!dateTime) {
    return 'Unknown time';
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timeZone || undefined
    }).format(new Date(dateTime));
  } catch {
    return dateTime;
  }
}

function buildEventId(title) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `league-game-${slug || 'event'}-${Date.now()}`;
}

export function Events() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDateTime: null,
    endDateTime: null,
    timeZone: 'Europe/London'
  });

  async function loadEvents() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data } = await api.get('/events');

      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = error?.response?.data?.message
        || (error?.code === 'ERR_NETWORK' ? 'Could not reach backend API. Start ballerleague-server on port 5000.' : '')
        || error.message
        || 'Could not fetch events';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const unsyncedCount = useMemo(
    () => events.filter((event) => !event.googleCalendarEventId).length,
    [events]
  );

  async function handleCreateEvent(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSyncMessage('');

    if (!formData.startDateTime || !formData.endDateTime) {
      setErrorMessage('Start and end date/time are required.');
      setIsSubmitting(false);
      return;
    }

    if (formData.endDateTime < formData.startDateTime) {
      setErrorMessage('End date/time must be after start date/time.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        id: buildEventId(formData.title),
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start: {
          dateTime: new Date(formData.startDateTime).toISOString(),
          timeZone: formData.timeZone
        },
        end: {
          dateTime: new Date(formData.endDateTime).toISOString(),
          timeZone: formData.timeZone
        },
        allDay: false,
        googleCalendarEventId: null
      };

      const { data } = await api.post('/events', payload);

      setEvents((prev) => [data, ...prev]);
      setFormData({
        title: '',
        description: '',
        location: '',
        startDateTime: null,
        endDateTime: null,
        timeZone: formData.timeZone
      });
    } catch (error) {
      const message = error?.response?.data?.message
        || (error?.code === 'ERR_NETWORK' ? 'Could not reach backend API. Start ballerleague-server on port 5000.' : '')
        || error.message
        || 'Could not create event';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSyncToGoogle(targetEventId) {
    if (targetEventId) {
      setSyncMessage(`Event ${targetEventId} is ready for Google Calendar sync. API hook will be added next.`);
      return;
    }

    setSyncMessage('All unsynced events are ready. Google Calendar API sync action will be connected next.');
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Match Events
            </h1>
            <p className="text-slate-500 mt-1">
              Create and store events in MongoDB, then sync them to Google Calendar later.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSyncToGoogle('')}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 transition-colors"
          >
            <RefreshCw size={16} />
            Sync Unsynced ({unsyncedCount})
          </button>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40">
            {errorMessage}
          </div>
        ) : null}

        {syncMessage ? (
          <div className="rounded-lg border border-blue-300 bg-blue-50 text-blue-700 px-4 py-3 text-sm dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40">
            {syncMessage}
          </div>
        ) : null}

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-5 max-w-3xl">
          <div className="flex items-center gap-2 mb-5">
            <Plus size={18} className="text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Event</h2>
          </div>

          <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</span>
              <input
                required
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Soccer Match - Falcons vs Eagles"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Location</span>
              <input
                value={formData.location}
                onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="City Park Field 1"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</span>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Regular season game"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Start</span>
              <DatePicker
                oneTap
                editable={false}
                format="dd/MM/yy HH:mm"
                placeholder="dd/mm/yy hh:mm"
                value={formData.startDateTime}
                onChange={(value) => setFormData((prev) => ({ ...prev, startDateTime: value }))}
                className="w-full"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">End</span>
              <DatePicker
                oneTap
                editable={false}
                format="dd/MM/yy HH:mm"
                placeholder="dd/mm/yy hh:mm"
                value={formData.endDateTime}
                onChange={(value) => setFormData((prev) => ({ ...prev, endDateTime: value }))}
                className="w-full"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Time Zone</span>
              <select
                required
                value={formData.timeZone}
                onChange={(event) => setFormData((prev) => ({ ...prev, timeZone: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Europe/London">London (Europe/London)</option>
                <option value="Africa/Cairo">Cairo (Africa/Cairo)</option>
              </select>
            </label>

            <div className="md:col-span-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm px-4 py-2 transition-colors"
              >
                <Calendar size={16} />
                {isSubmitting ? 'Saving Event...' : 'Save Event'}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Scheduled Events</h2>
            <button
              type="button"
              onClick={loadEvents}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 text-sm text-slate-500">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No events yet. Create your first event above.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{event.title}</h3>
                      <p className="text-sm text-slate-500">{event.description || 'No description'}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {formatDateTime(event.start?.dateTime, event.start?.timeZone)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} />
                          {event.location || 'No location'}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {event.allDay ? 'All Day' : 'Timed'}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${event.googleCalendarEventId ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                          {event.googleCalendarEventId ? 'Synced' : 'Not Synced'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSyncToGoogle(event.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 text-blue-700 dark:text-blue-300 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold px-4 py-2 text-sm transition-colors"
                    >
                      <RefreshCw size={14} />
                      Sync to Google Calendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
