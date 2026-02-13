import React, { useState, useEffect, useRef, useCallback } from 'react';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import BigButton from '../components/ui/BigButton';
import { Play, Square, Check, ChevronDown, ChevronUp, Timer, TrendingUp, TrendingDown, Minus, Edit3, Save, RefreshCw, Info, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CircuitPage = () => {
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState('idle');
  const [time, setTime] = useState(0);
  const [logs, setLogs] = useState({});
  const [expandedEx, setExpandedEx] = useState(null);
  const [history, setHistory] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [swapModal, setSwapModal] = useState(null); // { exId, alternatives: [] }
  const [exerciseInfo, setExerciseInfo] = useState(null); // For showing detailed info
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exRes, histRes, plansRes] = await Promise.all([
          fetch(`${API_URL}/api/exercises`, { credentials: 'include' }),
          fetch(`${API_URL}/api/circuits`, { credentials: 'include' }),
          fetch(`${API_URL}/api/plans`, { credentials: 'include' }),
        ]);
        if (exRes.ok) setExercises(await exRes.json());
        if (histRes.ok) setHistory(await histRes.json());
        if (plansRes.ok) {
          const plans = await plansRes.json();
          const active = plans.find((p) => p.attivo);
          setActivePlan(active || null);
        }
      } catch (err) { /* ignore */ }
    };
    fetchData();
  }, []);

  // Get today's circuit plan
  const giornoOggi = new Date().toLocaleDateString('it-IT', { weekday: 'long' });
  const giornoCapitalized = giornoOggi.charAt(0).toUpperCase() + giornoOggi.slice(1);
  const todayPlan = activePlan?.giorni?.find(g => g.giorno === giornoCapitalized && g.tipo === 'circuito');

  // Initialize logs from plan or defaults
  useEffect(() => {
    if (exercises.length === 0) return;
    const planExercises = todayPlan?.attivita || [];
    const newLogs = {};

    const exList = planExercises.length > 0 ? planExercises : exercises.slice(0, 5);
    exList.forEach((ex) => {
      const exId = ex.exercise_id || ex.nome;
      const numSerie = ex.serie || ex.serie_default || 3;
      const reps = ex.ripetizioni || ex.ripetizioni_default || 10;
      const peso = ex.peso_kg || ex.peso_default || 0;
      const sets = [];
      for (let i = 0; i < numSerie; i++) {
        sets.push({ set_number: i + 1, ripetizioni: reps, peso_kg: peso, completato: false });
      }
      newLogs[exId] = {
        nome: ex.nome,
        exercise_id: ex.exercise_id || exId,
        sets,
        piano_serie: numSerie,
        piano_ripetizioni: reps,
        piano_peso_kg: peso,
      };
    });
    setLogs(newLogs);
  }, [exercises, todayPlan]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const startCircuit = useCallback(() => {
    setStatus('active');
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => setTime(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
  }, []);

  const stopCircuit = useCallback(() => {
    setStatus('done');
    clearInterval(intervalRef.current);
  }, []);

  const saveCircuit = useCallback(async () => {
    const esercizi = Object.entries(logs).map(([exId, log]) => ({
      exercise_id: log.exercise_id,
      nome: log.nome,
      sets: log.sets,
      piano_serie: log.piano_serie,
      piano_ripetizioni: log.piano_ripetizioni,
      piano_peso_kg: log.piano_peso_kg,
    }));
    try {
      await fetch(`${API_URL}/api/circuits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ durata_minuti: Math.ceil(time / 60), esercizi }),
      });
      setStatus('idle');
      setTime(0);
      const res = await fetch(`${API_URL}/api/circuits`, { credentials: 'include' });
      if (res.ok) setHistory(await res.json());
    } catch (err) { console.error(err); }
  }, [logs, time]);

  const updateSet = (exId, setIdx, field, value) => {
    setLogs((prev) => {
      const newLogs = { ...prev };
      const newSets = [...newLogs[exId].sets];
      newSets[setIdx] = { ...newSets[setIdx], [field]: value };
      newLogs[exId] = { ...newLogs[exId], sets: newSets };
      return newLogs;
    });
  };

  const toggleSetComplete = (exId, setIdx) => {
    updateSet(exId, setIdx, 'completato', !logs[exId].sets[setIdx].completato);
  };

  const addSet = (exId) => {
    setLogs((prev) => {
      const newLogs = { ...prev };
      const lastSet = newLogs[exId].sets[newLogs[exId].sets.length - 1] || { ripetizioni: 10, peso_kg: 0 };
      newLogs[exId] = {
        ...newLogs[exId],
        sets: [...newLogs[exId].sets, {
          set_number: newLogs[exId].sets.length + 1,
          ripetizioni: lastSet.ripetizioni,
          peso_kg: lastSet.peso_kg,
          completato: false,
        }],
      };
      return newLogs;
    });
  };

  const removeSet = (exId) => {
    setLogs((prev) => {
      const newLogs = { ...prev };
      if (newLogs[exId].sets.length > 1) {
        newLogs[exId] = { ...newLogs[exId], sets: newLogs[exId].sets.slice(0, -1) };
      }
      return newLogs;
    });
  };

  // Edit plan exercise before starting
  const updatePlanExercise = async (exId, field, value) => {
    if (!activePlan) return;
    const giornIdx = activePlan.giorni.findIndex(g => g.giorno === giornoCapitalized && g.tipo === 'circuito');
    if (giornIdx < 0) return;
    const exIdx = activePlan.giorni[giornIdx].attivita.findIndex(a => (a.exercise_id || a.nome) === exId);
    if (exIdx < 0) return;
    try {
      const body = { giorno_index: giornIdx, exercise_index: exIdx };
      body[field] = value;
      await fetch(`${API_URL}/api/plans/${activePlan.plan_id}/exercise`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
    } catch (err) { console.error(err); }
  };

  // Smart Swap - fetch alternatives for an exercise
  const fetchAlternatives = async (exId) => {
    try {
      const res = await fetch(`${API_URL}/api/exercises/${exId}/alternatives`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSwapModal({ exId, original: data.esercizio_originale, alternatives: data.alternative });
      }
    } catch (err) { console.error(err); }
  };

  // Swap exercise in logs
  const swapExercise = (oldExId, newEx) => {
    setLogs(prev => {
      const newLogs = { ...prev };
      const oldLog = newLogs[oldExId];
      const numSerie = newEx.serie_default || oldLog.piano_serie || 3;
      const reps = newEx.ripetizioni_default || oldLog.piano_ripetizioni || 12;
      const peso = newEx.peso_default || 0;
      
      // Remove old exercise
      delete newLogs[oldExId];
      
      // Add new exercise with same position
      const newExId = newEx.exercise_id;
      const sets = [];
      for (let i = 0; i < numSerie; i++) {
        sets.push({ set_number: i + 1, ripetizioni: reps, peso_kg: peso, completato: false });
      }
      newLogs[newExId] = {
        nome: newEx.nome,
        exercise_id: newExId,
        categoria: newEx.categoria,
        descrizione: newEx.descrizione_tecnica,
        note: newEx.note_sicurezza,
        sets,
        piano_serie: numSerie,
        piano_ripetizioni: reps,
        piano_peso_kg: peso,
      };
      return newLogs;
    });
    setSwapModal(null);
  };

  // Show exercise info modal
  const showExerciseInfo = (ex) => {
    // Find full exercise details from exercises list
    const fullEx = exercises.find(e => e.exercise_id === ex.exercise_id);
    setExerciseInfo(fullEx || ex);
  };

  const totalSetsCompleted = Object.values(logs).reduce((acc, l) => acc + l.sets.filter(s => s.completato).length, 0);
  const totalSets = Object.values(logs).reduce((acc, l) => acc + l.sets.length, 0);

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="circuit-page">
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-text-primary">Circuito Pesi</h1>
          {status === 'active' && (
            <p className="text-primary font-bold text-lg mt-1" data-testid="circuit-timer">
              <Timer size={16} className="inline mr-1" />{formatTime(time)}
            </p>
          )}
        </div>
        <WaltTheGoat state={status === 'active' ? 'flexing' : 'idle'} size={80} />
      </div>

      {/* Controls */}
      <div className="px-6 mb-4">
        {status === 'idle' && (
          <BigButton onClick={startCircuit} data-testid="start-circuit-btn"><Play size={24} /> Inizia Circuito</BigButton>
        )}
        {status === 'active' && (
          <div className="flex items-center gap-3">
            <BigButton onClick={stopCircuit} variant="danger" className="flex-1" data-testid="stop-circuit-btn"><Square size={20} /> Termina</BigButton>
            <div className="bg-surface border border-border rounded-2xl px-4 py-2 text-center min-w-[80px]">
              <p className="text-text-secondary text-xs">Serie</p>
              <p className="text-primary font-bold">{totalSetsCompleted}/{totalSets}</p>
            </div>
          </div>
        )}
        {status === 'done' && (
          <div className="space-y-3">
            <div className="bg-surface border border-secondary/30 rounded-3xl p-5 text-center">
              <p className="text-secondary font-bold text-lg">Circuito completato!</p>
              <p className="text-text-secondary">{formatTime(time)} · {totalSetsCompleted} serie completate</p>
            </div>
            <BigButton onClick={saveCircuit} variant="secondary" data-testid="save-circuit-btn"><Save size={20} /> Salva circuito</BigButton>
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div className="px-6 space-y-3">
        <h2 className="text-lg font-bold font-heading text-text-primary">Esercizi</h2>
        {Object.entries(logs).map(([exId, log]) => {
          const isExpanded = expandedEx === exId;
          const completedSets = log.sets.filter(s => s.completato).length;
          const allComplete = completedSets === log.sets.length;

          // Calculate deviations for display
          const totalRipsDone = log.sets.filter(s => s.completato).reduce((acc, s) => acc + s.ripetizioni, 0);
          const pianoRipsTot = (log.piano_serie || 0) * (log.piano_ripetizioni || 0);
          const devRips = pianoRipsTot > 0 ? totalRipsDone - pianoRipsTot : null;
          const avgPeso = completedSets > 0 ? log.sets.filter(s => s.completato).reduce((acc, s) => acc + s.peso_kg, 0) / completedSets : 0;
          const devPeso = log.piano_peso_kg > 0 ? Math.round((avgPeso - log.piano_peso_kg) * 10) / 10 : null;
          const devSerie = log.piano_serie ? completedSets - log.piano_serie : null;

          return (
            <div key={exId} className={`bg-surface border rounded-3xl overflow-hidden transition-colors ${allComplete ? 'border-secondary/50' : 'border-border'}`} data-testid={`exercise-${exId}`}>
              <button onClick={() => setExpandedEx(isExpanded ? null : exId)} className="w-full p-4 flex items-center justify-between" data-testid={`toggle-${exId}`}>
                <div className="flex items-center gap-3">
                  {allComplete && <Check size={20} className="text-secondary" />}
                  <div className="text-left">
                    <p className={`font-bold ${allComplete ? 'text-secondary' : 'text-text-primary'}`}>{log.nome}</p>
                    <p className="text-text-secondary text-sm">{completedSets}/{log.sets.length} serie</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Deviation badges */}
                  {status !== 'idle' && devRips !== null && devRips !== 0 && (
                    <DeviationBadge value={devRips} label="rip" />
                  )}
                  {status !== 'idle' && devPeso !== null && devPeso !== 0 && (
                    <DeviationBadge value={devPeso} label="kg" />
                  )}
                  {isExpanded ? <ChevronUp size={20} className="text-text-secondary" /> : <ChevronDown size={20} className="text-text-secondary" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {/* Plan reference */}
                  {log.piano_serie && (
                    <div className="bg-surface-highlight rounded-xl p-2 text-text-secondary text-xs flex items-center justify-between">
                      <span>Piano: {log.piano_serie}x{log.piano_ripetizioni} @ {log.piano_peso_kg}kg</span>
                      {status === 'idle' && (
                        <button onClick={() => setEditingPlan(editingPlan === exId ? null : exId)} className="text-primary" data-testid={`edit-plan-${exId}`}>
                          <Edit3 size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Edit plan before start */}
                  {editingPlan === exId && status === 'idle' && (
                    <div className="bg-primary/10 rounded-xl p-3 space-y-2">
                      <p className="text-primary text-xs font-bold">Modifica piano</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-text-secondary text-xs">Serie</label>
                          <input type="number" value={log.piano_serie} onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            updatePlanExercise(exId, 'serie', val);
                            setLogs(prev => {
                              const newLogs = { ...prev };
                              const newSets = [];
                              for (let i = 0; i < val; i++) {
                                newSets.push(prev[exId].sets[i] || { set_number: i+1, ripetizioni: log.piano_ripetizioni, peso_kg: log.piano_peso_kg, completato: false });
                              }
                              newLogs[exId] = { ...prev[exId], sets: newSets, piano_serie: val };
                              return newLogs;
                            });
                          }} className="w-full h-10 bg-surface border border-border rounded-lg px-2 text-text-primary text-center focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="text-text-secondary text-xs">Rip</label>
                          <input type="number" value={log.piano_ripetizioni} onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            updatePlanExercise(exId, 'ripetizioni', val);
                            setLogs(prev => {
                              const newLogs = { ...prev };
                              newLogs[exId] = { ...prev[exId], piano_ripetizioni: val, sets: prev[exId].sets.map(s => ({ ...s, ripetizioni: val })) };
                              return newLogs;
                            });
                          }} className="w-full h-10 bg-surface border border-border rounded-lg px-2 text-text-primary text-center focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="text-text-secondary text-xs">Kg</label>
                          <input type="number" step="0.5" value={log.piano_peso_kg} onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updatePlanExercise(exId, 'peso_kg', val);
                            setLogs(prev => {
                              const newLogs = { ...prev };
                              newLogs[exId] = { ...prev[exId], piano_peso_kg: val, sets: prev[exId].sets.map(s => ({ ...s, peso_kg: val })) };
                              return newLogs;
                            });
                          }} className="w-full h-10 bg-surface border border-border rounded-lg px-2 text-text-primary text-center focus:outline-none focus:border-primary" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Individual sets */}
                  {log.sets.map((set, idx) => (
                    <div key={idx} className={`rounded-2xl p-3 transition-colors ${set.completato ? 'bg-secondary/10 border border-secondary/30' : 'bg-surface-highlight border border-transparent'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-text-secondary text-xs font-bold w-12">Set {set.set_number}</span>
                        {status === 'active' && (
                          <button onClick={() => toggleSetComplete(exId, idx)} data-testid={`set-${exId}-${idx}`}
                            className={`ml-auto w-8 h-8 rounded-full flex items-center justify-center transition-all ${set.completato ? 'bg-secondary text-white' : 'bg-surface border border-border text-text-secondary'}`}>
                            <Check size={14} />
                          </button>
                        )}
                        {set.completato && <span className="text-secondary text-xs">Fatto!</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-text-secondary text-xs">Ripetizioni</label>
                          <input type="number" value={set.ripetizioni} onChange={(e) => updateSet(exId, idx, 'ripetizioni', parseInt(e.target.value) || 0)}
                            disabled={status !== 'active'} className="w-full h-10 bg-surface border border-border rounded-lg px-2 text-text-primary text-center text-sm focus:outline-none focus:border-primary disabled:opacity-50" />
                        </div>
                        <div>
                          <label className="text-text-secondary text-xs">Peso (kg)</label>
                          <input type="number" step="0.5" value={set.peso_kg} onChange={(e) => updateSet(exId, idx, 'peso_kg', parseFloat(e.target.value) || 0)}
                            disabled={status !== 'active'} className="w-full h-10 bg-surface border border-border rounded-lg px-2 text-text-primary text-center text-sm focus:outline-none focus:border-primary disabled:opacity-50" />
                        </div>
                      </div>
                      {/* Per-set deviation from plan */}
                      {set.completato && log.piano_ripetizioni && (
                        <div className="flex gap-2 mt-2">
                          {set.ripetizioni !== log.piano_ripetizioni && (
                            <SetDeviation value={set.ripetizioni - log.piano_ripetizioni} label="rip" />
                          )}
                          {set.peso_kg !== log.piano_peso_kg && (
                            <SetDeviation value={Math.round((set.peso_kg - log.piano_peso_kg) * 10) / 10} label="kg" />
                          )}
                          {set.ripetizioni === log.piano_ripetizioni && set.peso_kg === log.piano_peso_kg && (
                            <span className="text-secondary text-xs flex items-center gap-1"><Minus size={10} /> Come da piano</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add/remove set buttons */}
                  {status === 'active' && (
                    <div className="flex gap-2">
                      <button onClick={() => addSet(exId)} className="flex-1 h-10 bg-surface-highlight border border-border rounded-xl text-text-secondary text-sm font-medium hover:border-primary/50" data-testid={`add-set-${exId}`}>
                        + Aggiungi serie
                      </button>
                      {log.sets.length > 1 && (
                        <button onClick={() => removeSet(exId)} className="h-10 px-4 bg-surface-highlight border border-border rounded-xl text-red-400 text-sm font-medium hover:border-red-400/50" data-testid={`remove-set-${exId}`}>
                          - Rimuovi
                        </button>
                      )}
                    </div>
                  )}

                  {/* Overall deviation summary */}
                  {completedSets > 0 && (
                    <div className="bg-surface-highlight rounded-xl p-3 mt-2">
                      <p className="text-text-secondary text-xs font-bold mb-1">Riepilogo vs Piano</p>
                      <div className="flex flex-wrap gap-2">
                        {devSerie !== null && <DeviationBadge value={devSerie} label="serie" />}
                        {devRips !== null && <DeviationBadge value={devRips} label="rip tot" />}
                        {devPeso !== null && <DeviationBadge value={devPeso} label="kg med" />}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent circuits */}
      {history.length > 0 && (
        <div className="px-6 mt-6">
          <h2 className="text-lg font-bold font-heading text-text-primary mb-3">Ultimi circuiti</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((c, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text-primary font-medium">{new Date(c.data).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                  <p className="text-text-secondary text-sm">{c.durata_minuti} min</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.esercizi?.map((ex, j) => {
                    const dev = ex.deviazioni;
                    return (
                      <span key={j} className="bg-surface-highlight rounded-lg px-2 py-1 text-xs text-text-secondary">
                        {ex.nome}
                        {dev && (dev.reps !== 0 || dev.peso_kg !== 0) && (
                          <span className={dev.reps > 0 || dev.peso_kg > 0 ? 'text-secondary ml-1' : 'text-red-400 ml-1'}>
                            {dev.reps > 0 && `+${dev.reps}r`}{dev.reps < 0 && `${dev.reps}r`}
                            {dev.peso_kg > 0 && ` +${dev.peso_kg}kg`}{dev.peso_kg < 0 && ` ${dev.peso_kg}kg`}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DeviationBadge = ({ value, label }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${isPositive ? 'bg-secondary/20 text-secondary' : 'bg-red-500/20 text-red-400'}`}>
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPositive ? '+' : ''}{value} {label}
    </span>
  );
};

const SetDeviation = ({ value, label }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`text-xs flex items-center gap-0.5 ${isPositive ? 'text-secondary' : 'text-red-400'}`}>
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPositive ? '+' : ''}{value} {label}
    </span>
  );
};

export default CircuitPage;
