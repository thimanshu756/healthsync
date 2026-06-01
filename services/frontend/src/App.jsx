import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Activity, Users, Calendar, CreditCard, Bell } from 'lucide-react';
import Dashboard from './pages/Dashboard';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans text-slate-50">
      {/* Sidebar */}
      <div className="w-64 glass flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 text-primary-500">
            <Activity size={32} strokeWidth={2.5} />
            <h1 className="text-2xl font-bold tracking-tight text-white">HealthSync</h1>
          </div>
          
          <nav className="space-y-2">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-600/20 text-primary-500 font-medium transition-colors">
              <Activity size={20} />
              <span>Overview</span>
            </Link>
            <Link to="/patients" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors">
              <Users size={20} />
              <span>Patients</span>
            </Link>
            <Link to="/appointments" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors">
              <Calendar size={20} />
              <span>Appointments</span>
            </Link>
            <Link to="/billing" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors">
              <CreditCard size={20} />
              <span>Billing</span>
            </Link>
          </nav>
        </div>
        
        <div className="p-6 border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center font-bold shadow-lg">
              MD
            </div>
            <div>
              <p className="text-sm font-medium text-white">Dr. Smith</p>
              <p className="text-xs text-slate-400">Cardiology</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Header */}
        <header className="h-20 glass flex items-center justify-between px-10 z-10 border-b-0 border-l-0">
          <h2 className="text-xl font-semibold text-white">Dashboard Overview</h2>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer hover:text-primary-400 transition-colors">
              <Bell size={24} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-10 relative z-0">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<div className="text-slate-400">Patients module coming soon...</div>} />
          <Route path="/appointments" element={<div className="text-slate-400">Appointments module coming soon...</div>} />
          <Route path="/billing" element={<div className="text-slate-400">Billing module coming soon...</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
