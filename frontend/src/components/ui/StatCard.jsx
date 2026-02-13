import React from 'react';

const StatCard = ({ icon: Icon, label, value, unit, color = 'text-primary', className = '' }) => {
  return (
    <div
      className={`bg-surface border border-border rounded-3xl p-5 flex flex-col items-start gap-2 hover:border-primary/30 transition-colors ${className}`}
      data-testid={`stat-card-${label?.toLowerCase().replace(/\s/g, '-')}`}
    >
      {Icon && <Icon size={22} className={color} />}
      <span className="text-text-secondary text-sm font-medium">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-heading ${color}`}>{value}</span>
        {unit && <span className="text-text-secondary text-sm">{unit}</span>}
      </div>
    </div>
  );
};

export default StatCard;
