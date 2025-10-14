import { useState, useEffect } from 'react';

export function useRegiftNotice(profileId: string, acceptsSecondHand: boolean) {
  const key = `regift_notice_seen_${profileId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (acceptsSecondHand && profileId && !localStorage.getItem(key)) {
      // Délai court pour éviter les conflits avec d'autres modals
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(key, '1');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [profileId, acceptsSecondHand, key]);

  const handleClose = () => {
    setOpen(false);
  };

  return { 
    open, 
    setOpen: handleClose,
    onClose: handleClose 
  };
}