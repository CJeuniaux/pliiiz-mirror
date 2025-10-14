import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthBackground } from './auth-background';

export function PublicLayout() {
  return (
    <div className="min-h-screen relative">
      <AuthBackground />
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}