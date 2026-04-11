import React from 'react';
import idleImage from './idle.png';
import walkingGif from './walking.gif';
import exercisingGif from './exercising.gif';
import trophyGif from './trophy.gif';

const WaltTheGoat = ({ state = 'idle', size = 120, className = '' }) => {
  // Map state to appropriate image/gif
  const getImageSource = () => {
    switch (state) {
      case 'walking':
        return walkingGif;
      case 'flexing':
        return exercisingGif;
      case 'trophy':
        return trophyGif;
      case 'idle':
      default:
        return idleImage;
    }
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`} 
      data-testid="walt-mascot"
      style={{ width: size, height: size }}
    >
      <img
        src={getImageSource()}
        alt="Walt the Goat"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
        }}
        className="select-none"
      />
    </div>
  );
};

export default WaltTheGoat;
