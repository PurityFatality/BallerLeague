import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { getCurrentUser } from '../lib/auth';

export function EmailSubscriptions() {
  const user = getCurrentUser();
  const userId = user?.id || user?._id || user?.sub || '';
  const userEmail = user?.email || '';
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEmailEntryOpen, setIsEmailEntryOpen] = useState(false);
  const [emailInput, setEmailInput] = useState(userEmail);

  useEffect(() => {
    async function loadSubscription() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/email-subscriptions/me');
        setIsSubscribed(Boolean(data?.subscribed));
        setEmailInput(data?.email || userEmail || '');
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Failed to load email subscription status');
      } finally {
        setIsLoading(false);
      }
    }

    loadSubscription();
  }, [userId, userEmail]);

  async function handleToggleSubscription() {
    if (!user || isSaving) {
      return;
    }

    if (!isSubscribed) {
      setErrorMessage('');
      setIsEmailEntryOpen(true);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const { data } = await api.put('/email-subscriptions/me', { subscribed: false });
      setIsSubscribed(Boolean(data?.subscribed));
      setIsEmailEntryOpen(false);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update email subscription');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubscribeWithEmail(event) {
    event.preventDefault();

    if (!user || isSaving) {
      return;
    }

    const normalizedEmail = emailInput.trim();
    if (!normalizedEmail) {
      setErrorMessage('Please enter an email address to subscribe.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const { data } = await api.put('/email-subscriptions/me', {
        subscribed: true,
        email: normalizedEmail
      });
      setIsSubscribed(Boolean(data?.subscribed));
      setEmailInput(data?.email || normalizedEmail);
      setIsEmailEntryOpen(false);
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

      {isEmailEntryOpen && !isSubscribed ? (
        <form onSubmit={handleSubscribeWithEmail} className="flex items-center gap-2 max-w-sm">
          <input
            type="email"
            required
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            placeholder="Enter notification email"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold px-2.5 py-1.5"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setIsEmailEntryOpen(false)}
            disabled={isSaving}
            className="rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold px-2.5 py-1.5"
          >
            Cancel
          </button>
        </form>
      ) : null}

      {errorMessage ? <p className="text-xs text-rose-600">{errorMessage}</p> : null}
    </div>
  );
}
