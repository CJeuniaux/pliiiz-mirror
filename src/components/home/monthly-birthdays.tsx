import { useMonthlyBirthdays } from '@/hooks/useMonthlyBirthdays';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Cake, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function MonthlyBirthdays() {
  const { user } = useAuth();
  const { data: birthdays, loading } = useMonthlyBirthdays(user?.id);
  const navigate = useNavigate();

  const formatDaysUntil = (days: number) => {
    if (days === 0) return "Aujourd'hui !";
    if (days === 1) return "Demain";
    if (days < 0) return "Passé";
    return `J-${days}`;
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-white">🎂 Anniversaires du mois</h3>
        <div className="pliiz-card">
          <p className="text-center text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Cake className="w-6 h-6" />
          Anniversaires du mois
        </h3>
      </div>

      {/* Liste des anniversaires */}
      {birthdays.length > 0 ? (
        <div className="bg-white/10 backdrop-blur-md rounded-3xl py-3 px-[var(--plz-outer-margin)] border border-white/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdays.map((birthday) => (
              <div
                key={birthday.contact_id}
                className="relative rounded-2xl overflow-hidden p-3 cursor-pointer transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                }}
                onClick={() => navigate(`/profil/${birthday.contact_user_id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 rounded-full flex-shrink-0">
                    <AvatarImage src={birthday.avatar_url || undefined} className="rounded-full" />
                    <AvatarFallback className="bg-white/20 text-white font-bold text-sm rounded-full">
                      {getInitials(birthday.first_name, birthday.last_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-base leading-tight">
                      {birthday.first_name} {birthday.last_name}
                    </h4>
                    <p className="text-white/80 text-sm mt-0.5">
                      fête bientôt son anniversaire
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      {formatDaysUntil(birthday.days_until) !== "Passé" 
                        ? formatDaysUntil(birthday.days_until)
                        : birthday.upcoming_age ? `${birthday.upcoming_age} ans` : 'Anniversaire'}
                    </p>
                  </div>

                  <button
                    className="btn-icon-orange w-10 h-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profil/${birthday.contact_user_id}`);
                    }}
                    aria-label="Voir le profil"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* État vide */
        <div className="pliiz-card p-8 text-center">
          <Cake className="w-16 h-16 mx-auto mb-4 text-white/40" />
          <p className="text-white/80 text-lg mb-2">
            Aucun anniversaire ce mois-ci
          </p>
          <p className="text-white/60 text-sm mb-4">
            Ajoutez les anniversaires de vos contacts pour ne jamais oublier !
          </p>
          <button
            onClick={() => navigate('/contacts')}
            className="btn-orange"
          >
            Gérer mes contacts
          </button>
        </div>
      )}
    </div>
  );
}
