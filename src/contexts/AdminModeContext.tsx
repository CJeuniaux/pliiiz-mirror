import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminModeContextType {
  adminModeOn: boolean;
  toggleAdminMode: () => void;
  isAdmin: boolean;
  loading: boolean;
}

const AdminModeContext = createContext<AdminModeContextType>({
  adminModeOn: false,
  toggleAdminMode: () => {},
  isAdmin: false,
  loading: true,
});

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [adminModeOn, setAdminModeOn] = useState<boolean>(() => {
    return localStorage.getItem("pliiiz-admin-mode") === "1";
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleAdminMode = () => {
    const newValue = !adminModeOn;
    setAdminModeOn(newValue);
    localStorage.setItem("pliiiz-admin-mode", newValue ? "1" : "0");
    
    toast({
      title: newValue ? "🔓 Mode admin activé" : "🔒 Mode admin désactivé",
      description: newValue 
        ? "Shift+M pour désactiver" 
        : "Shift+M pour réactiver",
      duration: 2000,
    });
  };

  // Hotkey: Shift + M
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Shift+M: toggle admin mode
      if (e.key.toLowerCase() === "m" && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleAdminMode();
      }
      // Shift+R: toggle multi-select mode (only if admin mode is on)
      if (e.key.toLowerCase() === "r" && e.shiftKey && adminModeOn && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('pliiiz-toggle-multi'));
        toast({
          title: "🔄 Mode sélection multiple",
          description: "Sélectionnez plusieurs images à régénérer",
          duration: 2000,
        });
      }
    };
    
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [adminModeOn]);

  // Check admin role
  useEffect(() => {
    let ignore = false;
    
    async function checkAdminRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Check user_roles table
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error checking admin role:", error);
          setIsAdmin(false);
        } else {
          const hasAdminRole = roles?.some(r => r.role === 'admin') || false;
          if (!ignore) {
            setIsAdmin(hasAdminRole);
          }
        }
      } catch (error) {
        console.error("Error in checkAdminRole:", error);
        setIsAdmin(false);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    checkAdminRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminRole();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AdminModeContext.Provider value={{ adminModeOn, toggleAdminMode, isAdmin, loading }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export const useAdminMode = () => useContext(AdminModeContext);
