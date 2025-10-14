import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { requestPushPermission, isPushPermissionGranted } from '@/lib/push-notifications';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const LS_KEY = 'pliiiz_push_dismissed_v2';

export function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const { pathname } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const dismissed = localStorage.getItem(LS_KEY) === '1';
    const granted = await isPushPermissionGranted();
    if (!granted && !dismissed) {
      setShow(true);
    }
  };

  const handleEnable = async () => {
    setShow(false);
    try {
      const granted = await requestPushPermission();
      if (granted) {
        localStorage.removeItem(LS_KEY);
        toast({
          title: "Notifications activées ! 🔔",
          description: "Vous recevrez les rappels d'anniversaire",
        });
      } else {
        toast({
          title: "Notifications non autorisées",
          description: "Vous pouvez les activer plus tard dans les paramètres de votre navigateur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[Push Banner] Error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer les notifications pour le moment",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(LS_KEY, '1');
  };

  if ((pathname !== '/home' && pathname !== '/notifications') || !show) return null;

  return (
    <div className="fixed top-3 left-4 right-4 z-50 md:max-w-2xl md:left-1/2 md:-translate-x-1/2 rounded-3xl border border-gray-200 !bg-white !text-gray-800 shadow-lg backdrop-blur-0">
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0">
          <Bell className="h-6 w-6 !text-gray-800" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Ne ratez plus un anniversaire ! 🎂</div>
          <p className="text-sm mt-0.5 !text-gray-700">
            Recevez des notifications pour les anniversaires à venir (J-14 et J-7)
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleEnable}
              className="btn-orange flex-1 text-sm"
            >
              Activer
            </button>
            <button
              onClick={handleDismiss}
              className="text-sm !text-gray-800 hover:!text-gray-600 font-medium transition-all"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          aria-label="Fermer"
          onClick={handleDismiss}
          className="shrink-0 p-1 !text-gray-500 hover:!text-gray-700 transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
