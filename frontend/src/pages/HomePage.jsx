import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import StatCard from '../components/ui/StatCard';
import BigButton from '../components/ui/BigButton';
import { Footprints, Dumbbell, TrendingUp, Flame, Timer, MapPin, Trophy, RefreshCw, User } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [plan, setPlan] = useState(null);
  const [sfide, setSfide] = useState([]);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, plansRes, sfideRes] = await Promise.all([
          fetch(`${API_URL}/api/stats`, { credentials: 'include' }),
          fetch(`${API_URL}/api/plans`, { credentials: 'include' }),
          fetch(`${API_URL}/api/sfide`, { credentials: 'include' }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (plansRes.ok) {
          const plans = await plansRes.json();
          setPlan(plans.find((p) => p.attivo) || null);
        }
        if (sfideRes.ok) setSfide(await sfideRes.json());
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const nome = user?.nome || user?.name || 'Amico';
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const giornoOggi = new Date().toLocaleDateString('it-IT', { weekday: 'long' });
  const giornoCapitalized = giornoOggi.charAt(0).toUpperCase() + giornoOggi.slice(1);
  const todayPlan = plan?.giorni?.find((g) => g.giorno?.toLowerCase() === giornoCapitalized.toLowerCase());

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buongiorno';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const regeneratePlan = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/plans/generate`, { method: 'POST', credentials: 'include' });
      if (res.ok) setPlan(await res.json());
    } catch (err) { console.error(err); }
    setRegenerating(false);
  };

  const activeSfide = sfide.filter(s => !s.completata && !s.scaduta).slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="home-page">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm capitalize">{oggi}</p>
            <h1 className="text-3xl font-extrabold font-heading text-text-primary mt-1">
              {getGreeting()}, {nome}!
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <WaltTheGoat state="idle" size={70} />
            <button onClick={() => navigate('/profile')} className="w-10 h-10 bg-surface border border-border rounded-full flex items-center justify-center" data-testid="profile-btn">
              <User size={18} className="text-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Walt's Message */}
      <div className="px-6 mb-6">
        <div className="bg-surface border border-border rounded-3xl p-5">
          <p className="text-text-primary text-base">
            {todayPlan
              ? todayPlan.tipo === 'camminata'
                ? `Oggi camminiamo! Pronti per ${todayPlan.attivita?.[0]?.distanza_km || 2} km?`
                : `Circuito pesi oggi! ${todayPlan.attivita?.length || 4} esercizi ti aspettano.`
              : 'Nessun allenamento pianificato per oggi. Una camminata libera?'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-6 grid grid-cols-2 gap-3">
        <BigButton onClick={() => navigate('/walk')} className="h-14 text-base" data-testid="quick-walk-btn">
          <Footprints size={20} /> Camminata
        </BigButton>
        <BigButton onClick={() => navigate('/circuit')} variant="secondary" className="h-14 text-base" data-testid="quick-circuit-btn">
          <Dumbbell size={20} /> Circuito
        </BigButton>
      </div>

      {/* Weekly Stats */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-bold font-heading text-text-primary mb-3">Questa settimana</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={MapPin} label="Distanza" value={stats?.settimanale?.km || 0} unit="km" />
          <StatCard icon={Footprints} label="Passi" value={(stats?.settimanale?.passi || 0).toLocaleString('it-IT')} color="text-secondary" />
          <StatCard icon={Flame} label="Camminate" value={stats?.settimanale?.camminate || 0} color="text-accent" />
          <StatCard icon={Dumbbell} label="Circuiti" value={stats?.settimanale?.circuiti || 0} color="text-secondary" />
        </div>
      </div>

      {/* Today's Plan */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold font-heading text-text-primary">Piano di oggi</h2>
          <button onClick={regeneratePlan} disabled={regenerating} className="text-primary text-sm font-bold flex items-center gap-1" data-testid="regen-plan-btn">
            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} /> Rigenera
          </button>
        </div>
        {todayPlan ? (
          <div className="bg-surface border border-border rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              {todayPlan.tipo === 'camminata' ? <Footprints size={24} className="text-primary" /> : <Dumbbell size={24} className="text-secondary" />}
              <span className="text-text-primary font-bold text-lg capitalize">{todayPlan.tipo}</span>
            </div>
            {todayPlan.attivita?.map((a, i) => (
              <div key={i} className="bg-surface-highlight rounded-2xl p-3 text-text-secondary text-sm">
                <span className="text-text-primary font-medium">{a.nome}</span>
                {a.durata_minuti && <span> · {a.durata_minuti} min</span>}
                {a.distanza_km && <span> · {a.distanza_km} km</span>}
                {a.serie && <span> · {a.serie}x{a.ripetizioni}</span>}
                {a.peso_kg > 0 && <span> · {a.peso_kg} kg</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-3xl p-5 text-center">
            <p className="text-text-secondary">Nessun piano per oggi.</p>
            <button onClick={regeneratePlan} className="text-primary font-bold text-sm mt-2">Genera piano</button>
          </div>
        )}
      </div>

      {/* Active challenges preview */}
      {activeSfide.length > 0 && (
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-heading text-text-primary">Sfide Goat attive</h2>
            <button onClick={() => navigate('/sfide')} className="text-primary text-sm font-bold" data-testid="view-sfide-btn">Tutte</button>
          </div>
          <div className="space-y-2">
            {activeSfide.map(s => {
              const progress = s.target_value > 0 ? Math.min(100, (s.current_value / s.target_value) * 100) : 0;
              return (
                <div key={s.sfida_id} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
                  <Trophy size={20} className="text-primary" />
                  <div className="flex-1">
                    <p className="text-text-primary font-medium text-sm">{s.nome}</p>
                    <div className="h-2 bg-surface-highlight rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <span className="text-primary text-xs font-bold">{Math.round(progress)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Records */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-bold font-heading text-text-primary mb-3">I tuoi record</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={TrendingUp} label="Best distanza" value={stats?.record?.best_km || 0} unit="km" color="text-primary" />
          <StatCard icon={Timer} label="Totale camminate" value={Math.round(stats?.totale?.tempo_camminata_min || 0)} unit="min" color="text-accent" />
        </div>
      </div>

      {/* Streak */}
      {stats?.streak > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-primary/30 rounded-3xl p-5 flex items-center gap-4">
            <Flame size={32} className="text-primary" />
            <div>
              <p className="text-primary font-extrabold text-3xl font-heading">{stats.streak}</p>
              <p className="text-text-secondary text-sm">giorni di streak</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
