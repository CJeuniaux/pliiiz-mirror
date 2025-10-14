import React from 'react';
import { Eye } from 'lucide-react';
import { EnhancedAvatar } from '@/components/ui/enhanced-avatar';
import { StatusIcon } from '@/components/ui/status-icon';

interface ContactCardModernProps {
  displayName: string;
  avatarUrl?: string;
  city?: string;
  age?: number | null;
  message?: string;
  onViewProfile: () => void;
  status?: 'accepted' | 'pending' | 'declined';
  showStatus?: boolean;
  children?: React.ReactNode;
}

export function ContactCardModern({
  displayName,
  avatarUrl,
  city,
  age,
  message,
  onViewProfile,
  status,
  showStatus = false,
  children
}: ContactCardModernProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  const getNameParts = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return {
        firstName: names[0],
        lastName: names.slice(1).join(' ')
      };
    }
    return {
      firstName: name,
      lastName: ''
    };
  };

  const { firstName, lastName } = getNameParts(displayName);
  const metaInfo = [age ? `${age} ans` : null, city]
    .filter(Boolean)
    .join(' – ');

  return (
    <div className="pliiz-card relative">
      {/* Status icon - top right */}
      {showStatus && status && (
        <div className="absolute top-4 right-4">
          <StatusIcon status={status} />
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <EnhancedAvatar 
          avatarUrl={avatarUrl}
          name={displayName}
          className="h-16 w-16 border-4 border-white shadow-lg rounded-full flex-shrink-0"
        />

        {/* Name and info */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-xl leading-tight space-y-0">
            <div>{firstName}</div>
            {lastName && <div>{lastName}</div>}
          </div>
          {metaInfo && (
            <p className="text-white/90 text-sm leading-tight mt-1">
              {metaInfo}
            </p>
          )}
          {message && (
            <p className="text-white/80 text-sm italic mt-1 leading-tight line-clamp-2">
              "{message}"
            </p>
          )}
        </div>
      </div>

      {/* View profile button - show if no status (contacts page) or status is accepted */}
      {(!status || status === 'accepted') && (
        <button
          onClick={onViewProfile}
          className="btn-orange w-full rounded-full mb-3"
        >
          VOIR LE PROFIL
        </button>
      )}

      {/* Additional actions (buttons from parent) */}
      {children && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
