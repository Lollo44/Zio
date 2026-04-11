import React, { useState, useRef, useCallback, useEffect } from 'react';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import BigButton from '../components/ui/BigButton';
import StatCard from '../components/ui/StatCard';
import {
  Play, Pause, Square, MapPin, Timer, Footprints,
  Gauge, Save, X, RefreshCw, Navigation, Search,
  Route, ChevronRight, ArrowLeft
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const OSRM_URL = 'https://router.project-osrm.org/route/v1/foot';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// ── Geo utilities ──────────────────────────────────────────────────
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const destinationPoint = (lat, lng, distKm, bearingDeg) => {
  const R = 6371;
  const d = distKm / R;
  const lat1 = toRad(lat);
  const lon1 = toRad(lng);
  const brng = toRad(bearingDeg);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { lat: toDeg(lat2), lng: toDeg(lon2) };
};

// ── OSRM route generation ───────────────────────────────────────────
async function fetchOSRMRoute(coords) {
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(';');
  const url = `${OSRM_URL}/${coordStr}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM error');
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route');
  return data.routes[0];
}

async function generateCircularRoute(startLat, startLng, targetKm) {
  const bearings = [0, 90, 180, 270, 45, 135];
  let bestRoute = null;
  let bestDiff = Infinity;

  for (const bearing of bearings) {
    let offsetKm = targetKm * 0.42;
    let lo = offsetKm * 0.3;
    let hi = offsetKm * 2;

    for (let iter = 0; iter < 6; iter++) {
      const mid = destinationPoint(startLat, startLng, offsetKm, bearing);
      try {
        const route = await fetchOSRMRoute([
          { lat: startLat, lng: startLng },
          mid,
          { lat: startLat, lng: startLng },
        ]);
        const routeKm = route.distance / 1000;
        const diff = Math.abs(routeKm - targetKm);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestRoute = {
            geometry: route.geometry,
            distanceKm: routeKm,
            durationMin: Math.round(route.duration / 60),
            midpoint: mid,
            bearing,
          };
        }
        if (diff <= 0.3) break;
        if (routeKm < targetKm) lo = offsetKm;
        else hi = offsetKm;
        offsetKm = (lo + hi) / 2;
      } catch {
        break;
      }
    }
    if (bestDiff <= 0.3) break;
  }
  return bestRoute;
}

async function generateOneWayRoute(startLat, startLng, destLat, destLng) {
  const route = await fetchOSRMRoute([
    { lat: startLat, lng: startLng },
    { lat: destLat, lng: destLng },
  ]);
  return {
    geometry: route.geometry,
    distanceKm: route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
  };
}

async function geocodeAddress(address) {
  const params = new URLSearchParams({ q: address, format: 'json', limit: 1 });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'Accept-Language': 'it', 'User-Agent': 'WaltTheWalker/1.0' },
  });
  const data = await res.json();
  if (data.length > 0)
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: data[0].display_name,
    };
  return null;
}

// ── Leaflet Map Component ──────────────────────────────────────────
const LeafletMap = ({ plannedRoute, livePosition, liveTrack, historyRoute, height = 280 }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const trackLayerRef = useRef(null);
  const liveMarkerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let L;
    const init = async () => {
      L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([41.9, 12.5], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    };
    init().catch(console.error);
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        routeLayerRef.current = null;
        trackLayerRef.current = null;
        liveMarkerRef.current = null;
      }
    };
  }, []);

  // Draw planned route
  useEffect(() => {
    if (!mapRef.current || !plannedRoute) return;
    const waitForMap = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (!map) return;
      if (routeLayerRef.current) routeLayerRef.current.remove();
      if (startMarkerRef.current) startMarkerRef.current.remove();
      if (endMarkerRef.current) endMarkerRef.current.remove();

      const coords = plannedRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      routeLayerRef.current = L.polyline(coords, {
        color: '#fbbf24',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);

      const startIcon = L.divIcon({
        html: '<div style="background:#10b981;width:14px;height:14px;border-radius:50%;border:3px solid white;"></div>',
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const endIcon = L.divIcon({
        html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;"></div>',
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      startMarkerRef.current = L.marker(coords[0], { icon: startIcon }).addTo(map);
      endMarkerRef.current = L.marker(coords[coords.length - 1], { icon: endIcon }).addTo(map);
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] });
    };
    waitForMap().catch(console.error);
  }, [plannedRoute]);

  // Draw live walk track
  useEffect(() => {
    if (!mapRef.current || !liveTrack?.length) return;
    const update = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (!map) return;
      if (trackLayerRef.current) trackLayerRef.current.remove();
      const pts = liveTrack.map((p) => [p.lat, p.lng]);
      trackLayerRef.current = L.polyline(pts, { color: '#60a5fa', weight: 4, opacity: 0.85 }).addTo(map);
    };
    update().catch(console.error);
  }, [liveTrack]);

  // Update live position marker
  useEffect(() => {
    if (!mapRef.current || !livePosition) return;
    const update = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (!map) return;
      const icon = L.divIcon({
        html: '<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>',
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      if (liveMarkerRef.current) {
        liveMarkerRef.current.setLatLng([livePosition.lat, livePosition.lng]);
      } else {
        liveMarkerRef.current = L.marker([livePosition.lat, livePosition.lng], { icon }).addTo(map);
        map.setView([livePosition.lat, livePosition.lng], 16);
      }
    };
    update().catch(console.error);
  }, [livePosition]);

  // Draw history route
  useEffect(() => {
    if (!mapRef.current || !historyRoute?.length) return;
    const draw = async () => {
      const L = (await import('leaflet')).default;
      const map = mapRef.current;
      if (!map) return;
      if (routeLayerRef.current) routeLayerRef.current.remove();
      const pts = historyRoute.map((p) => [p.lat, p.lng]);
      routeLayerRef.current = L.polyline(pts, { color: '#fbbf24', weight: 4 }).addTo(map);
      L.circleMarker(pts[0], { radius: 6, color: '#10b981', fillOpacity: 1 }).addTo(map);
      L.circleMarker(pts[pts.length - 1], { radius: 6, color: '#ef4444', fillOpacity: 1 }).addTo(map);
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] });
    };
    draw().catch(console.error);
  }, [historyRoute]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px` }}
      className="w-full rounded-2xl bg-surface-highlight overflow-hidden"
      data-testid="leaflet-map"
    />
  );
};

