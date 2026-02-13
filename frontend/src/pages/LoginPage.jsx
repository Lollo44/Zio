import React from 'react';
import WaltTheGoat from '../components/mascot/WaltTheGoat';
import { Footprints } from 'lucide-react';

const LoginPage = () => {
  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/home';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6" data-testid="login-page">
      <div className="max-w-sm w-full flex flex-col items-center gap-8">
        {/* Mascot */}
        <WaltTheGoat state="idle" size={160} />

        {/* App Title */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold font-heading text-text-primary tracking-tight">
            Walter the Walker
          </h1>
          <p className="text-text-secondary text-lg">
            Il tuo compagno di fitness personale
          </p>
        </div>

        {/* Walt speech bubble */}
        <div className="bg-surface border border-border rounded-3xl p-5 w-full relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-surface border-l border-t border-border rotate-45"></div>
          <p className="text-text-primary text-center text-lg font-medium">
            Ciao! Sono <span className="text-primary font-bold">Walt the Goat</span>, il tuo ariete motivatore!
          </p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          data-testid="google-login-btn"
          className="w-full h-16 bg-white text-gray-800 rounded-full font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all active:scale-95"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Accedi con Google
        </button>

        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Footprints size={16} />
          <span>Inizia a camminare con Walt!</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
