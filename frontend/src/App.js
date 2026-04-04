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
  // Auth disabled - allow free access
  return children;
};

function AppRouter() {
  const [user, setUser] = useState({ user_id: 'user_demo', name: 'Demo User', profile_complete: true });
  const location = useLocation();

  const handleLogout = () => {
    window.location.href = '/home';
  };

  const noNavPages = ['/login', '/onboarding', '/auth/callback'];
  const showNav = !noNavPages.includes(location.pathname);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative">
      <Routes>
        <Route path="/login" element={<Navigate to="/home" replace />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
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
