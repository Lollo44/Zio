import React from 'react';

const BigButton = ({ children, onClick, variant = 'primary', disabled = false, className = '', ...props }) => {
  const base = 'h-16 w-full text-lg font-bold rounded-full shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95';
  const variants = {
    primary: 'bg-primary text-primary-foreground shadow-amber-500/20 hover:brightness-110',
    secondary: 'bg-secondary text-white shadow-emerald-500/20 hover:brightness-110',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10',
    danger: 'bg-red-500 text-white shadow-red-500/20 hover:brightness-110',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default BigButton;
