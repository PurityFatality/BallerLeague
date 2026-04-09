import React from 'react';
import { Trophy } from 'lucide-react';
import { StandingsCard } from '../components/StandingsCard';
import { PerformanceTrendCard } from '../components/PerformanceTrendCard';

export function Standings() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Standings
            </h1>
            <p className="text-slate-500 mt-1">Track the current table, form trends, and season movement in one place.</p>
          </div>

          <div className="flex items-center gap-3 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800/50">
            <Trophy className="text-blue-600 dark:text-blue-400" size={16} />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
              Live Standings
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <StandingsCard />
          <PerformanceTrendCard />
        </div>
      </div>
    </main>
  );
}
