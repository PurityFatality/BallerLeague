import React from 'react';
import { CheckCircle } from 'lucide-react';
import { MatchEntryCard } from '../components/MatchEntryCard';

export function ResultsEntry() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Results Entry
            </h1>
            <p className="text-slate-500 mt-1">Record match results and recalculate standings after each fixture.</p>
          </div>

          <div className="flex items-center gap-3 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={16} />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              Result Workflow Ready
            </span>
          </div>
        </div>

        <MatchEntryCard />
      </div>
    </main>
  );
}
