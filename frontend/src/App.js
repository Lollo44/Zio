import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './components/layout/BottomNav';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import WalkPage from './pages/WalkPage';
import CircuitPage from './pages/CircuitPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import SfidePage from './pages/SfidePage';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const AUTH_DISABLED = process.env.REACT_APP_AUTH_DISABLED === 'true';

const ProtectedRoute = ({ children, user, setUser }) => {
  if (AUTH_DISABLED) return children;
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
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      }
    };
    checkAuth();
  }, [user, location, navigate, setUser]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (isAuthenticated === false) return null;
  return children;
};

function AppRouter() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (AUTH_DISABLED && !user) {
      setUser({ user_id: 'user_demo', name: 'Demo User', profile_complete: true });
    }
  }, [user]);

  // CRITICAL: Detect session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/login';
  };

  const noNavPages = ['/login', '/onboarding', '/auth/callback'];
  const showNav = user && !noNavPages.includes(location.pathname) && !location.hash?.includes('session_id=');

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative">
      <Routes>
        <Route path="/login" element={AUTH_DISABLED ? <Navigate to="/home" replace /> : (user ? <Navigate to="/home" replace /> : <LoginPage />)} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/home" element={<ProtectedRoute user={user} setUser={setUser}><HomePage user={user} /></ProtectedRoute>} />
        <Route path="/walk" element={<ProtectedRoute user={user} setUser={setUser}><WalkPage /></ProtectedRoute>} />
        <Route path="/circuit" element={<ProtectedRoute user={user} setUser={setUser}><CircuitPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute user={user} setUser={setUser}><StatsPage /></ProtectedRoute>} />
        <Route path="/sfide" element={<ProtectedRoute user={user} setUser={setUser}><SfidePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute user={user} setUser={setUser}><ProfilePage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
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
