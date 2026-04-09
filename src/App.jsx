/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { Teams } from './pages/Teams';
import { PlayerStats } from './pages/PlayerStats';
import { Matches } from './pages/Matches';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Events } from './pages/Events';
import { ResultsEntry } from './pages/ResultsEntry';
import { Standings } from './pages/Standings';
import { getStoredUser } from './lib/api';

function AuthOnlyRoute({ children }) {
  const user = getStoredUser();
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function MainShell() {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header />
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/results" element={<ResultsEntry />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/stats" element={<PlayerStats />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/events" element={<Events />} />
          <Route path="*" element={<Overview />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthOnlyRoute><Login /></AuthOnlyRoute>} />
        <Route path="/register" element={<AuthOnlyRoute><Register /></AuthOnlyRoute>} />
        <Route path="*" element={<MainShell />} />
      </Routes>
    </BrowserRouter>
  );
}
