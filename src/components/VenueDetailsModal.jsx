import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, X } from 'lucide-react';
import ReactWeather from 'react-open-weather';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const FORECAST_WINDOW_DAYS = 15;
const WEATHER_ICON_PATH = 'M17.5 4a13.5 13.5 0 1 0 0.001 0z';
const WEATHER_THEME = {
  fontFamily: 'Helvetica, sans-serif',
  gradientStart: '#0181C2',
  gradientMid: '#04A7F9',
  gradientEnd: '#4BC4F7',
  locationFontColor: '#FFF',
  todayTempFontColor: '#FFF',
  todayDateFontColor: '#B5DEF4',
  todayRangeFontColor: '#B5DEF4',
  todayDescFontColor: '#B5DEF4',
  todayInfoFontColor: '#B5DEF4',
  todayIconColor: '#FFF',
  forecastBackgroundColor: '#FFF',
  forecastSeparatorColor: '#DDD',
  forecastDateColor: '#777',
  forecastDescColor: '#777',
  forecastRangeColor: '#777',
  forecastIconColor: '#4BC4F7',
  containerDropShadow: '0px 3px 6px 0px rgba(50, 50, 50, 0.5)'
};

function toDateOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toIsoDate(value) {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weatherDescriptionForCode(code) {
  const numeric = Number(code);

  if (numeric === 0) return 'Clear sky';
  if (numeric === 1) return 'Mainly clear';
  if (numeric === 2) return 'Partly cloudy';
  if (numeric === 3) return 'Overcast';
  if ([45, 48].includes(numeric)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(numeric)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(numeric)) return 'Rain';
  if ([71, 73, 75, 77].includes(numeric)) return 'Snow';
  if ([80, 81, 82].includes(numeric)) return 'Rain showers';
  if ([85, 86].includes(numeric)) return 'Snow showers';
  if ([95, 96, 99].includes(numeric)) return 'Thunderstorm';

  return 'Weather update';
}

export function VenueDetailsModal({ isOpen, onClose, venue }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [weatherState, setWeatherState] = useState({ isLoading: false, data: null });

  const latitude = Number(venue?.latitude);
  const longitude = Number(venue?.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  const weatherEligibility = useMemo(() => {
    const kickoffDate = toDateOnly(venue?.kickoff_at);
    if (!kickoffDate) {
      return { eligible: false, reason: 'Weather not available' };
    }

    if (String(venue?.status || '').toLowerCase() === 'completed') {
      return { eligible: false, reason: 'Weather not available' };
    }

    const now = new Date();
    const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const matchDay = Date.UTC(kickoffDate.getUTCFullYear(), kickoffDate.getUTCMonth(), kickoffDate.getUTCDate());
    const dayDiff = Math.floor((matchDay - startOfToday) / (1000 * 60 * 60 * 24));

    if (dayDiff < 0 || dayDiff > FORECAST_WINDOW_DAYS) {
      return { eligible: false, reason: 'Weather not available' };
    }

    if (!hasCoordinates) {
      return { eligible: false, reason: 'Weather not available' };
    }

    return {
      eligible: true,
      startDate: toIsoDate(kickoffDate),
      endDate: toIsoDate(kickoffDate)
    };
  }, [venue?.kickoff_at, venue?.status, hasCoordinates]);

  useEffect(() => {
    if (!isOpen || !hasCoordinates || !containerRef.current) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [longitude, latitude],
        zoom: 13
      });

      mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    } else {
      mapRef.current.resize();
      mapRef.current.setCenter([longitude, latitude]);
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: '#0f766e' }).setLngLat([longitude, latitude]).addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [isOpen, hasCoordinates, latitude, longitude]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !weatherEligibility.eligible) {
      setWeatherState({ isLoading: false, data: null });
      return;
    }

    let isCancelled = false;

    async function loadWeatherForMatchDate() {
      setWeatherState({ isLoading: true, data: null });

      try {
        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          timezone: 'auto',
          start_date: weatherEligibility.startDate,
          end_date: weatherEligibility.endDate,
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,relative_humidity_2m_mean'
        });

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        const payload = await response.json();
        const daily = payload?.daily;

        if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
          if (!isCancelled) {
            setWeatherState({ isLoading: false, data: null });
          }
          return;
        }

        const weatherCode = Number(daily.weather_code?.[0]);
        const maxTemp = Number(daily.temperature_2m_max?.[0]);
        const minTemp = Number(daily.temperature_2m_min?.[0]);
        const wind = Number(daily.wind_speed_10m_max?.[0]);
        const humidity = Number(daily.relative_humidity_2m_mean?.[0]);

        const formattedData = {
          current: {
            date: daily.time[0],
            description: weatherDescriptionForCode(weatherCode),
            icon: WEATHER_ICON_PATH,
            temperature: {
              current: Number.isFinite((maxTemp + minTemp) / 2) ? Math.round((maxTemp + minTemp) / 2) : 0,
              min: Number.isFinite(minTemp) ? Math.round(minTemp) : 0,
              max: Number.isFinite(maxTemp) ? Math.round(maxTemp) : 0
            },
            wind: Number.isFinite(wind) ? Math.round(wind) : 0,
            humidity: Number.isFinite(humidity) ? Math.round(humidity) : 0
          },
          forecast: []
        };

        if (!isCancelled) {
          setWeatherState({ isLoading: false, data: formattedData });
        }
      } catch {
        if (!isCancelled) {
          setWeatherState({ isLoading: false, data: null });
        }
      }
    }

    loadWeatherForMatchDate();

    return () => {
      isCancelled = true;
    };
  }, [
    isOpen,
    weatherEligibility,
    latitude,
    longitude
  ]);

  if (!isOpen) {
    return null;
  }

  const openInGoogleMapsUrl = (lat, longValue) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${longValue}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Venue Details</h3>
            <p className="text-sm text-slate-500">Location shown for this fixture.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin size={14} />
              {venue?.name || 'Venue not set'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{venue?.address || 'No address details available.'}</p>
            {hasCoordinates ? (
              <p className="text-[11px] text-slate-500 mt-1">{latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
            ) : null}
            {hasCoordinates ? (
              <button className="text-blue-500 hover:text-blue-700 text-sm mt-2" onClick={() => openInGoogleMapsUrl(latitude, longitude)}>
                Open in Google Maps
              </button>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weather Forecast</p>
            {!weatherEligibility.eligible ? (
              <p className="text-sm text-slate-500 mt-2">Weather not available</p>
            ) : weatherState.isLoading ? (
              <p className="text-sm text-slate-500 mt-2">Loading weather...</p>
            ) : weatherState.data ? (
              <div className="mt-2 max-w-sm weather-compact">
                <ReactWeather
                  data={weatherState.data}
                  isLoading={false}
                  errorMessage={null}
                  lang="en"
                  locationLabel={venue?.name || 'Match Venue'}
                  unitsLabels={{ temperature: 'C', windSpeed: 'km/h' }}
                  showForecast={false}
                  theme={WEATHER_THEME}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-2">Weather not available</p>
            )}
          </div>

          {hasCoordinates ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div ref={containerRef} className="h-90 w-full" />
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm p-4">
              This fixture has no map coordinates yet. Admins can set coordinates from the venue picker.
            </div>
          )}
        </div>
      </div>

      <style>{`
        .weather-compact .rw-container {
          box-shadow: none;
          border-radius: 10px;
          overflow: hidden;
        }

        .weather-compact .rw-container-main {
          min-height: 0;
          border-radius: 10px;
        }

        .weather-compact .rw-container-left {
          width: 100%;
          padding: 12px;
        }

        .weather-compact .rw-container-right {
          display: none;
        }

        .weather-compact .rw-container-header {
          font-size: 0.9rem;
          letter-spacing: 0.2px;
          margin: 0 0 6px 0;
        }

        .weather-compact .rw-today-current {
          font-size: 1.5rem;
          line-height: 1.2;
        }

        .weather-compact .rw-today-desc,
        .weather-compact .rw-today-info,
        .weather-compact .rw-today-range,
        .weather-compact .rw-today-date {
          font-size: 0.78rem;
        }

        .weather-compact .rw-today-hr {
          margin: 6px 0;
        }
      `}</style>
    </div>
  );
}
