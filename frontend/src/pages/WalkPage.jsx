import React, { useState, useRef, useCallback, useEffect } from 'react';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import BigButton from '../components/ui/BigButton';
import StatCard from '../components/ui/StatCard';
import { Play, Pause, Square, MapPin, Timer, Footprints, Gauge, Save, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const WalkPage = () => {
  const [status, setStatus] = useState('idle');
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);
  const [gpsError, setGpsError] = useState(null);
  const [selectedWalk, setSelectedWalk] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastPosRef = useRef(null);
  const distanceRef = useRef(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_URL}/api/walks`, { credentials: 'include' });
        if (res.ok) setHistory(await res.json());
      } catch (err) { /* ignore */ }
    };
    fetchHistory();
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

        // Filter out poor accuracy readings (>30m uncertainty means bad GPS)
        if (accuracy && accuracy > 30) {
          return; // Ignore this reading
        }

        if (lastPosRef.current) {
          const d = haversineDistance(lastPosRef.current.lat, lastPosRef.current.lng, latitude, longitude);
          const timeDiff = (point.time - lastPosRef.current.time) / 1000; // seconds
          const calculatedSpeed = timeDiff > 0 ? (d / timeDiff) * 3600 : 0; // km/h

          // Movement validation: require minimum 5m distance AND reasonable speed (0.5-15 km/h for walking)
          // This prevents counting movement when stationary (GPS drift)
          const isValidMovement = d > 0.005 && calculatedSpeed > 0.5 && calculatedSpeed < 15;
          
          if (isValidMovement) {
            distanceRef.current += d;
            setDistance(Math.round(distanceRef.current * 100) / 100);
            lastPosRef.current = point;
            setPositions((prev) => [...prev, point]);
            
            // Use calculated speed if GPS speed unavailable, otherwise use GPS speed
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
      (err) => {
        setGpsError(`Errore GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  }, []);

  const startWalk = useCallback(() => {
    setStatus('active');
    startTimeRef.current = Date.now() - time * 1000;
    intervalRef.current = setInterval(() => {
      setTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    startGPS();
  }, [time, startGPS]);

  const pauseWalk = useCallback(() => {
    setStatus('paused');
    clearInterval(intervalRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const stopWalk = useCallback(() => {
    setStatus('done');
    clearInterval(intervalRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (time > 0 && distance > 0) {
      setSpeed(Math.round((distance / (time / 3600)) * 10) / 10);
    }
  }, [time, distance]);

  const estimatedSteps = Math.round(distance * 1000 / 0.65); // ~0.65m stride for seniors
  const estimatedCalories = Math.round(distance * 60);

  const saveWalk = useCallback(async () => {
    try {
      const avgSpeed = time > 0 ? Math.round((distance / (time / 3600)) * 10) / 10 : 0;
      await fetch(`${API_URL}/api/walks`, {
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
      setStatus('idle');
      setTime(0);
      setDistance(0);
      setSpeed(0);
      setPositions([]);
      distanceRef.current = 0;
      lastPosRef.current = null;
      const res = await fetch(`${API_URL}/api/walks`, { credentials: 'include' });
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error('Save error:', err);
    }
  }, [distance, time, positions, estimatedSteps]);

  const resetWalk = () => {
    setStatus('idle');
    setTime(0);
    setDistance(0);
    setSpeed(0);
    setPositions([]);
    distanceRef.current = 0;
    lastPosRef.current = null;
  };

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="walk-page">
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold font-heading text-text-primary">Camminata</h1>
        <WaltTheGoat state={status === 'active' ? 'walking' : 'idle'} size={80} />
      </div>

      {gpsError && (
        <div className="px-6 mb-4">
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-3 text-red-300 text-sm">{gpsError}</div>
        </div>
      )}

      {/* Main Stats */}
      <div className="px-6 mb-6">
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
                {status === 'active' ? speed : (time > 0 && distance > 0 ? (distance / (time / 3600)).toFixed(1) : '0')}
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
          {status === 'active' && positions.length > 0 && (
            <div className="text-xs text-text-secondary flex items-center justify-center gap-1">
              <MapPin size={12} /> GPS attivo · {positions.length} punti registrati
            </div>
          )}
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
            <BigButton onClick={pauseWalk} variant="outline" data-testid="pause-walk-btn"><Pause size={20} /> Pausa</BigButton>
            <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn"><Square size={20} /> Termina</BigButton>
          </div>
        )}
        {status === 'paused' && (
          <div className="grid grid-cols-2 gap-3">
            <BigButton onClick={startWalk} data-testid="resume-walk-btn"><Play size={20} /> Riprendi</BigButton>
            <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn-p"><Square size={20} /> Termina</BigButton>
          </div>
        )}
        {status === 'done' && (
          <div className="space-y-3">
            <div className="bg-surface border border-secondary/30 rounded-3xl p-5">
              <p className="text-secondary font-bold text-lg mb-3">Riepilogo camminata</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={MapPin} label="Distanza" value={distance} unit="km" />
                <StatCard icon={Timer} label="Tempo" value={formatTime(time)} />
                <StatCard icon={Footprints} label="Passi" value={estimatedSteps.toLocaleString('it-IT')} color="text-secondary" />
                <StatCard icon={Gauge} label="Velocità" value={time > 0 ? (distance / (time / 3600)).toFixed(1) : '0'} unit="km/h" color="text-accent" />
              </div>
            </div>
            <BigButton onClick={saveWalk} variant="secondary" data-testid="save-walk-btn"><Save size={20} /> Salva camminata</BigButton>
            <BigButton onClick={resetWalk} variant="outline" data-testid="discard-walk-btn"><X size={20} /> Annulla</BigButton>
          </div>
        )}
      </div>

      {/* Map placeholder - route preview */}
      {selectedWalk?.percorso?.length > 1 && (
        <div className="px-6 mb-6">
          <div className="bg-surface border border-border rounded-3xl p-4">
            <h3 className="text-text-primary font-bold mb-2">Percorso</h3>
            <MapPreview percorso={selectedWalk.percorso} />
          </div>
        </div>
      )}

      {/* Recent walks */}
      {history.length > 0 && (
        <div className="px-6">
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
                  {w.percorso?.length > 0 && <p className="text-primary text-xs mt-1"><MapPin size={10} className="inline" /> Percorso GPS disponibile</p>}
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
    </div>
  );
};

const MapPreview = ({ percorso }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!percorso || percorso.length < 2 || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    const loadMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(
          [percorso[0].lat, percorso[0].lng], 15
        );
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
        const latlngs = percorso.map(p => [p.lat, p.lng]);
        L.polyline(latlngs, { color: '#fbbf24', weight: 4 }).addTo(map);
        L.circleMarker(latlngs[0], { radius: 6, color: '#10b981', fillOpacity: 1 }).addTo(map);
        L.circleMarker(latlngs[latlngs.length - 1], { radius: 6, color: '#ef4444', fillOpacity: 1 }).addTo(map);
        map.fitBounds(latlngs);
        mapInstanceRef.current = map;
      } catch (err) {
        console.error('Map error:', err);
      }
    };
    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [percorso]);

  return <div ref={mapRef} className="w-full h-48 rounded-2xl bg-surface-highlight" data-testid="map-preview" />;
};

export default WalkPage;
