import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';

export function PlayerStats() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    api.get('/players')
      .then(({ data }) => data)
      .then(data => {
        // Enhance with mock data
        const enhancedPlayers = data.map((p) => ({
          ...p,
          team: 'Unknown Team',
          apps: 0,
          goals: 0,
          assists: 0,
          rating: 6.0
        }));
        setPlayers(enhancedPlayers);
      });
  }, []);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Player Statistics
          </h1>
          <p className="text-slate-500 mt-1">Top performers across the league</p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input 
              type="text" 
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              placeholder="Search players..." 
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap">
              <Filter size={16} />
              Position
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap">
              <Filter size={16} />
              Team
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm shadow-blue-600/20">
              Export Data
            </button>
          </div>
        </div>

        {/* Stats Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Pos</th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-blue-600 group">
                    <div className="flex items-center justify-end gap-1">
                      Apps
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-blue-600 group">
                    <div className="flex items-center justify-end gap-1">
                      Goals
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-blue-600 group">
                    <div className="flex items-center justify-end gap-1">
                      Assists
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-blue-600 group">
                    <div className="flex items-center justify-end gap-1">
                      Rating
                      <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {players.map((player, index) => (
                  <tr key={player.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{player.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{player.team}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{player.apps}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">{player.goals}</td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{player.assists}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {player.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{players.length}</span> of <span className="font-medium">{players.length}</span> players
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
              <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
