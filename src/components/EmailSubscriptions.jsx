import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { getCurrentUser } from '../lib/auth';

export function EmailSubscriptions() {
  const user = getCurrentUser();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadSubscription() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/email-subscriptions/me');
        setIsSubscribed(Boolean(data?.subscribed));
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Failed to load email subscription status');
      } finally {
        setIsLoading(false);
      }
    }

    loadSubscription();
  }, [user]);

  async function handleToggleSubscription() {
    if (!user || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const nextValue = !isSubscribed;
      const { data } = await api.put('/email-subscriptions/me', { subscribed: nextValue });
      setIsSubscribed(Boolean(data?.subscribed));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update email subscription');
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 max-w-xl">
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSubscription}
          disabled={isLoading || isSaving}
          className="inline-flex items-center justify-center rounded-lg border border-blue-200 text-blue-700 dark:text-blue-300 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-3 py-2 text-xs transition-colors"
        >
          {isLoading ? 'Loading...' : isSaving ? 'Saving...' : isSubscribed ? 'Unsubscribe from Email Notifications' : 'Subscribe to Email Notifications'}
        </button>
        <p className="text-xs text-slate-500">
          Subscribe to email notifications to receive updates when matches are created, have their venue/date/time changed, or are deleted.
        </p>
      </div>
      {errorMessage ? <p className="text-xs text-rose-600">{errorMessage}</p> : null}
    </div>
  );
}
