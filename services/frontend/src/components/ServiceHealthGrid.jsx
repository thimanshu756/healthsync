import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// Service definitions — each maps to a backend health route
const SERVICES = [
  {
    id: 'patient-service',
    name: 'Patient Service',
    description: 'Patient records & management',
    healthUrl: '/api/patients/health',
    tech: 'Node.js · Express',
    icon: '👤',
    accentColor: 'blue',
  },
  {
    id: 'appointment-service',
    name: 'Appointment Service',
    description: 'Scheduling & calendar management',
    healthUrl: '/api/appointments/health',
    tech: 'Node.js · Express',
    icon: '📅',
    accentColor: 'emerald',
  },
  {
    id: 'billing-service',
    name: 'Billing Service',
    description: 'Invoices, payments & revenue',
    healthUrl: '/api/billing/health',
    tech: 'C# · .NET 8',
    icon: '💳',
    accentColor: 'amber',
  },
  {
    id: 'ai-insights-service',
    name: 'AI Insights Service',
    description: 'Predictive analytics & insights',
    healthUrl: '/api/ai/health',
    tech: 'Python · FastAPI',
    icon: '🧠',
    accentColor: 'purple',
  },
  {
    id: 'notification-service',
    name: 'Notification Service',
    description: 'Email, SMS & push alerts',
    healthUrl: '/api/notifications/health',
    tech: 'Python · FastAPI',
    icon: '🔔',
    accentColor: 'rose',
  },
];

const POLL_INTERVAL_MS = 10_000;

const accentMap = {
  blue:    { ring: 'ring-blue-500/30',    dot: 'bg-blue-500',    glow: 'bg-blue-500/10',    text: 'text-blue-400',    pulse: '#3b82f6' },
  emerald: { ring: 'ring-emerald-500/30', dot: 'bg-emerald-500', glow: 'bg-emerald-500/10', text: 'text-emerald-400', pulse: '#10b981' },
  amber:   { ring: 'ring-amber-500/30',   dot: 'bg-amber-500',   glow: 'bg-amber-500/10',   text: 'text-amber-400',   pulse: '#f59e0b' },
  purple:  { ring: 'ring-purple-500/30',  dot: 'bg-purple-500',  glow: 'bg-purple-500/10',  text: 'text-purple-400',  pulse: '#a855f7' },
  rose:    { ring: 'ring-rose-500/30',    dot: 'bg-rose-500',    glow: 'bg-rose-500/10',    text: 'text-rose-400',    pulse: '#f43f5e' },
};

function formatLatency(ms) {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(date) {
  if (!date) return 'Never';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function ServiceCard({ service, status }) {
  const accent = accentMap[service.accentColor] || accentMap.blue;
  const isHealthy = status.healthy === true;
  const isLoading = status.loading === true;
  const isFirstLoad = status.lastChecked === null && isLoading;

  return (
    <div className={`service-health-card ${isHealthy ? 'healthy' : isLoading && isFirstLoad ? 'loading' : 'degraded'}`}>
      {/* Accent glow top-right */}
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-30 blur-xl ${accent.glow}`} />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{service.icon}</span>
          <div>
            <h3 className="text-white font-semibold text-sm leading-tight">{service.name}</h3>
            <p className="text-slate-500 text-xs mt-0.5">{service.tech}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className={`status-badge ${isFirstLoad ? 'status-badge--loading' : isHealthy ? 'status-badge--healthy' : 'status-badge--degraded'}`}>
          {isFirstLoad ? (
            <span className="shimmer-text">Checking…</span>
          ) : (
            <>
              <span className={`status-dot ${isHealthy ? 'status-dot--healthy' : 'status-dot--degraded'}`} />
              <span>{isHealthy ? 'Operational' : 'Degraded'}</span>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="relative z-10 text-slate-400 text-xs mb-4 leading-relaxed">{service.description}</p>

      {/* Metrics row */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-700/40">
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">Response</span>
          <span className={`text-sm font-semibold ${isHealthy ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isFirstLoad ? <span className="shimmer-inline w-10 h-3 inline-block rounded" /> : formatLatency(status.latencyMs)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider font-medium">Last Check</span>
          <span className="text-slate-400 text-xs">{formatTime(status.lastChecked)}</span>
        </div>
      </div>

      {/* Polling progress bar */}
      {!isFirstLoad && (
        <div className="relative z-10 mt-3">
          <div className="h-px bg-slate-700/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full poll-progress ${isHealthy ? 'poll-progress--healthy' : 'poll-progress--degraded'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceHealthGrid() {
  const [statuses, setStatuses] = useState(
    () => Object.fromEntries(SERVICES.map(s => [s.id, { healthy: null, latencyMs: null, lastChecked: null, loading: true }]))
  );

  const pollService = useCallback(async (service) => {
    const start = performance.now();
    try {
      const response = await axios.get(service.healthUrl, { timeout: 5000 });
      const latencyMs = Math.round(performance.now() - start);
      const isHealthy = response.status >= 200 && response.status < 300;
      setStatuses(prev => ({
        ...prev,
        [service.id]: { healthy: isHealthy, latencyMs, lastChecked: new Date(), loading: false },
      }));
    } catch {
      const latencyMs = Math.round(performance.now() - start);
      setStatuses(prev => ({
        ...prev,
        [service.id]: { healthy: false, latencyMs, lastChecked: new Date(), loading: false },
      }));
    }
  }, []);

  useEffect(() => {
    // Initial poll for all services
    SERVICES.forEach(s => pollService(s));

    // Set up 10-second interval polling for all services
    const interval = setInterval(() => {
      SERVICES.forEach(s => pollService(s));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pollService]);

  const healthyCount = Object.values(statuses).filter(s => s.healthy === true).length;
  const totalCount = SERVICES.length;
  const allHealthy = healthyCount === totalCount && Object.values(statuses).every(s => !s.loading);

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Microservice Health</h2>
          <p className="text-slate-400 text-sm mt-0.5">Live status — auto-refreshes every 10 seconds</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${
          allHealthy
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${allHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
          {healthyCount}/{totalCount} Operational
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {SERVICES.map(service => (
          <ServiceCard key={service.id} service={service} status={statuses[service.id]} />
        ))}
      </div>
    </section>
  );
}
