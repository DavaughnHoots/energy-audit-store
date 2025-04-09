import React from 'react';

// SVG component for the Aerogel Panel diagram
export const AerogelDiagram: React.FC = () => (
  <svg viewBox="0 0 300 200" className="w-full h-auto">
    <rect x="20" y="10" width="260" height="180" rx="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
    <text x="150" y="30" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#334155">AEROGEL PANEL (95% AIR)</text>
    
    {/* Air pockets */}
    <g>
      <rect x="40" y="50" width="60" height="40" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <text x="70" y="75" textAnchor="middle" fontSize="12" fill="#1e40af">Air</text>
    </g>
    
    <text x="120" y="75" textAnchor="middle" fontSize="12" fill="#64748b">...</text>
    
    <g>
      <rect x="150" y="50" width="60" height="40" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <text x="180" y="75" textAnchor="middle" fontSize="12" fill="#1e40af">Air</text>
    </g>
    
    <text x="150" y="120" textAnchor="middle" fontSize="11" fill="#334155">Microscopic structure traps</text>
    <text x="150" y="140" textAnchor="middle" fontSize="11" fill="#334155">heat despite being lightweight</text>
    
    {/* Silica network representation */}
    <path d="M40,100 L60,110 M70,100 L90,110 M100,100 L120,110 M130,100 L150,110 M160,100 L180,110 M190,100 L210,110 M220,100 L240,110" 
          stroke="#94a3b8" strokeWidth="1" fill="none" />
    <path d="M40,110 L60,100 M70,110 L90,100 M100,110 L120,100 M130,110 L150,100 M160,110 L180,100 M190,110 L210,100 M220,110 L240,100" 
          stroke="#94a3b8" strokeWidth="1" fill="none" />
  </svg>
);

// SVG component for the Phase Change Materials diagram
export const PhaseMaterialsDiagram: React.FC = () => (
  <svg viewBox="0 0 300 200" className="w-full h-auto">
    <rect x="20" y="10" width="260" height="180" rx="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
    <text x="150" y="30" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#334155">PHASE CHANGE MATERIALS</text>
    
    {/* Daytime section */}
    <text x="150" y="55" textAnchor="middle" fontSize="12" fill="#334155">Daytime: absorbs heat ☀️</text>
    
    <g>
      <rect x="110" y="65" width="80" height="30" rx="3" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1" />
      <text x="150" y="85" textAnchor="middle" fontSize="12" fill="#0c4a6e">Liquid</text>
    </g>
    
    <text x="210" y="85" textAnchor="middle" fontSize="11" fill="#64748b">← melts</text>
    
    {/* Nighttime section */}
    <text x="150" y="120" textAnchor="middle" fontSize="12" fill="#334155">Night: releases heat 🌙</text>
    
    <g>
      <rect x="110" y="130" width="80" height="30" rx="3" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1" />
      <text x="150" y="150" textAnchor="middle" fontSize="12" fill="#0c4a6e">Solid</text>
    </g>
    
    <text x="210" y="150" textAnchor="middle" fontSize="11" fill="#64748b">← solidifies</text>
    
    {/* Heat arrows */}
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
      </marker>
    </defs>
    
    {/* Heat absorption arrows (day) */}
    <path d="M80,70 L100,70" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
    <path d="M80,80 L100,80" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
    <path d="M80,90 L100,90" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
    
    {/* Heat release arrows (night) */}
    <path d="M100,135 L80,135" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
    <path d="M100,145 L80,145" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
    <path d="M100,155 L80,155" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowhead)" />
  </svg>
);

// SVG component for the Reflective Roof Barrier diagram
export const ReflectiveBarrierDiagram: React.FC = () => (
  <svg viewBox="0 0 300 200" className="w-full h-auto">
    <rect x="20" y="10" width="260" height="180" rx="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
    <text x="150" y="30" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#334155">REFLECTIVE ROOF BARRIER</text>
    <text x="150" y="50" textAnchor="middle" fontSize="12" fill="#334155">Sunlight ☀️ hits the roof</text>
    
    {/* Sun rays */}
    <defs>
      <marker id="sunray" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#eab308" />
      </marker>
    </defs>
    
    <path d="M110,60 L110,80" stroke="#eab308" strokeWidth="2" markerEnd="url(#sunray)" />
    <path d="M130,60 L130,80" stroke="#eab308" strokeWidth="2" markerEnd="url(#sunray)" />
    <path d="M150,60 L150,80" stroke="#eab308" strokeWidth="2" markerEnd="url(#sunray)" />
    <path d="M170,60 L170,80" stroke="#eab308" strokeWidth="2" markerEnd="url(#sunray)" />
    <path d="M190,60 L190,80" stroke="#eab308" strokeWidth="2" markerEnd="url(#sunray)" />
    
    {/* Reflective barrier */}
    <rect x="60" y="90" width="180" height="15" fill="#e5e7eb" stroke="#94a3b8" strokeWidth="1" />
    <rect x="60" y="90" width="180" height="15" fill="url(#silver-gradient)" stroke="#94a3b8" strokeWidth="1" />
    <text x="150" y="102" textAnchor="middle" fontSize="11" fill="#1f2937">Reflective Foil</text>
    
    {/* Gradient for metallic look */}
    <defs>
      <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#d1d5db" />
        <stop offset="20%" stopColor="#f3f4f6" />
        <stop offset="40%" stopColor="#d1d5db" />
        <stop offset="60%" stopColor="#f3f4f6" />
        <stop offset="80%" stopColor="#d1d5db" />
        <stop offset="100%" stopColor="#f3f4f6" />
      </linearGradient>
    </defs>
    
    {/* Reflection arrows */}
    <path d="M110,80 L90,60" stroke="#eab308" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#sunray)" />
    <path d="M130,80 L110,60" stroke="#eab308" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#sunray)" />
    <path d="M150,80 L130,60" stroke="#eab308" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#sunray)" />
    <path d="M170,80 L150,60" stroke="#eab308" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#sunray)" />
    <path d="M190,80 L170,60" stroke="#eab308" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#sunray)" />
    
    <text x="240" y="95" textAnchor="start" fontSize="10" fill="#64748b">← Reflects heat</text>
    
    {/* Heat transfer arrow */}
    <path d="M150,115 L150,135" stroke="#334155" strokeWidth="2" markerEnd="url(#arrowhead)" />
    
    <text x="150" y="160" textAnchor="middle" fontSize="11" fill="#334155">Less heat enters attic space</text>
  </svg>
);
