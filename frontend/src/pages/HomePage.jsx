import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import StatCard from '../components/ui/StatCard';
import BigButton from '../components/ui/BigButton';
import { Footprints, Dumbbell, TrendingUp, Flame, Timer, MapPin } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, plansRes] = await Promise.all([
          fetch(`${API_URL}/api/stats`, { credentials: 'include' }),
          fetch(`${API_URL}/api/plans`, { credentials: 'include' }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (plansRes.ok) {
          const plans = await plansRes.json();
          const active = plans.find((p) => p.attivo);
          setPlan(active || null);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const nome = user?.nome || user?.name || 'Amico';
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const giornoOggi = new Date().toLocaleDateString('it-IT', { weekday: 'long' });
  const giornoCapitalized = giornoOggi.charAt(0).toUpperCase() + giornoOggi.slice(1);

  const todayPlan = plan?.giorni?.find(
    (g) => g.giorno?.toLowerCase() === giornoCapitalized.toLowerCase()
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

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
          <WaltTheGoat state="idle" size={70} />
        </div>
      </div>

      {/* Walt's Message */}
      <div className="px-6 mb-6">
        <div className="bg-surface border border-border rounded-3xl p-5">
          <p className="text-text-primary text-base">
            {todayPlan
              ? todayPlan.tipo === 'camminata'
                ? `Oggi è giorno di camminata! Pronti per ${todayPlan.attivita?.[0]?.distanza_km || 2} km?`
                : `Oggi circuito pesi! ${todayPlan.attivita?.length || 4} esercizi ti aspettano.`
              : 'Nessun allenamento pianificato per oggi. Vuoi fare una camminata libera?'}
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
          <StatCard icon={Footprints} label="Passi" value={stats?.settimanale?.passi?.toLocaleString('it-IT') || 0} color="text-secondary" />
          <StatCard icon={Flame} label="Camminate" value={stats?.settimanale?.camminate || 0} color="text-accent" />
          <StatCard icon={Dumbbell} label="Circuiti" value={stats?.settimanale?.circuiti || 0} color="text-secondary" />
        </div>
      </div>

      {/* Today's Plan */}
      {todayPlan && (
        <div className="px-6 mb-6">
          <h2 className="text-lg font-bold font-heading text-text-primary mb-3">Piano di oggi</h2>
          <div className="bg-surface border border-border rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              {todayPlan.tipo === 'camminata' ? (
                <Footprints size={24} className="text-primary" />
              ) : (
                <Dumbbell size={24} className="text-secondary" />
              )}
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
    </div>
  );
};

export default HomePage;
