import { useAdminMode } from "@/contexts/AdminModeContext";
import { Shield, ShieldOff } from "lucide-react";

export function AdminModeIndicator() {
  const { adminModeOn, isAdmin, loading, toggleAdminMode } = useAdminMode();

  // Ne rien afficher si pas admin
  if (!isAdmin || loading) return null;

  return (
    <button
      onClick={toggleAdminMode}
      className="fixed top-4 right-4 z-[9998] px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all hover:scale-105"
      style={{
        background: adminModeOn 
          ? 'linear-gradient(135deg, #7D4CFF, #B06BFF)'
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
        boxShadow: adminModeOn ? '0 4px 12px rgba(125, 76, 255, 0.3)' : 'none'
      }}
      title="Shift+R pour basculer"
    >
      {adminModeOn ? (
        <>
          <Shield className="w-4 h-4" />
          Mode Admin
        </>
      ) : (
        <>
          <ShieldOff className="w-4 h-4 opacity-60" />
          Admin
        </>
      )}
    </button>
  );
}
