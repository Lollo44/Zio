import React, { useState, useRef, useCallback, useEffect } from 'react';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import BigButton from '../components/ui/BigButton';
import StatCard from '../components/ui/StatCard';
import { Play, Pause, Square, MapPin, Timer, Footprints, Gauge, Save, X, RotateCcw, Navigation, Search, Sliders, ArrowLeft, Route, Locate } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WalkPage = () => {
  // Mode: 'select' | 'libera' | 'percorso_setup' | 'percorso_preview' | 'active' | 'paused' | 'done'
  const [mode, setMode] = useState('select');
  const [walkType, setWalkType] = useState(null); // 'libera' | 'percorso'
  
  // Walk tracking state
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);
  const [gpsError, setGpsError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [selectedWalk, setSelectedWalk] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastPosRef = useRef(null);
  const distanceRef = useRef(0);

  // Route planning state
  const [targetKm, setTargetKm] = useState(3);
  const [routeType, setRouteType] = useState('circolare'); // 'circolare' | 'lineare'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/walks`, { credentials: 'include' });
        if (res.ok) setHistory(await res.json());
      } catch (err) { /* ignore */ }
    };
    fetchHistory();
    // Get current position once
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS non disponibile su questo dispositivo');
      return;
    }
    setGpsError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: gpsSpeed, accuracy } = pos.coords;
        const point = { lat: latitude, lng: longitude, time: Date.now(), accuracy };
        setCurrentPos({ lat: latitude, lng: longitude });

        if (accuracy && accuracy > 30) return;

        if (lastPosRef.current) {
          const d = haversineDistance(lastPosRef.current.lat, lastPosRef.current.lng, latitude, longitude);
          const timeDiff = (point.time - lastPosRef.current.time) / 1000;
          const calculatedSpeed = timeDiff > 0 ? (d / timeDiff) * 3600 : 0;
          const isValidMovement = d > 0.005 && calculatedSpeed > 0.5 && calculatedSpeed < 15;
          
          if (isValidMovement) {
            distanceRef.current += d;
            setDistance(Math.round(distanceRef.current * 100) / 100);
            lastPosRef.current = point;
            setPositions((prev) => [...prev, point]);
            const displaySpeed = (gpsSpeed && gpsSpeed > 0.1) 
              ? Math.round(gpsSpeed * 3.6 * 10) / 10 
              : Math.round(calculatedSpeed * 10) / 10;
            setSpeed(displaySpeed);
          }
        } else {
          lastPosRef.current = point;
          setPositions([point]);
        }
      },
      (err) => setGpsError(`Errore GPS: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  }, []);

  const startWalk = useCallback(() => {
    setMode('active');
    startTimeRef.current = Date.now() - time * 1000;
    intervalRef.current = setInterval(() => {
      setTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    startGPS();
  }, [time, startGPS]);

  const pauseWalk = useCallback(() => {
    setMode('paused');
    clearInterval(intervalRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const stopWalk = useCallback(() => {
    setMode('done');
    clearInterval(intervalRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (time > 0 && distance > 0) {
      setSpeed(Math.round((distance / (time / 3600)) * 10) / 10);
    }
  }, [time, distance]);

  const estimatedSteps = Math.round(distance * 1000 / 0.65);
  const estimatedCalories = Math.round(distance * 60);

  const saveWalk = useCallback(async () => {
    setSaveError(null);
    try {
      const avgSpeed = time > 0 ? Math.round((distance / (time / 3600)) * 10) / 10 : 0;
      const response = await fetch(`${API_URL}/api/walks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          distanza_km: distance,
          tempo_secondi: time,
          passi: estimatedSteps,
          velocita_media_kmh: avgSpeed,
          percorso: positions.map(p => ({ lat: p.lat, lng: p.lng })),
        }),
      });
      if (response.ok) {
        resetAll();
        const res = await fetch(`${API_URL}/api/walks`, { credentials: 'include' });
        if (res.ok) setHistory(await res.json());
      } else {
        setSaveError('Impossibile salvare la passeggiata. Riprova.');
      }
    } catch (err) {
      setSaveError('Errore di rete. Controlla la connessione.');
    }
  }, [distance, time, positions, estimatedSteps]);

  const resetAll = () => {
    setMode('select');
    setWalkType(null);
    setTime(0);
    setDistance(0);
    setSpeed(0);
    setPositions([]);
    setPlannedRoute(null);
    distanceRef.current = 0;
    lastPosRef.current = null;
  };

  // Route planning functions
  const generateRoute = async () => {
    if (!currentPos) {
      setGpsError('Posizione GPS non disponibile. Attiva il GPS e riprova.');
      return;
    }
    setGenerating(true);
    setGpsError(null);
    try {
      const body = {
        lat: currentPos.lat,
        lng: currentPos.lng,
        distanza_km: targetKm,
        tipo: routeType,
      };
      if (routeType === 'lineare' && selectedDest) {
        body.destinazione_lat = selectedDest.lat;
        body.destinazione_lng = selectedDest.lng;
      }
      const res = await fetch(`${API_URL}/api/routes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setPlannedRoute(data);
        setMode('percorso_preview');
      } else {
        const err = await res.json().catch(() => ({}));
        setGpsError(err.detail || 'Errore nella generazione del percorso');
      }
    } catch (err) {
      setGpsError('Errore di rete. Riprova.');
    }
    setGenerating(false);
  };

  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/routes/geocode?q=${encodeURIComponent(searchQuery)}`, { credentials: 'include' });
      if (res.ok) setSearchResults(await res.json());
    } catch (err) { /* ignore */ }
    setSearching(false);
  };

  const startPlannedWalk = () => {
    setWalkType('percorso');
    startWalk();
  };

  const isActive = mode === 'active';
  const isPaused = mode === 'paused';

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="walk-page">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode !== 'select' && !isActive && !isPaused && mode !== 'done' && (
            <button onClick={resetAll} className="text-text-secondary" data-testid="back-btn">
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-2xl font-extrabold font-heading text-text-primary">Camminata</h1>
        </div>
        <WaltTheGoat state={isActive ? 'walking' : 'idle'} size={80} />
      </div>

      {gpsError && (
        <div className="px-6 mb-4">
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-3 text-red-300 text-sm" data-testid="gps-error">{gpsError}</div>
        </div>
      )}
      {saveError && (
        <div className="px-6 mb-4">
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-3 text-red-300 text-sm">
            {saveError}
            <button type="button" onClick={() => setSaveError(null)} className="ml-2 underline">Chiudi</button>
          </div>
        </div>
      )}

      {/* === MODE SELECT === */}
      {mode === 'select' && (
        <div className="px-6 space-y-4">
          <p className="text-text-secondary text-sm">Scegli la modalità di camminata</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setWalkType('libera'); setMode('libera'); }}
              className="bg-surface border border-border rounded-3xl p-5 text-center hover:border-primary/50 transition-all active:scale-95"
              data-testid="mode-libera-btn"
            >
              <Navigation size={32} className="text-primary mx-auto mb-2" />
              <p className="text-text-primary font-bold text-lg">Libera</p>
              <p className="text-text-secondary text-xs mt-1">Traccia GPS in tempo reale</p>
            </button>
            <button
              onClick={() => { setWalkType('percorso'); setMode('percorso_setup'); }}
              className="bg-surface border border-border rounded-3xl p-5 text-center hover:border-secondary/50 transition-all active:scale-95"
              data-testid="mode-percorso-btn"
            >
              <Route size={32} className="text-secondary mx-auto mb-2" />
              <p className="text-text-primary font-bold text-lg">Percorso</p>
              <p className="text-text-secondary text-xs mt-1">Pianifica il tragitto</p>
            </button>
          </div>

          {/* Walk history */}
          {history.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold font-heading text-text-primary mb-3">Ultime camminate</h2>
              <div className="space-y-2">
                {history.slice(0, 8).map((w, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedWalk(selectedWalk?.walk_id === w.walk_id ? null : w)}
                    className={`w-full bg-surface border rounded-2xl p-4 flex items-center justify-between transition-colors ${selectedWalk?.walk_id === w.walk_id ? 'border-primary/50' : 'border-border'}`}
                    data-testid={`walk-history-${i}`}
                  >
                    <div className="text-left">
                      <p className="text-text-primary font-medium">{new Date(w.data).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      <p className="text-text-secondary text-sm">{(w.passi || 0).toLocaleString('it-IT')} passi · {formatTime(w.tempo_secondi || 0)}</p>
                      {w.percorso?.length > 0 && <p className="text-primary text-xs mt-1"><MapPin size={10} className="inline" /> Percorso GPS</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold text-lg">{typeof w.distanza_km === 'number' ? w.distanza_km.toFixed(1) : w.distanza_km} km</p>
                      <p className="text-text-secondary text-sm">{typeof w.velocita_media_kmh === 'number' ? w.velocita_media_kmh.toFixed(1) : w.velocita_media_kmh} km/h</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedWalk?.percorso?.length > 1 && (
            <div className="bg-surface border border-border rounded-3xl p-4">
              <h3 className="text-text-primary font-bold mb-2">Percorso</h3>
              <MapPreview percorso={selectedWalk.percorso} />
            </div>
          )}
        </div>
      )}

      {/* === FREE WALK (LIBERA) === */}
      {(mode === 'libera' || (isActive && walkType === 'libera') || (isPaused && walkType === 'libera') || (mode === 'done' && walkType === 'libera')) && (
        <FreeWalkView
          mode={mode}
          time={time}
          distance={distance}
          speed={speed}
          positions={positions}
          estimatedSteps={estimatedSteps}
          estimatedCalories={estimatedCalories}
          formatTime={formatTime}
          startWalk={() => { setWalkType('libera'); startWalk(); }}
          pauseWalk={pauseWalk}
          stopWalk={stopWalk}
          saveWalk={saveWalk}
          resetAll={resetAll}
        />
      )}

      {/* === ROUTE PLANNING SETUP === */}
      {mode === 'percorso_setup' && (
        <div className="px-6 space-y-4">
          {/* KM Slider */}
          <div className="bg-surface border border-border rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-primary font-bold flex items-center gap-2"><Sliders size={16} className="text-primary" /> Distanza desiderata</p>
              <span className="text-primary font-extrabold text-2xl font-heading" data-testid="target-km-display">{targetKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="0.5"
              value={targetKm}
              onChange={(e) => setTargetKm(parseFloat(e.target.value))}
              className="w-full h-2 bg-surface-highlight rounded-full appearance-none cursor-pointer accent-primary"
              data-testid="km-slider"
            />
            <div className="flex justify-between text-text-secondary text-xs mt-1">
              <span>1 km</span><span>25 km</span>
            </div>
          </div>

          {/* Route type */}
          <div className="bg-surface border border-border rounded-3xl p-5 space-y-3">
            <p className="text-text-primary font-bold">Tipo di percorso</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setRouteType('circolare'); setSelectedDest(null); }}
                className={`rounded-2xl p-4 text-center border transition-all ${routeType === 'circolare' ? 'bg-primary/15 border-primary/50 text-primary' : 'bg-surface-highlight border-border text-text-secondary'}`}
                data-testid="route-type-circular"
              >
                <RotateCcw size={24} className="mx-auto mb-1" />
                <p className="font-bold text-sm">Circolare</p>
                <p className="text-xs opacity-70">Ritorna al punto di partenza</p>
              </button>
              <button
                onClick={() => setRouteType('lineare')}
                className={`rounded-2xl p-4 text-center border transition-all ${routeType === 'lineare' ? 'bg-secondary/15 border-secondary/50 text-secondary' : 'bg-surface-highlight border-border text-text-secondary'}`}
                data-testid="route-type-linear"
              >
                <Navigation size={24} className="mx-auto mb-1" />
                <p className="font-bold text-sm">Verso un luogo</p>
                <p className="text-xs opacity-70">Scegli la destinazione</p>
              </button>
            </div>
          </div>

          {/* Address search for linear */}
          {routeType === 'lineare' && (
            <div className="bg-surface border border-border rounded-3xl p-5 space-y-3">
              <p className="text-text-primary font-bold flex items-center gap-2"><Search size={16} /> Destinazione</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
                  placeholder="Cerca indirizzo..."
                  className="flex-1 h-12 bg-surface-highlight border border-border rounded-2xl px-4 text-text-primary text-sm focus:outline-none focus:border-primary placeholder:text-text-secondary/50"
                  data-testid="address-input"
                />
                <button
                  onClick={searchAddress}
                  disabled={searching}
                  className="h-12 px-4 bg-primary rounded-2xl text-black font-bold text-sm disabled:opacity-50"
                  data-testid="search-address-btn"
                >
                  {searching ? '...' : <Search size={18} />}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedDest(r); setSearchResults([]); }}
                      className={`w-full text-left p-3 rounded-xl text-sm transition-colors ${selectedDest?.lat === r.lat ? 'bg-secondary/20 border border-secondary/40' : 'bg-surface-highlight hover:bg-surface-highlight/80'}`}
                      data-testid={`search-result-${i}`}
                    >
                      <p className="text-text-primary line-clamp-2">{r.nome}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedDest && (
                <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-3 flex items-center gap-2">
                  <MapPin size={14} className="text-secondary flex-shrink-0" />
                  <p className="text-secondary text-sm line-clamp-1">{selectedDest.nome}</p>
                  <button onClick={() => setSelectedDest(null)} className="ml-auto text-text-secondary"><X size={14} /></button>
                </div>
              )}
            </div>
          )}

          {/* Current position indicator */}
          <div className="bg-surface-highlight rounded-2xl p-3 flex items-center gap-2 text-text-secondary text-sm">
            <Locate size={14} className={currentPos ? 'text-green-400' : 'text-red-400'} />
            {currentPos ? `Posizione GPS: ${currentPos.lat.toFixed(4)}, ${currentPos.lng.toFixed(4)}` : 'Rilevamento posizione GPS...'}
          </div>

          {/* Generate button */}
          <BigButton
            onClick={generateRoute}
            disabled={generating || !currentPos || (routeType === 'lineare' && !selectedDest)}
            data-testid="generate-route-btn"
          >
            {generating ? (
              <><RotateCcw size={20} className="animate-spin" /> Calcolo percorso...</>
            ) : (
              <><Route size={20} /> Genera Percorso</>
            )}
          </BigButton>
        </div>
      )}

      {/* === ROUTE PREVIEW === */}
      {mode === 'percorso_preview' && plannedRoute && (
        <div className="px-6 space-y-4">
          <div className="bg-surface border border-secondary/30 rounded-3xl p-5">
            <p className="text-secondary font-bold text-lg mb-1">Percorso generato</p>
            <div className="flex items-center gap-4 text-text-secondary text-sm">
              <span className="flex items-center gap-1"><Route size={14} className="text-primary" /> {plannedRoute.distanza_km} km</span>
              <span className="flex items-center gap-1"><Timer size={14} className="text-accent" /> ~{plannedRoute.durata_stimata_min} min</span>
            </div>
          </div>

          {/* Route map preview */}
          <div className="bg-surface border border-border rounded-3xl p-4">
            <h3 className="text-text-primary font-bold mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-primary" /> Anteprima percorso
            </h3>
            <RouteMapPreview percorso={plannedRoute.percorso} currentPos={currentPos} height="h-64" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <BigButton onClick={() => { setPlannedRoute(null); setMode('percorso_setup'); }} variant="outline" data-testid="regenerate-route-btn">
              <RotateCcw size={18} /> Rigenera
            </BigButton>
            <BigButton onClick={startPlannedWalk} variant="secondary" data-testid="start-planned-walk-btn">
              <Play size={18} /> Avvia
            </BigButton>
          </div>
        </div>
      )}

      {/* === ACTIVE / PAUSED with route === */}
      {(isActive || isPaused) && walkType === 'percorso' && (
        <div className="px-6 space-y-4">
          {/* Stats compact */}
          <div className="bg-surface border border-border rounded-3xl p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-text-secondary text-xs">Tempo</p>
                <p className="text-primary font-bold text-lg tabular-nums" data-testid="walk-timer">{formatTime(time)}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Distanza</p>
                <p className="text-text-primary font-bold text-lg" data-testid="walk-distance">{distance} <span className="text-xs">km</span></p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Velocità</p>
                <p className="text-text-primary font-bold text-lg" data-testid="walk-speed">{speed} <span className="text-xs">km/h</span></p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Passi</p>
                <p className="text-text-primary font-bold text-lg" data-testid="walk-steps">{estimatedSteps.toLocaleString('it-IT')}</p>
              </div>
            </div>
            {plannedRoute && (
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-center gap-4 text-xs text-text-secondary">
                <span>Obiettivo: {plannedRoute.distanza_km} km</span>
                <span className="text-primary font-bold">{plannedRoute.distanza_km > 0 ? Math.min(100, Math.round((distance / plannedRoute.distanza_km) * 100)) : 0}%</span>
              </div>
            )}
          </div>

          {/* Live map with route and position */}
          <div className="bg-surface border border-primary/20 rounded-3xl p-4">
            <LiveWalkMap
              plannedRoute={plannedRoute?.percorso}
              currentPos={currentPos}
              walkedPositions={positions.map(p => ({ lat: p.lat, lng: p.lng }))}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            {isActive ? (
              <>
                <BigButton onClick={pauseWalk} variant="outline" data-testid="pause-walk-btn"><Pause size={20} /> Pausa</BigButton>
                <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn"><Square size={20} /> Termina</BigButton>
              </>
            ) : (
              <>
                <BigButton onClick={startWalk} data-testid="resume-walk-btn"><Play size={20} /> Riprendi</BigButton>
                <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn-p"><Square size={20} /> Termina</BigButton>
              </>
            )}
          </div>
        </div>
      )}

      {/* === DONE with route === */}
      {mode === 'done' && walkType === 'percorso' && (
        <div className="px-6 space-y-4">
          <div className="bg-surface border border-secondary/30 rounded-3xl p-5">
            <p className="text-secondary font-bold text-lg mb-3">Riepilogo camminata</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={MapPin} label="Distanza" value={distance} unit="km" />
              <StatCard icon={Timer} label="Tempo" value={formatTime(time)} />
              <StatCard icon={Footprints} label="Passi" value={estimatedSteps.toLocaleString('it-IT')} color="text-secondary" />
              <StatCard icon={Gauge} label="Velocità" value={time > 0 ? (distance / (time / 3600)).toFixed(1) : '0'} unit="km/h" color="text-accent" />
            </div>
          </div>
          {positions.length > 1 && (
            <div className="bg-surface border border-primary/30 rounded-3xl p-4">
              <h3 className="text-text-primary font-bold mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Percorso effettuato
              </h3>
              <RouteMapPreview
                percorso={positions.map(p => ({ lat: p.lat, lng: p.lng }))}
                plannedPercorso={plannedRoute?.percorso}
                currentPos={null}
                height="h-48"
              />
            </div>
          )}
          <BigButton onClick={saveWalk} variant="secondary" data-testid="save-walk-btn"><Save size={20} /> Salva camminata</BigButton>
          <BigButton onClick={resetAll} variant="outline" data-testid="discard-walk-btn"><X size={20} /> Annulla</BigButton>
        </div>
      )}
    </div>
  );
};

