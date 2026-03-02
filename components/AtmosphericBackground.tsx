'use client';

import { motion } from 'motion/react';

export function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#0a0502]">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />
    </div>
  );
}
