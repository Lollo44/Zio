import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Footprints, Dumbbell, BarChart3, User } from 'lucide-react';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/walk', icon: Footprints, label: 'Camminata' },
  { to: '/circuit', icon: Dumbbell, label: 'Circuito' },
  { to: '/stats', icon: BarChart3, label: 'Statistiche' },
  { to: '/profile', icon: User, label: 'Profilo' },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center z-50 pb-2 safe-area-bottom" data-testid="bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          data-testid={`nav-${label.toLowerCase()}`}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
              isActive
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`
          }
        >
          <Icon size={24} strokeWidth={2} />
          <span className="text-xs font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
