import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import BigButton from '../components/ui/BigButton';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GIORNI_SETTIMANA = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const LIVELLI = ['Principiante', 'Intermedio', 'Avanzato'];
const OBIETTIVI = ['Mantenersi in forma', 'Perdere peso', 'Aumentare la resistenza', 'Socializzare camminando', 'Tonificare i muscoli'];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    nome: user?.name || '',
    eta: 72,
    peso: 75,
    altezza: 170,
    livello: 'Principiante',
    obiettivo: 'Mantenersi in forma',
    giorni_disponibili: ['Lunedì', 'Mercoledì', 'Venerdì'],
  });
  const [saving, setSaving] = useState(false);

  const steps = [
    {
      title: 'Come ti chiami?',
      subtitle: 'Walt vuole conoscerti!',
      mascotState: 'idle',
      content: (
        <div className="space-y-4">
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Il tuo nome"
            data-testid="onboarding-name"
            className="w-full h-14 bg-surface-highlight border border-border rounded-2xl px-5 text-text-primary text-lg focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      ),
    },
    {
      title: 'I tuoi dati',
      subtitle: 'Ci servono per personalizzare il piano',
      mascotState: 'idle',
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-text-secondary text-sm mb-1 block">Età</label>
            <input
              type="number"
              value={form.eta}
              onChange={(e) => setForm({ ...form, eta: parseInt(e.target.value) || 70 })}
              min={65}
              max={85}
              data-testid="onboarding-age"
              className="w-full h-14 bg-surface-highlight border border-border rounded-2xl px-5 text-text-primary text-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-secondary text-sm mb-1 block">Peso (kg)</label>
              <input
                type="number"
                value={form.peso}
                onChange={(e) => setForm({ ...form, peso: parseFloat(e.target.value) || 70 })}
                data-testid="onboarding-weight"
                className="w-full h-14 bg-surface-highlight border border-border rounded-2xl px-5 text-text-primary text-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1 block">Altezza (cm)</label>
              <input
                type="number"
                value={form.altezza}
                onChange={(e) => setForm({ ...form, altezza: parseFloat(e.target.value) || 170 })}
                data-testid="onboarding-height"
                className="w-full h-14 bg-surface-highlight border border-border rounded-2xl px-5 text-text-primary text-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Il tuo livello',
      subtitle: 'Seleziona la tua esperienza',
      mascotState: 'flexing',
      content: (
        <div className="space-y-3">
          {LIVELLI.map((l) => (
            <button
              key={l}
              onClick={() => setForm({ ...form, livello: l })}
              data-testid={`level-${l.toLowerCase()}`}
              className={`w-full h-14 rounded-2xl text-lg font-medium transition-all ${
                form.livello === l
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-amber-500/20'
                  : 'bg-surface-highlight border border-border text-text-primary hover:border-primary/50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Il tuo obiettivo',
      subtitle: 'Cosa vuoi raggiungere?',
      mascotState: 'walking',
      content: (
        <div className="space-y-3">
          {OBIETTIVI.map((o) => (
            <button
              key={o}
              onClick={() => setForm({ ...form, obiettivo: o })}
              data-testid={`goal-${o.toLowerCase().replace(/\s/g, '-')}`}
              className={`w-full h-12 rounded-2xl text-base font-medium transition-all ${
                form.obiettivo === o
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-amber-500/20'
                  : 'bg-surface-highlight border border-border text-text-primary hover:border-primary/50'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Giorni disponibili',
      subtitle: 'Quando vuoi allenarti?',
      mascotState: 'idle',
      content: (
        <div className="grid grid-cols-2 gap-3">
          {GIORNI_SETTIMANA.map((g) => (
            <button
              key={g}
              onClick={() => {
                const giorni = form.giorni_disponibili.includes(g)
                  ? form.giorni_disponibili.filter((d) => d !== g)
                  : [...form.giorni_disponibili, g];
                setForm({ ...form, giorni_disponibili: giorni });
              }}
              data-testid={`day-${g.toLowerCase()}`}
              className={`h-12 rounded-2xl text-base font-medium transition-all ${
                form.giorni_disponibili.includes(g)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-highlight border border-border text-text-primary hover:border-primary/50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      ),
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (resp.ok) {
        // Generate automatic plan
        await fetch(`${API_URL}/api/plans/generate`, {
          method: 'POST',
          credentials: 'include',
        });
        navigate('/home', { replace: true });
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="onboarding-page">
      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-surface-highlight'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col">
        {/* Mascot */}
        <div className="flex justify-center mb-6">
          <WaltTheGoat state={currentStep.mascotState} size={100} />
        </div>

        {/* Step content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-heading text-text-primary">{currentStep.title}</h2>
          <p className="text-text-secondary mt-1">{currentStep.subtitle}</p>
        </div>

        <div className="flex-1">{currentStep.content}</div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              data-testid="onboarding-back"
              className="h-16 px-6 bg-surface-highlight border border-border rounded-full text-text-primary font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <ChevronLeft size={20} /> Indietro
            </button>
          )}
          {isLast ? (
            <BigButton onClick={handleSave} disabled={saving} data-testid="onboarding-save">
              {saving ? 'Salvataggio...' : 'Iniziamo!'}
            </BigButton>
          ) : (
            <BigButton onClick={() => setStep(step + 1)} data-testid="onboarding-next">
              Avanti <ChevronRight size={20} />
            </BigButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
