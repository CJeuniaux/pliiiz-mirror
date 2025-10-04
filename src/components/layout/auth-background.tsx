import React from 'react';

export function AuthBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-gradient-to-br from-[#7b4bff] via-[#b05cff] to-[#ff7cab]">
      {/* Organic shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/3" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
    </div>
  );
}
