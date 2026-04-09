import React, { useEffect, useState } from 'react';
import { MapPin, Users, Trophy, Star } from 'lucide-react';
import api from '../lib/api';

export function Teams() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    api.get('/teams')
      .then(({ data }) => data)
      .then(data => {
        // Enhance with mock data for visual consistency until DB has these fields
        const enhancedTeams = data.map((t) => ({
          ...t,
          capacity: '50,000',
          manager: 'Unknown',
          founded: '1900',
          colors: ['bg-slate-800', 'bg-white'],
          rating: 3
        }));
        setTeams(enhancedTeams);
      });
  }, []);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Teams
            </h1>
            <p className="text-slate-500 mt-1">Premier League Alpha • {teams.length} Teams</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
            <Users size={18} />
            Add New Team
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </main>
  );
}

const TeamCard = ({ team }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-24 bg-slate-100 dark:bg-slate-800 relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600 via-transparent to-transparent"></div>
        <div className="absolute -bottom-8 left-6">
          <div className="size-16 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2">
            <div className={`size-full rounded-lg ${team.colors[0]} opacity-80 flex items-center justify-center text-white font-bold text-xl`}>
              {team.name.charAt(0)}
            </div>
          </div>
        </div>
        <div className="absolute top-3 right-3 flex gap-1">
          {team.colors.map((color, i) => (
            <div key={i} className={`size-3 rounded-full ${color} ring-1 ring-slate-900/5`}></div>
          ))}
        </div>
      </div>
      
      <div className="pt-10 p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
            {team.name}
          </h3>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={12} 
                className={i < team.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300 dark:text-slate-700"} 
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <MapPin size={16} className="text-slate-400" />
            <span className="truncate">{team.stadium}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Users size={16} className="text-slate-400" />
            <span>{team.capacity} Capacity</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Trophy size={16} className="text-slate-400" />
            <span>Est. {team.founded}</span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="text-xs">
            <span className="text-slate-400 block">Manager</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{team.manager}</span>
          </div>
          <button className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}
