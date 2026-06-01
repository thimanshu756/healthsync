import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Calendar, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';

const StatCard = ({ title, value, icon, trend, colorClass }) => (
  <div className="glass-card p-6 flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 ${colorClass}`}></div>
    
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20 backdrop-blur-sm`}>
        {icon}
      </div>
      {trend && (
        <span className="flex items-center text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
          <TrendingUp size={14} className="mr-1" />
          {trend}
        </span>
      )}
    </div>
    
    <h3 className="text-slate-400 font-medium text-sm mb-1 relative z-10">{title}</h3>
    <p className="text-3xl font-bold text-white relative z-10">{value}</p>
  </div>
);

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetching from the API Gateway (NGINX Ingress)
      const [patientsRes, appointmentsRes] = await Promise.all([
        axios.get('/api/patients').catch(e => ({ data: [] })),
        axios.get('/api/appointments').catch(e => ({ data: [] }))
      ]);
      
      setPatients(patientsRes.data || []);
      setAppointments(appointmentsRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setError("Unable to connect to microservices. Make sure they are running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Welcome back, Dr. Smith</h1>
          <p className="text-slate-400">Here's what's happening at HealthSync today.</p>
        </div>
        
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors disabled:opacity-50 shadow-lg shadow-primary-500/20"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Total Patients" 
          value={loading ? "..." : patients.length} 
          icon={<Users size={24} className="text-blue-400" />} 
          trend="+12%"
          colorClass="bg-blue-500"
        />
        <StatCard 
          title="Appointments Today" 
          value={loading ? "..." : appointments.length} 
          icon={<Calendar size={24} className="text-emerald-400" />} 
          trend="+5%"
          colorClass="bg-emerald-500"
        />
        <StatCard 
          title="AI Insights Generated" 
          value="24" 
          icon={<AlertCircle size={24} className="text-purple-400" />} 
          trend="+18%"
          colorClass="bg-purple-500"
        />
        <StatCard 
          title="Revenue (MTD)" 
          value="$12,450" 
          icon={<Users size={24} className="text-amber-400" />} 
          trend="+8%"
          colorClass="bg-amber-500"
        />
      </div>

      {/* Recent Patients Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Recent Patients</h2>
          <button className="text-sm font-medium text-primary-400 hover:text-primary-300">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">DOB</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">Loading patients...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">No patients found in database.</td>
                </tr>
              ) : (
                patients.slice(0, 5).map((patient, i) => (
                  <tr key={patient.id || i} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                      </div>
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{patient.dateOfBirth?.substring(0, 10) || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-300">{patient.contactNumber || patient.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
