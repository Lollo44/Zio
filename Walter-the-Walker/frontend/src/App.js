import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './components/layout/BottomNav';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import WalkPage from './pages/WalkPage';
import CircuitPage from './pages/CircuitPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import SfidePage from './pages/SfidePage';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProtectedRoute = ({ children, user, setUser }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(user ? true : null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }
    if (user) {
      setIsAuthenticated(true);
      return;
    }
    const autoLogin = async () => {
      try {
        // Try existing session first
        const meResp = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (meResp.ok) {
          const userData = await meResp.json();
          setUser(userData);
          setIsAuthenticated(true);
          return;
        }
      } catch {}
      try {
        // Auto-create anonymous guest session
        const guestResp = await fetch(`${API_URL}/api/auth/guest`, {
          method: 'POST',
          credentials: 'include',
        });
        if (guestResp.ok) {
          const userData = await guestResp.json();
          setUser(userData);
          setIsAuthenticated(true);
          if (!userData.profile_complete) {
            navigate('/onboarding', { replace: true, state: { user: userData } });
          }
          return;
        }
      } catch {}
      setIsAuthenticated(false);
    };
    autoLogin();
  }, [user, location, navigate, setUser]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">Errore di connessione. Ricarica la pagina.</p>
      </div>
    );
  }
  return children;
};

function AppRouter() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/';
  };

  const noNavPages = ['/onboarding'];
  const showNav = user && !noNavPages.includes(location.pathname);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative">
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/home" element={<ProtectedRoute user={user} setUser={setUser}><HomePage user={user} /></ProtectedRoute>} />
        <Route path="/walk" element={<ProtectedRoute user={user} setUser={setUser}><WalkPage /></ProtectedRoute>} />
        <Route path="/circuit" element={<ProtectedRoute user={user} setUser={setUser}><CircuitPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute user={user} setUser={setUser}><StatsPage /></ProtectedRoute>} />
        <Route path="/sfide" element={<ProtectedRoute user={user} setUser={setUser}><SfidePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute user={user} setUser={setUser}><ProfilePage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
