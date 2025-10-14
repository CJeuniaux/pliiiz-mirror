import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md px-4">
        <h1 className="text-4xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-white mb-4">Page introuvable</p>
        <p className="text-white mb-6">
          La page que vous cherchez n'existe pas ou n'est plus disponible.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            Retour
          </Button>
          <Button onClick={() => navigate('/home')} className="btn-orange">
            Accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
