import React from 'react';
import { 
  LayoutDashboard, 
  PenSquare, 
  Trophy, 
  Users, 
  Activity, 
  RefreshCw,
  Settings,
  UserCog,
  CalendarCheckIcon
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getCurrentUser, isAdminUser } from '../lib/auth';

export function Sidebar() {
  const user = getCurrentUser();
  const canAccessAdmin = isAdminUser(user);
  const canAccessSystemAdmin = user?.roles?.includes('system_admin');

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:block">
      <div className="h-full flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-blue-600 text-xs font-bold uppercase tracking-wider px-3">Baller League</h3>
          <p className="text-slate-900 dark:text-slate-100 text-sm font-semibold px-3">Baller League Dashboard</p>
        </div>
        
        <nav className="flex flex-col gap-1">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Baller League" />
          <NavItem to="/matches" icon={<CalendarCheckIcon size={20} />} label="Matches" />
          <NavItem to="/results" icon={<PenSquare size={20} />} label="Match Details" />
          <NavItem to="/standings" icon={<Trophy size={20} />} label="Standings" />
          <NavItem to="/teams" icon={<Users size={20} />} label="Teams" />
          <NavItem to="/stats" icon={<Activity size={20} />} label="Player Stats" />
          <NavItem
            to="/settings"
            icon={<Settings size={20} />}
            label="League Settings"
            disabled={!canAccessAdmin}
            note={!canAccessAdmin ? 'Admins only' : ''}
          />
          <NavItem
            to="/admin/users"
            icon={<UserCog size={20} />}
            label="System Users"
            disabled={!canAccessSystemAdmin}
            note={!canAccessSystemAdmin ? 'System admin only' : ''}
          />
        </nav>
        
        <div className="mt-auto p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Live Data Sync</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            System is ready for real-time recalculation of standings.
          </p>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, to, disabled = false, note = '' }) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 bg-slate-50/60 dark:bg-slate-800/40 cursor-not-allowed">
        {icon}
        <span className="text-sm font-medium">{label}</span>
        {note ? <span className="ml-auto text-[10px] uppercase tracking-wide">{note}</span> : null}
      </div>
    );
  }

  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        isActive 
          ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/30"
          : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      }
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}
