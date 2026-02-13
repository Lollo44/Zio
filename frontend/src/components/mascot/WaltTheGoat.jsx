import React from 'react';

const WaltTheGoat = ({ state = 'idle', size = 120, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} data-testid="walt-mascot">
      <svg
        width={size}
        height={size}
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Fur gradient */}
          <radialGradient id="furGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#f5f5f4" />
            <stop offset="100%" stopColor="#d6d3d1" />
          </radialGradient>
          {/* Horn gradient */}
          <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          {/* Shadow */}
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
          </filter>
          {/* Body shadow */}
          <radialGradient id="bellyShadow" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#e7e5e4" />
            <stop offset="100%" stopColor="#a8a29e" />
          </radialGradient>
        </defs>

        {/* === BODY GROUP === */}
        <g filter="url(#shadow)">
          {/* Main body */}
          <ellipse cx="150" cy="175" rx="65" ry="50" fill="url(#furGrad)" />
          {/* Belly lighter patch */}
          <ellipse cx="150" cy="185" rx="40" ry="30" fill="#fafaf9" opacity="0.6" />
          {/* Fluffy wool texture */}
          <circle cx="120" cy="160" r="12" fill="#e7e5e4" />
          <circle cx="140" cy="150" r="14" fill="#f5f5f4" />
          <circle cx="165" cy="148" r="13" fill="#e7e5e4" />
          <circle cx="185" cy="158" r="11" fill="#f5f5f4" />
          <circle cx="130" cy="175" r="10" fill="#e7e5e4" />
          <circle cx="170" cy="172" r="11" fill="#f5f5f4" />
        </g>

        {/* === TAIL === */}
        <g>
          <ellipse cx="82" cy="165" rx="12" ry="8" fill="#e7e5e4" transform="rotate(-20 82 165)" />
          <ellipse cx="78" cy="162" rx="8" ry="6" fill="#f5f5f4" transform="rotate(-15 78 162)">
            {state === 'idle' && (
              <animateTransform attributeName="transform" type="rotate" values="-15 78 162;-25 78 162;-15 78 162" dur="2s" repeatCount="indefinite" />
            )}
          </ellipse>
        </g>

        {/* === LEGS === */}
        {state === 'walking' ? (
          <g>
            {/* Front left - forward */}
            <g>
              <animateTransform attributeName="transform" type="rotate" values="15 130 215;-15 130 215;15 130 215" dur="0.6s" repeatCount="indefinite" />
              <rect x="126" y="215" width="10" height="35" rx="5" fill="#d6d3d1" />
              <ellipse cx="131" cy="252" rx="8" ry="4" fill="#78716c" />
            </g>
            {/* Front right - backward */}
            <g>
              <animateTransform attributeName="transform" type="rotate" values="-15 145 215;15 145 215;-15 145 215" dur="0.6s" repeatCount="indefinite" />
              <rect x="141" y="215" width="10" height="35" rx="5" fill="#e7e5e4" />
              <ellipse cx="146" cy="252" rx="8" ry="4" fill="#78716c" />
            </g>
            {/* Back left */}
            <g>
              <animateTransform attributeName="transform" type="rotate" values="-12 158 215;12 158 215;-12 158 215" dur="0.6s" repeatCount="indefinite" />
              <rect x="154" y="215" width="10" height="35" rx="5" fill="#d6d3d1" />
              <ellipse cx="159" cy="252" rx="8" ry="4" fill="#78716c" />
            </g>
            {/* Back right */}
            <g>
              <animateTransform attributeName="transform" type="rotate" values="12 173 215;-12 173 215;12 173 215" dur="0.6s" repeatCount="indefinite" />
              <rect x="169" y="215" width="10" height="35" rx="5" fill="#e7e5e4" />
              <ellipse cx="174" cy="252" rx="8" ry="4" fill="#78716c" />
            </g>
          </g>
        ) : (
          <g>
            {/* Static legs */}
            <rect x="126" y="215" width="10" height="35" rx="5" fill="#d6d3d1" />
            <ellipse cx="131" cy="252" rx="8" ry="4" fill="#78716c" />
            <rect x="141" y="215" width="10" height="35" rx="5" fill="#e7e5e4" />
            <ellipse cx="146" cy="252" rx="8" ry="4" fill="#78716c" />
            <rect x="158" y="215" width="10" height="35" rx="5" fill="#d6d3d1" />
            <ellipse cx="163" cy="252" rx="8" ry="4" fill="#78716c" />
            <rect x="173" y="215" width="10" height="35" rx="5" fill="#e7e5e4" />
            <ellipse cx="178" cy="252" rx="8" ry="4" fill="#78716c" />
          </g>
        )}

        {/* === ARMS === */}
        {state === 'flexing' ? (
          <>
            {/* LEFT ARM doing bicep curl - upper arm stays, forearm curls */}
            <g>
              {/* Upper arm (shoulder to elbow) */}
              <rect x="75" y="155" width="10" height="30" rx="5" fill="#d6d3d1" transform="rotate(30 80 155)" />
              {/* Forearm curling up and down */}
              <g transform="translate(72, 148)">
                <rect x="0" y="0" width="8" height="28" rx="4" fill="#e7e5e4">
                  <animateTransform attributeName="transform" type="rotate" values="0 4 28;-120 4 28;0 4 28" dur="1.5s" repeatCount="indefinite" />
                </rect>
                {/* Dumbbell */}
                <g>
                  <animateTransform attributeName="transform" type="rotate" values="0 4 28;-120 4 28;0 4 28" dur="1.5s" repeatCount="indefinite" />
                  <rect x="-6" y="-6" width="20" height="6" rx="3" fill="#fbbf24" />
                  <circle cx="-4" cy="-3" r="5" fill="#d97706" />
                  <circle cx="16" cy="-3" r="5" fill="#d97706" />
                </g>
              </g>
            </g>

            {/* RIGHT ARM doing bicep curl - mirrored */}
            <g>
              {/* Upper arm */}
              <rect x="215" y="155" width="10" height="30" rx="5" fill="#d6d3d1" transform="rotate(-30 220 155)" />
              {/* Forearm curling */}
              <g transform="translate(220, 148)">
                <rect x="0" y="0" width="8" height="28" rx="4" fill="#e7e5e4">
                  <animateTransform attributeName="transform" type="rotate" values="0 4 28;120 4 28;0 4 28" dur="1.5s" repeatCount="indefinite" begin="0.15s" />
                </rect>
                {/* Dumbbell */}
                <g>
                  <animateTransform attributeName="transform" type="rotate" values="0 4 28;120 4 28;0 4 28" dur="1.5s" repeatCount="indefinite" begin="0.15s" />
                  <rect x="-6" y="-6" width="20" height="6" rx="3" fill="#fbbf24" />
                  <circle cx="-4" cy="-3" r="5" fill="#d97706" />
                  <circle cx="16" cy="-3" r="5" fill="#d97706" />
                </g>
              </g>
            </g>
          </>
        ) : state === 'walking' ? (
          <>
            {/* Arms swinging while walking */}
            <g>
              <animateTransform attributeName="transform" type="rotate" values="20 100 160;-20 100 160;20 100 160" dur="0.6s" repeatCount="indefinite" />
              <rect x="96" y="160" width="8" height="25" rx="4" fill="#d6d3d1" />
            </g>
            <g>
              <animateTransform attributeName="transform" type="rotate" values="-20 200 160;20 200 160;-20 200 160" dur="0.6s" repeatCount="indefinite" />
              <rect x="196" y="160" width="8" height="25" rx="4" fill="#d6d3d1" />
            </g>
          </>
        ) : (
          <>
            {/* Idle arms */}
            <rect x="96" y="162" width="8" height="22" rx="4" fill="#d6d3d1" />
            <rect x="196" y="162" width="8" height="22" rx="4" fill="#d6d3d1" />
          </>
        )}

        {/* === HEAD === */}
        <g>
          {state === 'idle' && (
            <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="3s" repeatCount="indefinite" />
          )}

          {/* Head shape */}
          <ellipse cx="150" cy="105" rx="38" ry="35" fill="url(#furGrad)" />

          {/* Face lighter area */}
          <ellipse cx="150" cy="112" rx="25" ry="20" fill="#fafaf9" opacity="0.5" />

          {/* === HORNS - Big Aries curly horns === */}
          {/* Left horn */}
          <path d="M 115 90 C 95 60, 75 55, 80 80 C 85 100, 95 105, 105 95" 
                stroke="url(#hornGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M 80 80 C 78 90, 82 98, 92 100" 
                stroke="url(#hornGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />

          {/* Right horn */}
          <path d="M 185 90 C 205 60, 225 55, 220 80 C 215 100, 205 105, 195 95" 
                stroke="url(#hornGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M 220 80 C 222 90, 218 98, 208 100" 
                stroke="url(#hornGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />

          {/* === EARS === */}
          <ellipse cx="108" cy="95" rx="12" ry="7" fill="#e7e5e4" transform="rotate(-20 108 95)" />
          <ellipse cx="108" cy="95" rx="8" ry="4" fill="#fecaca" transform="rotate(-20 108 95)" opacity="0.5" />
          <ellipse cx="192" cy="95" rx="12" ry="7" fill="#e7e5e4" transform="rotate(20 192 95)" />
          <ellipse cx="192" cy="95" rx="8" ry="4" fill="#fecaca" transform="rotate(20 192 95)" opacity="0.5" />

          {/* === EYES === */}
          <g>
            {/* Left eye */}
            <ellipse cx="137" cy="100" rx="8" ry="9" fill="white" />
            <circle cx="139" cy="100" r="5" fill="#1c1917" />
            <circle cx="141" cy="98" r="2" fill="white" />
            {/* Right eye */}
            <ellipse cx="163" cy="100" rx="8" ry="9" fill="white" />
            <circle cx="161" cy="100" r="5" fill="#1c1917" />
            <circle cx="163" cy="98" r="2" fill="white" />

            {/* Blink animation */}
            {state === 'idle' && (
              <>
                <ellipse cx="137" cy="100" rx="8" ry="9" fill="url(#furGrad)">
                  <animate attributeName="ry" values="9;1;9" dur="4s" repeatCount="indefinite" keyTimes="0;0.04;0.08" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline" />
                </ellipse>
                <ellipse cx="163" cy="100" rx="8" ry="9" fill="url(#furGrad)">
                  <animate attributeName="ry" values="9;1;9" dur="4s" repeatCount="indefinite" keyTimes="0;0.04;0.08" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline" />
                </ellipse>
              </>
            )}
          </g>

          {/* Eyebrows */}
          <path d="M 128 90 Q 135 86 143 90" stroke="#78716c" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 157 90 Q 165 86 172 90" stroke="#78716c" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* === NOSE === */}
          <ellipse cx="150" cy="113" rx="6" ry="4" fill="#a8a29e" />
          <circle cx="147" cy="113" r="1.5" fill="#78716c" />
          <circle cx="153" cy="113" r="1.5" fill="#78716c" />

          {/* === MOUTH === */}
          {state === 'flexing' ? (
            /* Determined grin while exercising */
            <path d="M 140 120 Q 150 130 160 120" stroke="#78716c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : state === 'walking' ? (
            /* Happy open mouth while walking */
            <g>
              <path d="M 141 119 Q 150 128 159 119" fill="#78716c" />
              <path d="M 143 119 Q 150 124 157 119" fill="#fecaca" />
            </g>
          ) : (
            /* Friendly smile */
            <path d="M 141 120 Q 150 128 159 120" stroke="#78716c" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* === GOATEE (beard) === */}
          <path d="M 144 125 Q 150 140 156 125" fill="#d6d3d1" />
          <path d="M 147 128 Q 150 138 153 128" fill="#e7e5e4" />

          {/* Headband when exercising */}
          {(state === 'walking' || state === 'flexing') && (
            <g>
              <path d="M 112 88 Q 150 76 188 88" stroke="#fbbf24" strokeWidth="5" fill="none" strokeLinecap="round" />
              {state === 'flexing' && (
                <text x="150" y="85" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">GOAT</text>
              )}
            </g>
          )}

          {/* Cheek blush */}
          <circle cx="128" cy="112" r="6" fill="#fecaca" opacity="0.3" />
          <circle cx="172" cy="112" r="6" fill="#fecaca" opacity="0.3" />
        </g>

        {/* Walking movement effect */}
        {state === 'walking' && (
          <g opacity="0.4">
            <line x1="80" y1="200" x2="65" y2="195" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="opacity" values="0;0.6;0" dur="0.8s" repeatCount="indefinite" />
            </line>
            <line x1="78" y1="210" x2="60" y2="208" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="opacity" values="0;0.4;0" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
            </line>
            <line x1="82" y1="220" x2="68" y2="220" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="opacity" values="0;0.5;0" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
            </line>
          </g>
        )}

        {/* Flexing sweat drops */}
        {state === 'flexing' && (
          <g>
            <circle cx="120" cy="85" r="3" fill="#60a5fa" opacity="0.7">
              <animate attributeName="cy" values="85;75;65" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.3;0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="182" cy="82" r="2.5" fill="#60a5fa" opacity="0.6">
              <animate attributeName="cy" values="82;72;62" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.6;0.3;0" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
            </circle>
          </g>
        )}
      </svg>
    </div>
  );
};

export default WaltTheGoat;
