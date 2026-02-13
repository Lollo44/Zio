import React, { useState, useEffect, useRef, useCallback } from 'react';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import BigButton from '../components/ui/BigButton';
import { Play, Square, Check, ChevronDown, ChevronUp, Timer } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CircuitPage = () => {
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, active, done
  const [time, setTime] = useState(0);
  const [logs, setLogs] = useState({});
  const [expandedEx, setExpandedEx] = useState(null);
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exRes, histRes] = await Promise.all([
          fetch(`${API_URL}/api/exercises`, { credentials: 'include' }),
          fetch(`${API_URL}/api/circuits`, { credentials: 'include' }),
        ]);
        if (exRes.ok) {
          const data = await exRes.json();
          setExercises(data);
          const initialLogs = {};
          data.forEach((ex) => {
            initialLogs[ex.exercise_id] = {
              serie: ex.serie_default || 2,
              ripetizioni: ex.ripetizioni_default || 10,
              peso_kg: ex.peso_default || 0,
              completato: false,
            };
          });
          setLogs(initialLogs);
        }
        if (histRes.ok) setHistory(await histRes.json());
      } catch (err) { /* ignore */ }
    };
    fetchData();
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startCircuit = useCallback(() => {
    setStatus('active');
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopCircuit = useCallback(() => {
    setStatus('done');
    clearInterval(intervalRef.current);
  }, []);

  const saveCircuit = useCallback(async () => {
    const esercizi = exercises
      .filter((ex) => logs[ex.exercise_id]?.completato)
      .map((ex) => ({
        exercise_id: ex.exercise_id,
        nome: ex.nome,
        serie: logs[ex.exercise_id].serie,
        ripetizioni: logs[ex.exercise_id].ripetizioni,
        peso_kg: logs[ex.exercise_id].peso_kg,
      }));

    try {
      await fetch(`${API_URL}/api/circuits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          durata_minuti: Math.ceil(time / 60),
          esercizi,
        }),
      });
      setStatus('idle');
      setTime(0);
      const resetLogs = {};
      exercises.forEach((ex) => {
        resetLogs[ex.exercise_id] = {
          serie: ex.serie_default || 2,
          ripetizioni: ex.ripetizioni_default || 10,
          peso_kg: ex.peso_default || 0,
          completato: false,
        };
      });
      setLogs(resetLogs);
      const res = await fetch(`${API_URL}/api/circuits`, { credentials: 'include' });
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error('Save error:', err);
    }
  }, [exercises, logs, time]);

  const updateLog = (exId, field, value) => {
    setLogs((prev) => ({
      ...prev,
      [exId]: { ...prev[exId], [field]: value },
    }));
  };

  const completedCount = Object.values(logs).filter((l) => l.completato).length;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="circuit-page">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-text-primary">Circuito Pesi</h1>
          {status === 'active' && (
            <p className="text-primary font-bold text-lg mt-1" data-testid="circuit-timer">
              <Timer size={16} className="inline mr-1" />{formatTime(time)}
            </p>
          )}
        </div>
        <WaltTheGoat state={status === 'active' ? 'flexing' : 'idle'} size={60} />
      </div>

      {/* Controls */}
      <div className="px-6 mb-4">
        {status === 'idle' && (
          <BigButton onClick={startCircuit} data-testid="start-circuit-btn">
            <Play size={24} /> Inizia Circuito
          </BigButton>
        )}
        {status === 'active' && (
          <div className="flex items-center gap-3">
            <BigButton onClick={stopCircuit} variant="danger" data-testid="stop-circuit-btn">
              <Square size={20} /> Termina
            </BigButton>
            <div className="bg-surface border border-border rounded-2xl px-4 py-2 text-center">
              <p className="text-text-secondary text-xs">Completati</p>
              <p className="text-primary font-bold">{completedCount}/{exercises.length}</p>
            </div>
          </div>
        )}
        {status === 'done' && (
          <div className="space-y-3">
            <div className="bg-surface border border-secondary/30 rounded-3xl p-5 text-center">
              <p className="text-secondary font-bold text-lg">Circuito completato!</p>
              <p className="text-text-secondary">{formatTime(time)} · {completedCount} esercizi</p>
            </div>
            <BigButton onClick={saveCircuit} variant="secondary" data-testid="save-circuit-btn">
              Salva circuito
            </BigButton>
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div className="px-6 space-y-3">
        <h2 className="text-lg font-bold font-heading text-text-primary">Esercizi</h2>
        {exercises.map((ex) => {
          const log = logs[ex.exercise_id] || {};
          const isExpanded = expandedEx === ex.exercise_id;
          return (
            <div
              key={ex.exercise_id}
              className={`bg-surface border rounded-3xl overflow-hidden transition-colors ${
                log.completato ? 'border-secondary/50' : 'border-border'
              }`}
              data-testid={`exercise-${ex.exercise_id}`}
            >
              <button
                onClick={() => setExpandedEx(isExpanded ? null : ex.exercise_id)}
                className="w-full p-4 flex items-center justify-between"
                data-testid={`toggle-${ex.exercise_id}`}
              >
                <div className="flex items-center gap-3">
                  {log.completato && <Check size={20} className="text-secondary" />}
                  <div className="text-left">
                    <p className={`font-bold ${log.completato ? 'text-secondary' : 'text-text-primary'}`}>{ex.nome}</p>
                    <p className="text-text-secondary text-sm">{ex.gruppo_muscolare} · {ex.descrizione}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-text-secondary" /> : <ChevronDown size={20} className="text-text-secondary" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-text-secondary text-xs block mb-1">Serie</label>
                      <input
                        type="number"
                        value={log.serie || 0}
                        onChange={(e) => updateLog(ex.exercise_id, 'serie', parseInt(e.target.value) || 0)}
                        data-testid={`serie-${ex.exercise_id}`}
                        className="w-full h-12 bg-surface-highlight border border-border rounded-xl px-3 text-text-primary text-center text-lg focus:outline-none focus:border-primary"
                        disabled={status !== 'active'}
                      />
                    </div>
                    <div>
                      <label className="text-text-secondary text-xs block mb-1">Ripetizioni</label>
                      <input
                        type="number"
                        value={log.ripetizioni || 0}
                        onChange={(e) => updateLog(ex.exercise_id, 'ripetizioni', parseInt(e.target.value) || 0)}
                        data-testid={`rip-${ex.exercise_id}`}
                        className="w-full h-12 bg-surface-highlight border border-border rounded-xl px-3 text-text-primary text-center text-lg focus:outline-none focus:border-primary"
                        disabled={status !== 'active'}
                      />
                    </div>
                    <div>
                      <label className="text-text-secondary text-xs block mb-1">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={log.peso_kg || 0}
                        onChange={(e) => updateLog(ex.exercise_id, 'peso_kg', parseFloat(e.target.value) || 0)}
                        data-testid={`peso-${ex.exercise_id}`}
                        className="w-full h-12 bg-surface-highlight border border-border rounded-xl px-3 text-text-primary text-center text-lg focus:outline-none focus:border-primary"
                        disabled={status !== 'active'}
                      />
                    </div>
                  </div>
                  {status === 'active' && (
                    <button
                      onClick={() => updateLog(ex.exercise_id, 'completato', !log.completato)}
                      data-testid={`complete-${ex.exercise_id}`}
                      className={`w-full h-12 rounded-2xl font-bold transition-all ${
                        log.completato
                          ? 'bg-secondary/20 text-secondary border border-secondary/30'
                          : 'bg-surface-highlight border border-border text-text-primary hover:border-primary/50'
                      }`}
                    >
                      {log.completato ? 'Completato!' : 'Segna come completato'}
                    </button>
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
              <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-text-primary font-medium">{new Date(c.data).toLocaleDateString('it-IT')}</p>
                  <p className="text-text-secondary text-sm">{c.esercizi?.length || 0} esercizi · {c.durata_minuti} min</p>
                </div>
                <div className="text-right">
                  <p className="text-secondary font-bold">
                    {c.esercizi?.reduce((acc, e) => acc + (e.serie * e.ripetizioni * e.peso_kg), 0).toFixed(0)} kg vol.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircuitPage;
