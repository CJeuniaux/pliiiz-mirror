import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { ONBOARD_DEST } from '@/config/routing';

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Store intended path for redirect after login
    sessionStorage.setItem('intendedPath', location.pathname);
    // ALWAYS redirect to login, never register
    console.log('[ProtectedRoute] Redirecting unauthenticated user to login');
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}