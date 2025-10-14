import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleLoginScreen } from '@/components/auth/simple-login-screen';
import { useAuth } from '@/hooks/use-auth';

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      // User is logged in, redirect to intended path or home
      const intendedPath = sessionStorage.getItem('intendedPath');
      sessionStorage.removeItem('intendedPath');
      
      // Validate intended path is a protected route
      const protectedRoutes = ['/home', '/requests', '/contacts', '/notifications', '/profile'];
      const targetPath = intendedPath && protectedRoutes.includes(intendedPath) ? intendedPath : '/home';
      
      navigate(targetPath, { replace: true });
    }
  }, [session, navigate]);

  return <SimpleLoginScreen />;
}