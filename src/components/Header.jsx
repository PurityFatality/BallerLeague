import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, Settings, Trophy } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuthSession, getStoredUser } from '../lib/api';
import { isAdminUser } from '../lib/auth';

export function Header() {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    function handleAuthChange() {
      setCurrentUser(getStoredUser());
    }

    window.addEventListener('auth:changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth:changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  function handleLogout() {
    clearAuthSession();
    setIsProfileOpen(false);
    navigate('/login');
  }

  const rolesText = currentUser?.roles?.length ? currentUser.roles.join(', ') : 'guest';
  const displayName = currentUser?.displayName || 'Guest';
  const canAccessAdmin = isAdminUser(currentUser);

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-10 py-3">
      <div className="flex items-center gap-4 md:gap-8">
        <div className="flex items-center gap-4 text-blue-600">
          <div className="size-8 flex items-center justify-center bg-blue-600/10 rounded-lg">
            <Trophy size={20} />
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight hidden md:block">
            Sports Manager
          </h2>
        </div>
        
        <label className="flex-col min-w-40 h-10 max-w-64 hidden md:flex">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div className="text-slate-500 flex border-none bg-slate-100 dark:bg-slate-800 items-center justify-center pl-4 rounded-l-lg border-r-0">
              <Search size={20} />
            </div>
            <input 
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none border-none bg-slate-100 dark:bg-slate-800 h-full placeholder:text-slate-500 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal" 
              placeholder="Search matches..." 
            />
          </div>
        </label>
      </div>
      
      <div className="flex flex-1 justify-end gap-4 md:gap-8 items-center">
        <nav className="items-center gap-6 hidden lg:flex">
          <NavLink to="/" className={({isActive}) => isActive ? "text-blue-600 text-sm font-bold border-b-2 border-blue-600 py-1" : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"}>Dashboard</NavLink>
          <NavLink to="/matches" className={({isActive}) => isActive ? "text-blue-600 text-sm font-bold border-b-2 border-blue-600 py-1" : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"}>Matches</NavLink>
          <NavLink to="/standings" className={({isActive}) => isActive ? "text-blue-600 text-sm font-bold border-b-2 border-blue-600 py-1" : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"}>Standings</NavLink>
          <NavLink to="/teams" className={({isActive}) => isActive ? "text-blue-600 text-sm font-bold border-b-2 border-blue-600 py-1" : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"}>Teams</NavLink>
        </nav>
        
        <div className="flex gap-2">
          <button className="flex items-center justify-center rounded-lg size-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Bell size={20} />
          </button>
          {canAccessAdmin ? (
            <NavLink to="/settings" className="flex items-center justify-center rounded-lg size-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <Settings size={20} />
            </NavLink>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                disabled
                className="flex items-center justify-center rounded-lg size-10 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                title="Only league admins/system admins can use settings"
              >
                <Settings size={20} />
              </button>
              <span className="text-[10px] text-slate-500">Admins only</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3" ref={profileMenuRef}>
          <div className="hidden md:flex flex-col items-end leading-tight min-w-0">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-36">{displayName}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500 truncate max-w-36">{rolesText}</span>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="bg-blue-600/20 rounded-full size-10 border-2 border-blue-600 overflow-hidden block focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
              aria-label="Open profile menu"
              aria-expanded={isProfileOpen}
            >
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgm1jniRijPGp-rEEHHXuqctyEYyuT0oLSap8vmA2e7u1QFlRD4mm4A3opIfAkO2e4WTRX0N5iyztXa6hEUcM7OrPE3YF4Wg_gecJqv58-DzSK4thQCaEn_gKWqm11vrh1Q_loo5fBhURWRuKRZLXLoT2Q6TXeWWoYOuCYxKzGBlBPit--0tk37tRMeLwV0x8F8X811LZbagpt7tkArRQ1BL0i7bMnmG_dpWB9E1Ii8Q1mSXKBejk-BGwbYFos8RLQVhWDJU9uDJY"
                alt="User profile"
                referrerPolicy="no-referrer"
              />
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1 z-50">
                {currentUser ? (
                  <>
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                    {canAccessAdmin ? (
                      <NavLink
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Admin Settings
                      </NavLink>
                    ) : (
                      <div className="rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed">
                        Admin Settings
                        <span className="ml-2 text-[10px]">Admins only</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setIsProfileOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/register"
                      onClick={() => setIsProfileOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Register
                    </NavLink>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