/* ======================== FREE WALK VIEW ======================== */
const FreeWalkView = ({ mode, time, distance, speed, positions, estimatedSteps, estimatedCalories, formatTime, startWalk, pauseWalk, stopWalk, saveWalk, resetAll }) => {
  const isActive = mode === 'active';
  const isPaused = mode === 'paused';

  return (
    <div className="px-6 space-y-4">
      {/* Main Stats */}
      <div className="bg-surface border border-border rounded-3xl p-6 text-center space-y-4">
        <div>
          <p className="text-text-secondary text-sm mb-1">Tempo</p>
          <p className="text-5xl font-extrabold font-heading text-primary tabular-nums" data-testid="walk-timer">{formatTime(time)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-text-secondary text-xs">Distanza</p>
            <p className="text-2xl font-bold text-text-primary" data-testid="walk-distance">{distance} <span className="text-sm">km</span></p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Velocità</p>
            <p className="text-2xl font-bold text-text-primary" data-testid="walk-speed">
              {isActive ? speed : (time > 0 && distance > 0 ? (distance / (time / 3600)).toFixed(1) : '0')}
              <span className="text-sm"> km/h</span>
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Passi stimati</p>
            <p className="text-2xl font-bold text-text-primary" data-testid="walk-steps">{estimatedSteps.toLocaleString('it-IT')}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Calorie stimate</p>
            <p className="text-2xl font-bold text-accent">{estimatedCalories}</p>
          </div>
        </div>
        {isActive && positions.length > 0 && (
          <div className="text-xs text-text-secondary flex items-center justify-center gap-1">
            <MapPin size={12} /> GPS attivo · {positions.length} punti registrati
          </div>
        )}
      </div>

      {/* Live mini-map during active walk */}
      {isActive && positions.length > 2 && (
        <div className="bg-surface border border-primary/20 rounded-3xl p-4">
          <h3 className="text-text-primary font-bold text-sm mb-2 flex items-center gap-2">
            <MapPin size={14} className="text-primary" /> Percorso in tempo reale
          </h3>
          <MapPreview percorso={positions.map(p => ({ lat: p.lat, lng: p.lng }))} />
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {mode === 'libera' && (
          <BigButton onClick={startWalk} data-testid="start-walk-btn">
            <Play size={24} /> Avvia Camminata
          </BigButton>
        )}
        {isActive && (
          <div className="grid grid-cols-2 gap-3">
            <BigButton onClick={pauseWalk} variant="outline" data-testid="pause-walk-btn"><Pause size={20} /> Pausa</BigButton>
            <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn"><Square size={20} /> Termina</BigButton>
          </div>
        )}
        {isPaused && (
          <div className="grid grid-cols-2 gap-3">
            <BigButton onClick={startWalk} data-testid="resume-walk-btn"><Play size={20} /> Riprendi</BigButton>
            <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn-p"><Square size={20} /> Termina</BigButton>
          </div>
        )}
        {mode === 'done' && (
          <div className="space-y-3">
            {positions.length > 1 && (
              <div className="bg-surface border border-primary/30 rounded-3xl p-4">
                <h3 className="text-text-primary font-bold mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-primary" /> Percorso registrato
                </h3>
                <p className="text-text-secondary text-xs mb-3">Verifica il percorso prima di salvare</p>
                <MapPreview percorso={positions.map(p => ({ lat: p.lat, lng: p.lng }))} />
              </div>
            )}
            <BigButton onClick={saveWalk} variant="secondary" data-testid="save-walk-btn"><Save size={20} /> Salva camminata</BigButton>
            <BigButton onClick={resetAll} variant="outline" data-testid="discard-walk-btn"><X size={20} /> Annulla</BigButton>
          </div>
        )}
      </div>
    </div>
  );
};

/* ======================== MAP COMPONENTS ======================== */
const MapPreview = ({ percorso }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const percorsoKey = JSON.stringify(percorso?.slice(0, 5)?.map(p => `${p.lat},${p.lng}`));

  useEffect(() => {
    if (!percorso || percorso.length < 2 || !mapRef.current) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

    const loadMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([percorso[0].lat, percorso[0].lng], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
        const latlngs = percorso.map(p => [p.lat, p.lng]);
        L.polyline(latlngs, { color: '#fbbf24', weight: 4, opacity: 0.9 }).addTo(map);
        L.circleMarker(latlngs[0], { radius: 8, color: '#10b981', fillColor: '#10b981', fillOpacity: 1, weight: 2 }).addTo(map);
        L.circleMarker(latlngs[latlngs.length - 1], { radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }).addTo(map);
        map.fitBounds(latlngs, { padding: [20, 20] });
        mapInstanceRef.current = map;
      } catch (err) { console.error('Map error:', err); }
    };
    loadMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [percorsoKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mapRef} className="w-full h-48 rounded-2xl bg-surface-highlight" data-testid="map-preview" />;
};

const RouteMapPreview = ({ percorso, plannedPercorso, currentPos, height = 'h-48' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!percorso || percorso.length < 2 || !mapRef.current) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

    const loadMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([percorso[0].lat, percorso[0].lng], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
        
        // Draw planned route (faded) if provided
        if (plannedPercorso && plannedPercorso.length > 1) {
          const plannedLL = plannedPercorso.map(p => [p.lat, p.lng]);
          L.polyline(plannedLL, { color: '#6b7280', weight: 3, opacity: 0.4, dashArray: '8,8' }).addTo(map);
        }
        
        // Draw main route
        const latlngs = percorso.map(p => [p.lat, p.lng]);
        L.polyline(latlngs, { color: '#fbbf24', weight: 4, opacity: 0.9 }).addTo(map);
        
        // Start marker
        L.circleMarker(latlngs[0], { radius: 10, color: '#10b981', fillColor: '#10b981', fillOpacity: 1, weight: 2 }).addTo(map)
          .bindPopup('Partenza');
        // End marker
        L.circleMarker(latlngs[latlngs.length - 1], { radius: 10, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }).addTo(map)
          .bindPopup('Arrivo');
        
        // Current position marker
        if (currentPos) {
          L.circleMarker([currentPos.lat, currentPos.lng], { radius: 8, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 1, weight: 3 }).addTo(map)
            .bindPopup('Tu sei qui');
        }
        
        map.fitBounds(latlngs, { padding: [30, 30] });
        mapInstanceRef.current = map;
      } catch (err) { console.error('Map error:', err); }
    };
    loadMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [percorso, plannedPercorso, currentPos]);

  return <div ref={mapRef} className={`w-full ${height} rounded-2xl bg-surface-highlight`} data-testid="route-map-preview" />;
};

const LiveWalkMap = ({ plannedRoute, currentPos, walkedPositions }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const posMarkerRef = useRef(null);
  const walkedLineRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    const loadMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        const center = currentPos ? [currentPos.lat, currentPos.lng] : [41.9, 12.5];
        const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(center, 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
        
        // Draw planned route if available
        if (plannedRoute && plannedRoute.length > 1) {
          const routeLL = plannedRoute.map(p => [p.lat, p.lng]);
          L.polyline(routeLL, { color: '#6b7280', weight: 4, opacity: 0.5, dashArray: '10,6' }).addTo(map);
          L.circleMarker(routeLL[0], { radius: 8, color: '#10b981', fillColor: '#10b981', fillOpacity: 1, weight: 2 }).addTo(map);
          L.circleMarker(routeLL[routeLL.length - 1], { radius: 8, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }).addTo(map);
          map.fitBounds(routeLL, { padding: [30, 30] });
        }
        
        // Walked path line (will be updated)
        walkedLineRef.current = L.polyline([], { color: '#fbbf24', weight: 4, opacity: 0.9 }).addTo(map);
        
        // Current position marker (pulsing blue dot)
        if (currentPos) {
          posMarkerRef.current = L.circleMarker([currentPos.lat, currentPos.lng], {
            radius: 10, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3
          }).addTo(map);
        }
        
        mapInstanceRef.current = map;
      } catch (err) { console.error('Map error:', err); }
    };
    loadMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update position and walked path
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const importLeaflet = async () => {
      const L = await import('leaflet');
      
      if (currentPos && posMarkerRef.current) {
        posMarkerRef.current.setLatLng([currentPos.lat, currentPos.lng]);
        mapInstanceRef.current.panTo([currentPos.lat, currentPos.lng], { animate: true, duration: 0.5 });
      } else if (currentPos && mapInstanceRef.current) {
        posMarkerRef.current = L.circleMarker([currentPos.lat, currentPos.lng], {
          radius: 10, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3
        }).addTo(mapInstanceRef.current);
      }
      
      if (walkedPositions.length > 1 && walkedLineRef.current) {
        walkedLineRef.current.setLatLngs(walkedPositions.map(p => [p.lat, p.lng]));
      }
    };
    importLeaflet();
  }, [currentPos, walkedPositions]);

  return <div ref={mapRef} className="w-full h-64 rounded-2xl bg-surface-highlight" data-testid="live-walk-map" />;
};

export default WalkPage;
