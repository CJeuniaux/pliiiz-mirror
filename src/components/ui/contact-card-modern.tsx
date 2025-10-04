import React from 'react';
import { Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        {/* Avatar */}
        <Avatar className="h-16 w-16 border-4 border-white shadow-lg rounded-full flex-shrink-0">
          <AvatarImage src={avatarUrl} className="object-cover" />
          <AvatarFallback className="bg-white/20 text-white text-xl font-semibold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>

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

      {/* View profile button */}
      <button
        onClick={onViewProfile}
        className="w-full bg-gradient-to-r from-[#FF8C69] to-[#FFA985] hover:from-[#FF7A52] hover:to-[#FF9670] text-white font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg mb-3"
      >
        <Eye size={18} />
        <span className="uppercase text-sm tracking-wide">Voir le profil</span>
      </button>

      {/* Additional actions (buttons from parent) */}
      {children && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