// ── WalkPage Main ──────────────────────────────────────────────────
const WalkPage = () => {
  // Phase: 'select' | 'plan' | 'generating' | 'preview' | 'active' | 'paused' | 'done'
  const [phase, setPhase] = useState('select');
  const [mode, setMode] = useState('libera'); // 'libera' | 'percorso'

  // Route planning
  const [targetKm, setTargetKm] = useState(3);
  const [destType, setDestType] = useState('current'); // 'current' (circular) | 'address'
  const [addressInput, setAddressInput] = useState('');
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [geocodingAddress, setGeocodingAddress] = useState(false);

  // Walk tracking
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [positions, setPositions] = useState([]);
  const [livePosition, setLivePosition] = useState(null);

  // UI
  const [history, setHistory] = useState([]);
  const [selectedWalk, setSelectedWalk] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [currentGps, setCurrentGps] = useState(null);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastPosRef = useRef(null);
  const distanceRef = useRef(0);

  useEffect(() => {
    fetch(`${API_URL}/api/walks`, { credentials: 'include' })
      .then((r) => r.ok && r.json())
      .then((d) => d && setHistory(d))
      .catch(() => {});
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ── GPS helpers ──
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('GPS non disponibile'); return; }
    setGpsError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: gpsSpeed, accuracy } = pos.coords;
        const point = { lat: latitude, lng: longitude, time: Date.now(), accuracy };
        setLivePosition({ lat: latitude, lng: longitude });
        if (accuracy && accuracy > 50) return;
        if (lastPosRef.current) {
          const d = haversineDistance(lastPosRef.current.lat, lastPosRef.current.lng, latitude, longitude);
          const dt = (point.time - lastPosRef.current.time) / 1000;
          const calcSpeed = dt > 0 ? (d / dt) * 3600 : 0;
          if (d > 0.005 && calcSpeed > 0.5 && calcSpeed < 15) {
            distanceRef.current += d;
            setDistance(Math.round(distanceRef.current * 100) / 100);
            lastPosRef.current = point;
            setPositions((prev) => [...prev, point]);
            const displaySpeed = gpsSpeed && gpsSpeed > 0.1
              ? Math.round(gpsSpeed * 3.6 * 10) / 10
              : Math.round(calcSpeed * 10) / 10;
            setSpeed(displaySpeed);
          }
        } else {
          lastPosRef.current = point;
          setPositions([point]);
        }
      },
      (err) => setGpsError(`GPS: ${err.message}`),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
  }, []);

  // ── Walk controls ──
  const startWalk = useCallback(() => {
    setPhase('active');
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => setTime(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    startGPS();
  }, [startGPS]);

  const pauseWalk = useCallback(() => {
    setPhase('paused');
    clearInterval(intervalRef.current);
    stopGPS();
  }, [stopGPS]);

  const resumeWalk = useCallback(() => {
    setPhase('active');
    startTimeRef.current = Date.now() - time * 1000;
    intervalRef.current = setInterval(() => setTime(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    startGPS();
  }, [time, startGPS]);

  const stopWalk = useCallback(() => {
    setPhase('done');
    clearInterval(intervalRef.current);
    stopGPS();
  }, [stopGPS]);

  const resetAll = () => {
    setPhase('select');
    setMode('libera');
    setPlannedRoute(null);
    setRouteError(null);
    setTime(0);
    setDistance(0);
    setSpeed(0);
    setPositions([]);
    setLivePosition(null);
    distanceRef.current = 0;
    lastPosRef.current = null;
    clearInterval(intervalRef.current);
    stopGPS();
  };

  const saveWalk = useCallback(async () => {
    setSaveError(null);
    const avgSpeed = time > 0 ? Math.round((distance / (time / 3600)) * 10) / 10 : 0;
    const estimatedSteps = Math.round(distance * 1000 / 0.65);
    try {
      const res = await fetch(`${API_URL}/api/walks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          distanza_km: distance,
          tempo_secondi: time,
          passi: estimatedSteps,
          velocita_media_kmh: avgSpeed,
          percorso: positions.map((p) => ({ lat: p.lat, lng: p.lng })),
        }),
      });
      if (res.ok) {
        const hRes = await fetch(`${API_URL}/api/walks`, { credentials: 'include' });
        if (hRes.ok) setHistory(await hRes.json());
        resetAll();
      } else {
        setSaveError('Impossibile salvare. Riprova.');
      }
    } catch {
      setSaveError('Errore di rete.');
    }
  }, [distance, time, positions]);

  // ── Route planning ──
  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('GPS non disponibile')); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        (e) => reject(e),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });

  const handleCalculateRoute = async () => {
    setRouteError(null);
    setPhase('generating');
    try {
      let startPos;
      try {
        startPos = await getCurrentPosition();
        setCurrentGps(startPos);
      } catch {
        throw new Error('Impossibile ottenere la posizione GPS. Abilita i permessi di localizzazione.');
      }

      let route = null;

      if (destType === 'current') {
        route = await generateCircularRoute(startPos.lat, startPos.lng, targetKm);
        if (!route) throw new Error('Impossibile calcolare il percorso. Prova un\'altra distanza.');
      } else {
        if (!addressInput.trim()) throw new Error('Inserisci un indirizzo di destinazione.');
        setGeocodingAddress(true);
        const geo = await geocodeAddress(addressInput);
        setGeocodingAddress(false);
        if (!geo) throw new Error(`Indirizzo "${addressInput}" non trovato. Prova ad essere più specifico.`);
        route = await generateOneWayRoute(startPos.lat, startPos.lng, geo.lat, geo.lng);
        route.destLabel = geo.label;
      }

      setPlannedRoute({ ...route, startPos, isCircular: destType === 'current' });
      setPhase('preview');
    } catch (err) {
      setRouteError(err.message || 'Errore durante la generazione del percorso.');
      setPhase('plan');
    }
  };

  const handleRegenerateRoute = async () => {
    if (!plannedRoute?.startPos) { setPhase('plan'); return; }
    setRouteError(null);
    setPhase('generating');
    try {
      const { startPos } = plannedRoute;
      let route = null;
      if (plannedRoute.isCircular) {
        const bearing = ((plannedRoute.bearing || 0) + 90) % 360;
        const mid = destinationPoint(startPos.lat, startPos.lng, targetKm * 0.42, bearing);
        route = await generateCircularRoute(startPos.lat, startPos.lng, targetKm);
        if (route) route.bearing = bearing;
      } else {
        const geo = await geocodeAddress(addressInput);
        if (!geo) throw new Error('Indirizzo non trovato.');
        route = await generateOneWayRoute(startPos.lat, startPos.lng, geo.lat, geo.lng);
      }
      if (!route) throw new Error('Impossibile rigenerare.');
      setPlannedRoute({ ...route, startPos, isCircular: plannedRoute.isCircular });
      setPhase('preview');
    } catch (err) {
      setRouteError(err.message);
      setPhase('preview');
    }
  };

  const estimatedSteps = Math.round(distance * 1000 / 0.65);
  const estimatedCalories = Math.round(distance * 60);
  const progressPct = plannedRoute ? Math.min(100, (distance / plannedRoute.distanceKm) * 100) : 0;

  // ── RENDER ──────────────────────────────────────────────────────
  const showMap =
    phase === 'preview' ||
    (phase === 'active' && mode === 'percorso') ||
    (phase === 'paused' && mode === 'percorso') ||
    (phase === 'done' && positions.length > 1) ||
    selectedWalk?.percorso?.length > 1;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="walk-page">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(phase === 'plan' || phase === 'preview' || phase === 'generating') && (
            <button onClick={() => setPhase(phase === 'preview' ? 'plan' : 'select')} className="text-text-secondary">
              <ArrowLeft size={22} />
            </button>
          )}
          <h1 className="text-2xl font-extrabold font-heading text-text-primary">
            {phase === 'plan' || phase === 'generating' ? 'Pianifica percorso' :
             phase === 'preview' ? 'Anteprima percorso' :
             'Camminata'}
          </h1>
        </div>
        <WaltTheGoat state={phase === 'active' ? 'walking' : 'idle'} size={70} />
      </div>

      {/* GPS Error */}
      {gpsError && (
        <div className="px-6 mb-4">
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-3 text-red-300 text-sm">{gpsError}</div>
        </div>
      )}
      {saveError && (
        <div className="px-6 mb-4">
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-3 text-red-300 text-sm flex items-center justify-between">
            {saveError}
            <button onClick={() => setSaveError(null)}><X size={16} /></button>
          </div>
        </div>
      )}

      {/* ── PHASE: select ── */}
      {phase === 'select' && (
        <div className="px-6 space-y-4">
          <p className="text-text-secondary text-sm">Scegli il tipo di camminata</p>
          <button
            onClick={() => { setMode('libera'); startWalk(); }}
            className="w-full bg-surface border border-border rounded-3xl p-6 text-left hover:border-primary/50 transition-colors"
            data-testid="mode-free-btn"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                <Footprints size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-text-primary font-bold text-lg">Libera</p>
                <p className="text-text-secondary text-sm">Cammina senza limiti, traccia distanza e tempo</p>
              </div>
              <ChevronRight size={20} className="text-text-secondary ml-auto" />
            </div>
          </button>
          <button
            onClick={() => { setMode('percorso'); setPhase('plan'); }}
            className="w-full bg-surface border border-border rounded-3xl p-6 text-left hover:border-secondary/50 transition-colors"
            data-testid="mode-route-btn"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center">
                <Route size={24} className="text-secondary" />
              </div>
              <div>
                <p className="text-text-primary font-bold text-lg">Percorso</p>
                <p className="text-text-secondary text-sm">Pianifica un tragitto su mappa con distanza obiettivo</p>
              </div>
              <ChevronRight size={20} className="text-text-secondary ml-auto" />
            </div>
          </button>

          {/* Recent walks */}
          {history.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold font-heading text-text-primary mb-3">Ultime camminate</h2>
              <div className="space-y-2">
                {history.slice(0, 6).map((w, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedWalk(selectedWalk?.walk_id === w.walk_id ? null : w)}
                    className={`w-full bg-surface border rounded-2xl p-4 flex items-center justify-between transition-colors ${selectedWalk?.walk_id === w.walk_id ? 'border-primary/50' : 'border-border'}`}
                    data-testid={`walk-history-${i}`}
                  >
                    <div className="text-left">
                      <p className="text-text-primary font-medium">{new Date(w.data).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      <p className="text-text-secondary text-sm">{(w.passi || 0).toLocaleString('it-IT')} passi · {formatTime(w.tempo_secondi || 0)}</p>
                      {w.percorso?.length > 0 && <p className="text-primary text-xs mt-1 flex items-center gap-1"><MapPin size={10} />Percorso GPS</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold text-lg">{Number(w.distanza_km || 0).toFixed(1)} km</p>
                      <p className="text-text-secondary text-sm">{Number(w.velocita_media_kmh || 0).toFixed(1)} km/h</p>
                    </div>
                  </button>
                ))}
              </div>
              {selectedWalk?.percorso?.length > 1 && (
                <div className="mt-4 bg-surface border border-border rounded-3xl p-4">
                  <h3 className="text-text-primary font-bold mb-3">Percorso registrato</h3>
                  <LeafletMap historyRoute={selectedWalk.percorso} height={240} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PHASE: plan ── */}
      {phase === 'plan' && (
        <div className="px-6 space-y-5">
          {routeError && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-3 text-red-300 text-sm">{routeError}</div>
          )}

          {/* KM input */}
          <div className="bg-surface border border-border rounded-3xl p-5">
            <label className="text-text-secondary text-sm font-bold block mb-3">Quanti km vuoi percorrere?</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTargetKm((v) => Math.max(1, v - 0.5))}
                className="w-12 h-12 bg-surface-highlight border border-border rounded-2xl text-text-primary text-xl font-bold hover:border-primary/50 transition-colors"
              >−</button>
              <div className="flex-1 text-center">
                <p className="text-4xl font-extrabold font-heading text-primary">{targetKm}</p>
                <p className="text-text-secondary text-sm">km</p>
              </div>
              <button
                onClick={() => setTargetKm((v) => Math.min(25, v + 0.5))}
                className="w-12 h-12 bg-surface-highlight border border-border rounded-2xl text-text-primary text-xl font-bold hover:border-primary/50 transition-colors"
              >+</button>
            </div>
            <input
              type="range" min={1} max={25} step={0.5} value={targetKm}
              onChange={(e) => setTargetKm(parseFloat(e.target.value))}
              className="w-full mt-3 accent-primary"
            />
            <p className="text-text-secondary text-xs text-center mt-1">Circa {Math.round(targetKm * 1000 / 0.65).toLocaleString('it-IT')} passi · {Math.round(targetKm * 60)} cal</p>
          </div>

          {/* Destination type */}
          <div className="bg-surface border border-border rounded-3xl p-5">
            <label className="text-text-secondary text-sm font-bold block mb-3">Dove vuoi arrivare?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDestType('current')}
                className={`h-16 rounded-2xl border font-bold text-sm flex flex-col items-center justify-center gap-1 transition-colors ${destType === 'current' ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-highlight border-border text-text-secondary'}`}
                data-testid="dest-current-btn"
              >
                <Navigation size={18} />
                <span>Ritorna all'inizio</span>
                <span className="text-xs font-normal opacity-70">(percorso circolare)</span>
              </button>
              <button
                onClick={() => setDestType('address')}
                className={`h-16 rounded-2xl border font-bold text-sm flex flex-col items-center justify-center gap-1 transition-colors ${destType === 'address' ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-surface-highlight border-border text-text-secondary'}`}
                data-testid="dest-address-btn"
              >
                <Search size={18} />
                <span>Altro indirizzo</span>
                <span className="text-xs font-normal opacity-70">(percorso lineare)</span>
              </button>
            </div>

            {destType === 'address' && (
              <div className="mt-3">
                <label className="text-text-secondary text-xs font-bold block mb-1">Indirizzo di destinazione</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Es: Via Roma 1, Milano"
                    className="flex-1 h-11 bg-surface-highlight border border-border rounded-xl px-3 text-text-primary text-sm focus:outline-none focus:border-secondary"
                    data-testid="address-input"
                    onKeyDown={(e) => e.key === 'Enter' && handleCalculateRoute()}
                  />
                </div>
              </div>
            )}
          </div>

          <BigButton onClick={handleCalculateRoute} variant="secondary" data-testid="calc-route-btn">
            <Route size={20} /> Calcola percorso
          </BigButton>
        </div>
      )}

      {/* ── PHASE: generating ── */}
      {phase === 'generating' && (
        <div className="px-6 flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <RefreshCw size={40} className="text-primary animate-spin" />
          <p className="text-text-primary font-bold text-lg">Calcolando il percorso...</p>
          <p className="text-text-secondary text-sm text-center">
            {geocodingAddress ? 'Cerco l\'indirizzo...' : `Genero un percorso da circa ${targetKm} km`}
          </p>
          <WaltTheGoat state="walking" size={80} />
        </div>
      )}

      {/* ── PHASE: preview ── */}
      {phase === 'preview' && plannedRoute && (
        <div className="px-6 space-y-4">
          {routeError && (
            <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-2xl p-3 text-yellow-300 text-sm">{routeError}</div>
          )}

          {/* Route info */}
          <div className="bg-surface border border-border rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Route size={18} className="text-primary" />
              <p className="text-text-primary font-bold">
                {plannedRoute.isCircular ? 'Percorso circolare' : 'Percorso lineare'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-text-secondary text-xs">Distanza</p>
                <p className="text-primary font-bold text-xl">{plannedRoute.distanceKm.toFixed(1)}<span className="text-sm"> km</span></p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Tempo est.</p>
                <p className="text-text-primary font-bold text-xl">{plannedRoute.durationMin}<span className="text-sm"> min</span></p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Obiettivo</p>
                <p className="text-text-secondary font-bold text-xl">{targetKm}<span className="text-sm"> km</span></p>
              </div>
            </div>
            {Math.abs(plannedRoute.distanceKm - targetKm) <= 0.3 ? (
              <p className="text-secondary text-xs text-center mt-2">✓ Entro ±300m dall'obiettivo</p>
            ) : (
              <p className="text-yellow-400 text-xs text-center mt-2">
                Scostamento: {Math.abs(plannedRoute.distanceKm - targetKm).toFixed(1)} km dall'obiettivo
              </p>
            )}
          </div>

          {/* Map preview */}
          <LeafletMap plannedRoute={plannedRoute} height={300} />

          <BigButton onClick={() => { setMode('percorso'); startWalk(); }} data-testid="start-route-btn">
            <Play size={20} /> Avvia questo percorso
          </BigButton>
          <button
            onClick={handleRegenerateRoute}
            className="w-full h-12 bg-surface border border-border rounded-2xl text-text-secondary text-sm font-bold flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
            data-testid="regen-route-btn"
          >
            <RefreshCw size={16} /> Genera altro percorso
          </button>
          <button onClick={() => setPhase('plan')} className="w-full text-text-secondary text-sm text-center py-2">
            ← Modifica parametri
          </button>
        </div>
      )}

      {/* ── PHASES: active / paused / done ── */}
      {(phase === 'active' || phase === 'paused' || phase === 'done') && (
        <div className="px-6 space-y-4">
          {/* Progress bar for planned route */}
          {mode === 'percorso' && plannedRoute && phase !== 'done' && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
                <span>{distance.toFixed(2)} km percorsi</span>
                <span>obiettivo: {plannedRoute.distanceKm.toFixed(1)} km</span>
              </div>
              <div className="h-3 bg-surface-highlight rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-text-secondary text-xs text-center mt-1">{Math.round(progressPct)}%</p>
            </div>
          )}

          {/* Map during walk */}
          {mode === 'percorso' && (
            <LeafletMap
              plannedRoute={plannedRoute}
              livePosition={livePosition}
              liveTrack={positions}
              height={250}
            />
          )}

          {/* Live stats */}
          <div className="bg-surface border border-border rounded-3xl p-5">
            <div className="text-center mb-4">
              <p className="text-text-secondary text-sm">Tempo</p>
              <p className="text-5xl font-extrabold font-heading text-primary tabular-nums" data-testid="walk-timer">{formatTime(time)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-text-secondary text-xs">Distanza</p>
                <p className="text-2xl font-bold text-text-primary" data-testid="walk-distance">{distance} <span className="text-sm">km</span></p>
              </div>
              <div className="text-center">
                <p className="text-text-secondary text-xs">Velocità</p>
                <p className="text-2xl font-bold text-text-primary" data-testid="walk-speed">
                  {phase === 'active' ? speed : (time > 0 && distance > 0 ? (distance / (time / 3600)).toFixed(1) : '0')}
                  <span className="text-sm"> km/h</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-text-secondary text-xs">Passi stimati</p>
                <p className="text-xl font-bold text-text-primary">{estimatedSteps.toLocaleString('it-IT')}</p>
              </div>
              <div className="text-center">
                <p className="text-text-secondary text-xs">Calorie</p>
                <p className="text-xl font-bold text-accent">{estimatedCalories}</p>
              </div>
            </div>
            {phase === 'active' && positions.length > 0 && (
              <div className="text-xs text-text-secondary flex items-center justify-center gap-1 mt-3">
                <MapPin size={12} /> GPS attivo · {positions.length} punti
              </div>
            )}
          </div>

          {/* Controls */}
          {phase === 'active' && (
            <div className="grid grid-cols-2 gap-3">
              <BigButton onClick={pauseWalk} variant="outline" data-testid="pause-walk-btn"><Pause size={20} /> Pausa</BigButton>
              <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn"><Square size={20} /> Termina</BigButton>
            </div>
          )}
          {phase === 'paused' && (
            <div className="grid grid-cols-2 gap-3">
              <BigButton onClick={resumeWalk} data-testid="resume-walk-btn"><Play size={20} /> Riprendi</BigButton>
              <BigButton onClick={stopWalk} variant="danger" data-testid="stop-walk-btn-p"><Square size={20} /> Termina</BigButton>
            </div>
          )}
          {phase === 'done' && (
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
              {positions.length > 1 && (
                <div className="bg-surface border border-border rounded-3xl p-4">
                  <p className="text-text-primary font-bold mb-3">Percorso effettuato</p>
                  <LeafletMap liveTrack={positions} height={220} />
                </div>
              )}
              <BigButton onClick={saveWalk} variant="secondary" data-testid="save-walk-btn"><Save size={20} /> Salva camminata</BigButton>
              <BigButton onClick={resetAll} variant="outline" data-testid="discard-walk-btn"><X size={20} /> Annulla</BigButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalkPage;
