'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Sparkles, FlipHorizontal } from 'lucide-react';

interface Card3DViewerProps {
  frontImage: string;
  cardName: string;
  isHolo?: boolean;
}

export default function Card3DViewer({ frontImage, cardName, isHolo = true }: Card3DViewerProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({ x: 0, y: 0, rotX: 0, rotY: 0 });

  // Handle Mouse Move over card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    const rotY = normX * 26;
    const rotX = -normY * 26;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.85,
    });
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) return;
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  }, [isDragging]);

  // Drag to rotate handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: rotateX,
      rotY: rotateY,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const newRotY = Math.max(-55, Math.min(55, dragStartRef.current.rotY + deltaX * 0.4));
      const newRotX = Math.max(-55, Math.min(55, dragStartRef.current.rotX - deltaY * 0.4));

      setRotateX(newRotX);
      setRotateY(newRotY);
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging]);

  // Touch support for mobile devices
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    setRotateX(-normY * 28);
    setRotateY(normX * 28);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.8,
    });
  };

  const handleTouchEnd = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const resetRotation = () => {
    setRotateX(0);
    setRotateY(0);
    setIsFlipped(false);
  };

  const foilAngle = Math.round(115 + rotateY * 2.2 + rotateX * 1.5);

  return (
    <div className="flex flex-col items-center justify-center w-full select-none">
      {/* 3D Viewport container */}
      <div
        className="relative w-full max-w-[270px] sm:max-w-[290px] aspect-[2.5/3.5] py-2 cursor-grab active:cursor-grabbing"
        style={{ perspective: '1100px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Card 3D Rotating Mesh */}
        <div
          ref={cardRef}
          className="relative w-full h-full rounded-2xl transition-transform duration-100 ease-out shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg) scale(${isDragging ? 1.05 : 1.02})`,
          }}
        >
          {/* FRONT FACE */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-slate-950 border-2 border-white/20 shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Base Card Image */}
            <img
              src={frontImage}
              alt={cardName}
              draggable={false}
              className="w-full h-full object-contain pointer-events-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-card.svg';
              }}
            />

            {/* Holographic Rainbow Foil Layer */}
            {isHolo && (
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                style={{
                  background: `linear-gradient(${foilAngle}deg, 
                    rgba(255, 0, 128, 0) 0%, 
                    rgba(255, 0, 128, 0.25) 20%, 
                    rgba(0, 240, 255, 0.45) 40%, 
                    rgba(255, 230, 0, 0.5) 55%, 
                    rgba(255, 0, 255, 0.4) 70%, 
                    rgba(0, 255, 128, 0.25) 85%, 
                    rgba(0, 255, 128, 0) 100%)`,
                  mixBlendMode: 'color-dodge',
                  opacity: glarePos.opacity > 0 ? 0.75 : 0.2,
                }}
              />
            )}

            {/* Specular White Glare Reflection */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-150"
              style={{
                background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.25) 30%, transparent 65%)`,
                mixBlendMode: 'overlay',
                opacity: glarePos.opacity,
              }}
            />
          </div>

          {/* BACK FACE (Official Pokéball Card Back) */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-slate-950 border-2 border-blue-500/40 shadow-2xl p-1"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src="/card-back.png"
              alt="Reverso Oficial Pokémon TCG"
              draggable={false}
              className="w-full h-full object-cover rounded-xl pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Interactive Controls & Hints */}
      <div className="flex flex-col items-center gap-2 pt-3 w-full">
        <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Mueve el cursor o arrastra para rotar en 3D</span>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Girar carta 180° para ver el reverso oficial"
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-blue-300" />
            <span>{isFlipped ? 'Ver Frente' : 'Girar Reverso'}</span>
          </button>

          {(rotateX !== 0 || rotateY !== 0 || isFlipped) && (
            <button
              type="button"
              onClick={resetRotation}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
              title="Restablecer posición inicial"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Centrar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
