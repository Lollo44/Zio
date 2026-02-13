import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '../components/ui/StatCard';
import { MapPin, Footprints, Dumbbell, Flame, TrendingUp, Timer, Zap, Heart, Activity, Award, Target } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const COLORS = ['#fbbf24', '#10b981', '#f59e0b', '#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fb923c'];

const StatsPage = () => {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('panoramica');

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
    if (active && payload?.length) {
      return (
        <div className="bg-surface border border-border rounded-2xl p-3 shadow-xl">
          <p className="text-text-secondary text-xs mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }} className="font-bold text-sm">{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('it-IT') : p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { id: 'panoramica', label: 'Panoramica' },
    { id: 'camminate', label: 'Camminate' },
    { id: 'circuiti', label: 'Circuiti' },
    { id: 'trend', label: 'Trend' },
  ];

  // Prepare volume per exercise data for pie chart
  const volumeData = stats?.volume_per_esercizio ? Object.entries(stats.volume_per_esercizio).map(([name, vol], i) => ({
    name: name.replace('ex_', '').charAt(0).toUpperCase() + name.replace('ex_', '').slice(1),
    value: Math.round(vol),
  })).filter(d => d.value > 0) : [];

  // Radar chart data
  const radarData = stats ? [
    { metric: 'Distanza', value: Math.min(100, (stats.totale?.km || 0) * 10) },
    { metric: 'Passi', value: Math.min(100, (stats.totale?.passi || 0) / 500) },
    { metric: 'Circuiti', value: Math.min(100, (stats.totale?.allenamenti_circuito || 0) * 15) },
    { metric: 'Volume', value: Math.min(100, (stats.totale?.volume_totale_kg || 0) / 10) },
    { metric: 'Costanza', value: Math.min(100, (stats.streak || 0) * 15) },
    { metric: 'Calorie', value: Math.min(100, (stats.totale?.calorie_stimate || 0) / 10) },
  ] : [];

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="stats-page">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold font-heading text-text-primary">Statistiche</h1>
      </div>

      {/* Streak & Quick Stats */}
      <div className="px-6 mb-4">
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-primary/30 rounded-3xl p-5 flex items-center justify-between">
          <div>
            <p className="text-primary font-extrabold text-4xl font-heading">{stats?.streak || 0}</p>
            <p className="text-text-secondary text-sm">giorni di streak</p>
          </div>
          <div className="text-right">
            <p className="text-text-primary font-bold">{stats?.totale?.calorie_stimate || 0}</p>
            <p className="text-text-secondary text-sm">calorie stimate</p>
          </div>
          <div className="text-right">
            <p className="text-text-primary font-bold">{stats?.totale?.giorni_attivi || 0}</p>
            <p className="text-text-secondary text-sm">giorni attivi</p>
          </div>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="px-6 mb-4">
        <div className="flex bg-surface rounded-2xl p-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap px-2 ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-text-secondary'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* ===== PANORAMICA ===== */}
        {tab === 'panoramica' && (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={MapPin} label="Totale km" value={stats?.totale?.km || 0} unit="km" />
              <StatCard icon={Footprints} label="Totale passi" value={(stats?.totale?.passi || 0).toLocaleString('it-IT')} color="text-secondary" />
              <StatCard icon={Dumbbell} label="Circuiti" value={stats?.totale?.allenamenti_circuito || 0} color="text-secondary" />
              <StatCard icon={Flame} label="Volume kg" value={stats?.totale?.volume_totale_kg || 0} unit="kg" color="text-accent" />
              <StatCard icon={TrendingUp} label="Best km" value={stats?.record?.best_km || 0} unit="km" />
              <StatCard icon={Zap} label="Best velocità" value={stats?.record?.best_velocita || 0} unit="km/h" color="text-accent" />
            </div>

            {/* Radar chart */}
            {radarData.length > 0 && (
              <div className="bg-surface border border-border rounded-3xl p-5">
                <h3 className="text-text-primary font-bold mb-3">Profilo Fitness</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Daily Activity */}
            {stats?.grafici_giornalieri?.length > 0 && (
              <div className="bg-surface border border-border rounded-3xl p-5">
                <h3 className="text-text-primary font-bold mb-3">Attività ultimi 14 giorni</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.grafici_giornalieri}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 9 }} tickFormatter={(v) => v.slice(8)} />
                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="calorie" name="Calorie" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Volume per esercizio - Pie chart */}
            {volumeData.length > 0 && (
              <div className="bg-surface border border-border rounded-3xl p-5">
                <h3 className="text-text-primary font-bold mb-3">Volume per Gruppo Muscolare</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={volumeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {volumeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span className="text-text-secondary text-xs">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Averages */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Activity} label="Media km/camm." value={stats?.medie?.km_per_camminata || 0} unit="km" color="text-primary" />
              <StatCard icon={Gauge2} label="Velocità media" value={stats?.medie?.velocita_media || 0} unit="km/h" color="text-accent" />
              <StatCard icon={Timer} label="Media circuito" value={stats?.medie?.durata_circuito_media || 0} unit="min" color="text-secondary" />
              <StatCard icon={Heart} label="Calorie tot." value={stats?.totale?.calorie_stimate || 0} color="text-red-400" />
            </div>
          </>
        )}

        {/* ===== CAMMINATE ===== */}
        {tab === 'camminate' && (
          <>
            {/* Records */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Award} label="Best distanza" value={stats?.record?.best_km || 0} unit="km" color="text-primary" />
              <StatCard icon={Footprints} label="Best passi" value={(stats?.record?.best_passi || 0).toLocaleString('it-IT')} color="text-secondary" />
              <StatCard icon={Zap} label="Best velocità" value={stats?.record?.best_velocita || 0} unit="km/h" color="text-accent" />
              <StatCard icon={Timer} label="Più lunga" value={stats?.record?.camminata_piu_lunga_min || 0} unit="min" />
            </div>

            {/* Distance over time */}
            {stats?.grafici_camminate?.length > 0 && (
              <>
                <div className="bg-surface border border-border rounded-3xl p-5">
                  <h3 className="text-text-primary font-bold mb-3">Distanza per camminata</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={stats.grafici_camminate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="km" name="km" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-surface border border-border rounded-3xl p-5">
                  <h3 className="text-text-primary font-bold mb-3">Passi per camminata</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.grafici_camminate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="passi" name="Passi" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-surface border border-border rounded-3xl p-5">
                  <h3 className="text-text-primary font-bold mb-3">Velocità media</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={stats.grafici_camminate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="velocita" name="km/h" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-surface border border-border rounded-3xl p-5">
                  <h3 className="text-text-primary font-bold mb-3">Durata camminate</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.grafici_camminate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="tempo_min" name="Minuti" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
            {(!stats?.grafici_camminate || stats.grafici_camminate.length === 0) && (
              <div className="bg-surface border border-border rounded-3xl p-8 text-center">
                <Footprints size={40} className="text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">Nessuna camminata registrata.</p>
                <p className="text-text-secondary text-sm">Inizia la tua prima camminata!</p>
              </div>
            )}
          </>
        )}

        {/* ===== CIRCUITI ===== */}
        {tab === 'circuiti' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Dumbbell} label="Tot. circuiti" value={stats?.totale?.allenamenti_circuito || 0} color="text-secondary" />
              <StatCard icon={Flame} label="Volume tot." value={stats?.totale?.volume_totale_kg || 0} unit="kg" color="text-accent" />
              <StatCard icon={Timer} label="Tempo tot." value={stats?.totale?.tempo_circuito_min || 0} unit="min" />
              <StatCard icon={Timer} label="Media durata" value={stats?.medie?.durata_circuito_media || 0} unit="min" color="text-secondary" />
            </div>

            {stats?.grafici_circuiti?.length > 0 && (
              <>
                <div className="bg-surface border border-border rounded-3xl p-5">
                  <h3 className="text-text-primary font-bold mb-3">Volume allenamento</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={stats.grafici_circuiti}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="volume" name="Volume (kg)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-surface border border-border rounded-3xl p-5">
                  <h3 className="text-text-primary font-bold mb-3">Durata allenamenti</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={stats.grafici_circuiti}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 9 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="durata" name="Minuti" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Per-exercise records */}
            {stats?.record_esercizi && Object.keys(stats.record_esercizi).length > 0 && (
              <div className="bg-surface border border-border rounded-3xl p-5">
                <h3 className="text-text-primary font-bold mb-3">Record per esercizio</h3>
                <div className="space-y-2">
                  {Object.entries(stats.record_esercizi).map(([exId, rec]) => (
                    <div key={exId} className="flex items-center justify-between bg-surface-highlight rounded-2xl p-3">
                      <span className="text-text-primary font-medium capitalize">{exId.replace('ex_', '')}</span>
                      <div className="flex gap-3 text-sm">
                        <span className="text-primary font-bold">{rec.max_peso} kg</span>
                        <span className="text-secondary font-bold">{rec.max_reps} rip</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== TREND ===== */}
        {tab === 'trend' && (
          <>
            {/* Weekly comparison */}
            <div className="bg-surface border border-border rounded-3xl p-5">
              <h3 className="text-text-primary font-bold mb-3">Questa settimana vs Totale</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-highlight rounded-2xl p-3">
                  <p className="text-text-secondary text-xs">Km settimana</p>
                  <p className="text-primary font-bold text-xl">{stats?.settimanale?.km || 0}</p>
                  <p className="text-text-secondary text-xs">su {stats?.totale?.km || 0} tot.</p>
                </div>
                <div className="bg-surface-highlight rounded-2xl p-3">
                  <p className="text-text-secondary text-xs">Passi settimana</p>
                  <p className="text-secondary font-bold text-xl">{(stats?.settimanale?.passi || 0).toLocaleString('it-IT')}</p>
                  <p className="text-text-secondary text-xs">su {(stats?.totale?.passi || 0).toLocaleString('it-IT')} tot.</p>
                </div>
              </div>
            </div>

            {/* Monthly */}
            <div className="bg-surface border border-border rounded-3xl p-5">
              <h3 className="text-text-primary font-bold mb-3">Questo mese</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-primary font-bold text-2xl">{stats?.mensile?.km || 0}</p>
                  <p className="text-text-secondary text-xs">km</p>
                </div>
                <div className="text-center">
                  <p className="text-secondary font-bold text-2xl">{stats?.mensile?.camminate || 0}</p>
                  <p className="text-text-secondary text-xs">camminate</p>
                </div>
                <div className="text-center">
                  <p className="text-accent font-bold text-2xl">{stats?.mensile?.circuiti || 0}</p>
                  <p className="text-text-secondary text-xs">circuiti</p>
                </div>
              </div>
            </div>

            {/* Daily km + passi combined chart */}
            {stats?.grafici_giornalieri?.length > 0 && (
              <div className="bg-surface border border-border rounded-3xl p-5">
                <h3 className="text-text-primary font-bold mb-3">Attività giornaliera (14gg)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.grafici_giornalieri}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="data" tick={{ fill: '#a1a1aa', fontSize: 9 }} tickFormatter={(v) => v.slice(8)} />
                    <YAxis yAxisId="left" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar yAxisId="left" dataKey="km" name="Km" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="circuiti" name="Circuiti" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Gauge2 = (props) => <Zap {...props} />;

export default StatsPage;
