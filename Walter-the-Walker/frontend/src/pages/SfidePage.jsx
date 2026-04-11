import React, { useState, useEffect, useCallback } from 'react';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import BigButton from '../components/ui/BigButton';
import { Trophy, Flame, Footprints, Dumbbell, Zap, Target, RefreshCw, Award } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const iconMap = {
  footprints: Footprints,
  shoe: Footprints,
  dumbbell: Dumbbell,
  weight: Dumbbell,
  flame: Flame,
  zap: Zap,
  target: Target,
};

const SfidePage = () => {
  const [sfide, setSfide] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchSfide = useCallback(async () => {
    setLoading(true);
    try {
      // Check progress first
      await fetch(`${API_URL}/api/sfide/check-progress`, { method: 'POST', credentials: 'include' });
      const res = await fetch(`${API_URL}/api/sfide`, { credentials: 'include' });
      if (res.ok) setSfide(await res.json());
    } catch (err) { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSfide(); }, [fetchSfide]);

  const generateSfide = async () => {
    setGenerating(true);
    try {
      await fetch(`${API_URL}/api/sfide/generate`, { method: 'POST', credentials: 'include' });
      await fetchSfide();
    } catch (err) { /* ignore */ }
    setGenerating(false);
  };

  const activeSfide = sfide.filter(s => !s.completata && !s.scaduta);
  const completedSfide = sfide.filter(s => s.completata);

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="sfide-page">
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-text-primary">Sfide Goat</h1>
          <p className="text-text-secondary text-sm mt-1">Le sfide di Walt the GOAT!</p>
        </div>
        <WaltTheGoat state="trophy" size={80} />
      </div>

      {/* Completed count */}
      <div className="px-6 mb-4">
        <div className="bg-gradient-to-r from-amber-500/20 to-secondary/10 border border-primary/30 rounded-3xl p-5 flex items-center gap-4">
          <Trophy size={32} className="text-primary" />
          <div>
            <p className="text-primary font-extrabold text-3xl font-heading">{completedSfide.length}</p>
            <p className="text-text-secondary text-sm">sfide completate</p>
          </div>
          <div className="ml-auto">
            <p className="text-secondary font-bold text-lg">{activeSfide.length}</p>
            <p className="text-text-secondary text-xs">attive</p>
          </div>
        </div>
      </div>

      {/* Generate new challenges */}
      <div className="px-6 mb-4">
        <BigButton onClick={generateSfide} variant="outline" disabled={generating} data-testid="generate-sfide-btn">
          <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generazione...' : 'Nuove Sfide Goat!'}
        </BigButton>
      </div>

      {/* Active challenges */}
      {activeSfide.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-lg font-bold font-heading text-text-primary mb-3">Sfide attive</h2>
          <div className="space-y-3">
            {activeSfide.map((s) => {
              const Icon = iconMap[s.icona] || Target;
              const progress = s.target_value > 0 ? Math.min(100, (s.current_value / s.target_value) * 100) : 0;
              const daysLeft = Math.max(0, Math.ceil((new Date(s.scadenza) - new Date()) / (1000 * 60 * 60 * 24)));

              return (
                <div key={s.sfida_id} className="bg-surface border border-border rounded-3xl p-5 space-y-3" data-testid={`sfida-${s.sfida_id}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-bold">{s.nome}</p>
                      <p className="text-text-secondary text-sm">{s.descrizione}</p>
                    </div>
                    <span className="text-text-secondary text-xs bg-surface-highlight px-2 py-1 rounded-lg">{daysLeft}g</span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-secondary text-xs">{s.current_value} / {s.target_value}</span>
                      <span className="text-primary text-xs font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-surface-highlight rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No challenges */}
      {activeSfide.length === 0 && !loading && (
        <div className="px-6 mb-6">
          <div className="bg-surface border border-border rounded-3xl p-8 text-center">
            <Trophy size={48} className="text-text-secondary mx-auto mb-3" />
            <p className="text-text-primary font-bold">Nessuna sfida attiva</p>
            <p className="text-text-secondary text-sm mt-1">Genera nuove sfide per metterti alla prova!</p>
          </div>
        </div>
      )}

      {/* Completed challenges */}
      {completedSfide.length > 0 && (
        <div className="px-6">
          <h2 className="text-lg font-bold font-heading text-text-primary mb-3">Sfide completate</h2>
          <div className="space-y-2">
            {completedSfide.map((s) => {
              const Icon = iconMap[s.icona] || Award;
              return (
                <div key={s.sfida_id} className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <Icon size={18} className="text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-secondary font-bold text-sm">{s.nome}</p>
                    <p className="text-text-secondary text-xs">{s.descrizione}</p>
                  </div>
                  <Award size={20} className="text-primary" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SfidePage;
