import React from 'react';
import { Check, Clock } from 'lucide-react';

interface StatusIconProps {
  status: 'accepted' | 'pending' | 'declined';
}

export function StatusIcon({ status }: StatusIconProps) {
  const getIcon = () => {
    switch (status) {
      case 'accepted':
        return <Check size={18} className="text-white" />;
      case 'pending':
        return <Clock size={18} className="text-white" />;
      case 'declined':
        return <Clock size={18} className="text-white" />;
      default:
        return <Clock size={18} className="text-white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500';
      case 'pending':
        return 'bg-orange-500';
      case 'declined':
        return 'bg-red-500';
      default:
        return 'bg-orange-500';
    }
  };

  const getAccessibilityLabel = () => {
    switch (status) {
      case 'accepted':
        return 'Demande acceptée';
      case 'pending':
        return 'Demande en attente';
      case 'declined':
        return 'Demande refusée';
      default:
        return 'Demande en attente';
    }
  };

  return (
    <div 
      className={`w-10 h-10 rounded-full ${getBackgroundColor()} flex items-center justify-center shadow-md`}
      aria-label={getAccessibilityLabel()}
      role="img"
    >
      {getIcon()}
    </div>
  );
}