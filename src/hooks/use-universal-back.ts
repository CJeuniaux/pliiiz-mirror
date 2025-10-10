import { useNavigate } from 'react-router-dom';

/**
 * Hook universel pour gérer le bouton retour
 * Navigue toujours vers la page précédente dans l'historique
 */
export function useUniversalBack() {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return goBack;
}
