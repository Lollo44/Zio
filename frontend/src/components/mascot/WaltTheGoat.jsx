import React from 'react';

const WaltTheGoat = ({ state = 'idle', size = 120, className = '' }) => {
  const animClass = state === 'walking' ? 'animate-walk' : state === 'flexing' ? 'animate-flex' : 'animate-float';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} data-testid="walt-mascot">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className={animClass}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <ellipse cx="100" cy="120" rx="50" ry="40" fill="#e4e4e7" />
        
        {/* Fur texture */}
        <ellipse cx="85" cy="115" rx="12" ry="8" fill="#d4d4d8" opacity="0.5" />
        <ellipse cx="110" cy="125" rx="10" ry="7" fill="#d4d4d8" opacity="0.5" />
        
        {/* Head */}
        <circle cx="100" cy="70" r="30" fill="#e4e4e7" />
        
        {/* Face details */}
        <ellipse cx="100" cy="75" rx="20" ry="15" fill="#f4f4f5" opacity="0.3" />
        
        {/* Horns - Aries style curved */}
        <path d="M 75 55 Q 55 30 65 55" stroke="#d97706" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 125 55 Q 145 30 135 55" stroke="#d97706" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 65 55 Q 58 65 65 70" stroke="#d97706" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M 135 55 Q 142 65 135 70" stroke="#d97706" strokeWidth="5" fill="none" strokeLinecap="round" />
        
        {/* Eyes */}
        <circle cx="88" cy="65" r="5" fill="#09090b" />
        <circle cx="112" cy="65" r="5" fill="#09090b" />
        <circle cx="90" cy="63" r="2" fill="#fafafa" />
        <circle cx="114" cy="63" r="2" fill="#fafafa" />
        
        {/* Nose */}
        <ellipse cx="100" cy="78" rx="4" ry="3" fill="#a1a1aa" />
        
        {/* Mouth - smile */}
        <path d="M 92 84 Q 100 92 108 84" stroke="#a1a1aa" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Beard/goatee */}
        <path d="M 95 88 Q 100 100 105 88" fill="#d4d4d8" />
        
        {/* Legs */}
        {state === 'walking' ? (
          <>
            <rect x="75" y="150" width="8" height="30" rx="4" fill="#d4d4d8" transform="rotate(-15 79 150)" />
            <rect x="90" y="150" width="8" height="30" rx="4" fill="#e4e4e7" transform="rotate(10 94 150)" />
            <rect x="105" y="150" width="8" height="30" rx="4" fill="#d4d4d8" transform="rotate(-10 109 150)" />
            <rect x="120" y="150" width="8" height="30" rx="4" fill="#e4e4e7" transform="rotate(15 124 150)" />
          </>
        ) : (
          <>
            <rect x="75" y="150" width="8" height="28" rx="4" fill="#d4d4d8" />
            <rect x="90" y="150" width="8" height="28" rx="4" fill="#e4e4e7" />
            <rect x="105" y="150" width="8" height="28" rx="4" fill="#d4d4d8" />
            <rect x="120" y="150" width="8" height="28" rx="4" fill="#e4e4e7" />
          </>
        )}
        
        {/* Hooves */}
        <ellipse cx="79" cy="180" rx="6" ry="3" fill="#78716c" />
        <ellipse cx="94" cy="180" rx="6" ry="3" fill="#78716c" />
        <ellipse cx="109" cy="180" rx="6" ry="3" fill="#78716c" />
        <ellipse cx="124" cy="180" rx="6" ry="3" fill="#78716c" />
        
        {/* Tail */}
        <path d="M 50 115 Q 35 100 40 120" stroke="#d4d4d8" strokeWidth="4" fill="none" strokeLinecap="round" />
        
        {/* Flexing arms for biceps state */}
        {state === 'flexing' && (
          <>
            <path d="M 55 105 Q 40 85 50 75" stroke="#e4e4e7" strokeWidth="8" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="75" r="8" fill="#fbbf24" />
            <path d="M 145 105 Q 160 85 150 75" stroke="#e4e4e7" strokeWidth="8" fill="none" strokeLinecap="round" />
            <circle cx="150" cy="75" r="8" fill="#fbbf24" />
          </>
        )}
        
        {/* Headband for exercising */}
        {(state === 'walking' || state === 'flexing') && (
          <path d="M 72 58 Q 100 48 128 58" stroke="#fbbf24" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
};

export default WaltTheGoat;
