import React, { useState, useRef, useCallback, useEffect } from 'react';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import BigButton from '../components/ui/BigButton';
import StatCard from '../components/ui/StatCard';
import { Play, Pause, Square, MapPin, Timer, Footprints, Gauge } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WalkPage = () => {
  const [status, setStatus] = useState('idle'); // idle, active, paused, done
  const [time, setTime] = useState(0);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const stepsIntervalRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/walks`, { credentials: 'include' });
        if (res.ok) setHistory(await res.json());
      } catch (err) { /* ignore */ }
    };
    fetchHistory();
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startWalk = useCallback(() => {
    setStatus('active');
    startTimeRef.current = Date.now() - time * 1000;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTime(elapsed);
    }, 1000);

    // Simulate step counting (in a real PWA, use devicemotion or Pedometer API)
    stepsIntervalRef.current = setInterval(() => {
      setSteps((prev) => {
        const newSteps = prev + Math.floor(Math.random() * 3) + 1;
        // Estimate distance: avg stride ~0.65m for seniors
        const distKm = (newSteps * 0.65) / 1000;
        setDistance(Math.round(distKm * 100) / 100);
        return newSteps;
      });
    }, 1000);
  }, [time]);

  const pauseWalk = useCallback(() => {
    setStatus('paused');
    clearInterval(intervalRef.current);
    clearInterval(stepsIntervalRef.current);
  }, []);

  const stopWalk = useCallback(() => {
    setStatus('done');
    clearInterval(intervalRef.current);
    clearInterval(stepsIntervalRef.current);
    if (time > 0) {
      const avgSpeed = time > 0 ? (distance / (time / 3600)) : 0;
      setSpeed(Math.round(avgSpeed * 10) / 10);
    }
  }, [time, distance]);

  const saveWalk = useCallback(async () => {
    const avgSpeed = time > 0 ? (distance / (time / 3600)) : 0;
    try {
      await fetch(`${API_URL}/api/walks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          distanza_km: distance,
          tempo_secondi: time,
          passi: steps,
          velocita_media_kmh: Math.round(avgSpeed * 10) / 10,
        }),
      });
      // Reset
      setStatus('idle');
      setTime(0);
      setSteps(0);
      setDistance(0);
      setSpeed(0);
      // Refresh history
      const res = await fetch(`${API_URL}/api/walks`, { credentials: 'include' });
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error('Save error:', err);
    }
  }, [distance, time, steps]);

  const resetWalk = () => {
    setStatus('idle');
    setTime(0);
    setSteps(0);
    setDistance(0);
    setSpeed(0);
  };

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="walk-page">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold font-heading text-text-primary">Camminata</h1>
        <WaltTheGoat state={status === 'active' ? 'walking' : 'idle'} size={60} />
      </div>

      {/* Main Stats */}
      <div className="px-6 mb-6">
        <div className="bg-surface border border-border rounded-3xl p-6 text-center space-y-4">
          {/* Timer */}
          <div>
            <p className="text-text-secondary text-sm mb-1">Tempo</p>
            <p className="text-5xl font-extrabold font-heading text-primary tabular-nums" data-testid="walk-timer">
              {formatTime(time)}
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-text-secondary text-xs">Distanza</p>
              <p className="text-2xl font-bold text-text-primary" data-testid="walk-distance">{distance} <span className="text-sm">km</span></p>
            </div>
            <div>
              <p className="text-text-secondary text-xs">Passi</p>
              <p className="text-2xl font-bold text-text-primary" data-testid="walk-steps">{steps.toLocaleString('it-IT')}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs">Velocità</p>
              <p className="text-2xl font-bold text-text-primary" data-testid="walk-speed">
                {status === 'active' && time > 0 ? (distance / (time / 3600)).toFixed(1) : speed}
                <span className="text-sm"> km/h</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 mb-6 space-y-3">
        {status === 'idle' && (
          <BigButton onClick={startWalk} data-testid="start-walk-btn">
            <Play size={24} /> Avvia Camminata
          </BigButton>
        )}
        {status === 'active' && (
          <div className="grid grid-cols-2 gap-3">
            <BigButton onClick={pauseWalk} variant="outline" data-testid="pause-walk-btn">
              <Pause size={20} /> Pausa
            </BigButton>
            <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn">
              <Square size={20} /> Termina
            </BigButton>
          </div>
        )}
        {status === 'paused' && (
          <div className="grid grid-cols-2 gap-3">
            <BigButton onClick={startWalk} data-testid="resume-walk-btn">
              <Play size={20} /> Riprendi
            </BigButton>
            <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn-paused">
              <Square size={20} /> Termina
            </BigButton>
          </div>
        )}
        {status === 'done' && (
          <div className="space-y-3">
            <div className="bg-surface border border-secondary/30 rounded-3xl p-5">
              <p className="text-secondary font-bold text-lg mb-2">Riepilogo camminata</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={MapPin} label="Distanza" value={distance} unit="km" />
                <StatCard icon={Timer} label="Tempo" value={formatTime(time)} />
                <StatCard icon={Footprints} label="Passi" value={steps.toLocaleString('it-IT')} color="text-secondary" />
                <StatCard icon={Gauge} label="Velocità" value={speed} unit="km/h" color="text-accent" />
              </div>
            </div>
            <BigButton onClick={saveWalk} variant="secondary" data-testid="save-walk-btn">
              Salva camminata
            </BigButton>
            <BigButton onClick={resetWalk} variant="outline" data-testid="discard-walk-btn">
              Annulla
            </BigButton>
          </div>
        )}
      </div>

      {/* Recent walks */}
      {history.length > 0 && (
        <div className="px-6">
          <h2 className="text-lg font-bold font-heading text-text-primary mb-3">Ultime camminate</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((w, i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-text-primary font-medium">{new Date(w.data).toLocaleDateString('it-IT')}</p>
                  <p className="text-text-secondary text-sm">{w.passi} passi · {formatTime(w.tempo_secondi)}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold">{w.distanza_km} km</p>
                  <p className="text-text-secondary text-sm">{w.velocita_media_kmh} km/h</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkPage;
