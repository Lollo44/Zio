import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/ui/StatCard';
import { MapPin, Footprints, Dumbbell, Flame, TrendingUp, Timer } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const StatsPage = () => {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('camminate');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats`, { credentials: 'include' });
        if (res.ok) setStats(await res.json());
      } catch (err) { /* ignore */ }
    };
    fetchStats();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-2xl p-3 shadow-xl">
          <p className="text-text-secondary text-xs">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-text-primary font-bold text-sm">
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="stats-page">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold font-heading text-text-primary">Statistiche</h1>
      </div>

      {/* Overview Cards */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={MapPin} label="Totale km" value={stats?.totale?.km || 0} unit="km" />
          <StatCard icon={Footprints} label="Totale passi" value={(stats?.totale?.passi || 0).toLocaleString('it-IT')} color="text-secondary" />
          <StatCard icon={Dumbbell} label="Circuiti" value={stats?.totale?.allenamenti_circuito || 0} color="text-secondary" />
          <StatCard icon={Flame} label="Volume tot." value={stats?.totale?.volume_totale_kg || 0} unit="kg" color="text-accent" />
          <StatCard icon={TrendingUp} label="Best km" value={stats?.record?.best_km || 0} unit="km" color="text-primary" />
          <StatCard icon={Timer} label="Tempo tot." value={Math.round(stats?.totale?.tempo_camminata_min || 0)} unit="min" color="text-accent" />
        </div>
      </div>

      {/* Tab Switch */}
      <div className="px-6 mb-4">
        <div className="flex bg-surface rounded-2xl p-1">
          <button
            onClick={() => setTab('camminate')}
            data-testid="tab-camminate"
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
              tab === 'camminate' ? 'bg-primary text-primary-foreground' : 'text-text-secondary'
            }`}
          >
            Camminate
          </button>
          <button
            onClick={() => setTab('circuiti')}
            data-testid="tab-circuiti"
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
              tab === 'circuiti' ? 'bg-secondary text-white' : 'text-text-secondary'
            }`}
          >
            Circuiti
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="px-6">
        {tab === 'camminate' && (
          <div className="space-y-6">
            {/* Distance Chart */}
            <div className="bg-surface border border-border rounded-3xl p-5">
              <h3 className="text-text-primary font-bold mb-4">Distanza nel tempo</h3>
              {stats?.grafici_camminate?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.grafici_camminate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="km" name="km" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#fbbf24', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-text-secondary text-center py-8">Nessun dato ancora. Fai la tua prima camminata!</p>
              )}
            </div>

            {/* Steps Chart */}
            <div className="bg-surface border border-border rounded-3xl p-5">
              <h3 className="text-text-primary font-bold mb-4">Passi giornalieri</h3>
              {stats?.grafici_camminate?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.grafici_camminate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="passi" name="Passi" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-text-secondary text-center py-8">I tuoi passi appariranno qui.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'circuiti' && (
          <div className="space-y-6">
            {/* Volume Chart */}
            <div className="bg-surface border border-border rounded-3xl p-5">
              <h3 className="text-text-primary font-bold mb-4">Volume allenamento</h3>
              {stats?.grafici_circuiti?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.grafici_circuiti}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" name="Volume (kg)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-text-secondary text-center py-8">Nessun circuito registrato ancora.</p>
              )}
            </div>

            {/* Duration Chart */}
            <div className="bg-surface border border-border rounded-3xl p-5">
              <h3 className="text-text-primary font-bold mb-4">Durata allenamenti</h3>
              {stats?.grafici_circuiti?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.grafici_circuiti}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="durata" name="Minuti" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-text-secondary text-center py-8">I tuoi allenamenti appariranno qui.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
