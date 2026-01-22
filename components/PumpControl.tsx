'use client';

import { useState, useCallback } from 'react';

interface PumpControlProps {
  pumpOn: boolean;
  onToggle: (status: boolean) => void;
}

export default function PumpControl({ pumpOn, onToggle }: PumpControlProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleToggle = useCallback(async () => {
    const now = Date.now();
    if (now - lastClickTime < 1000) return; // Debounce 1 second

    setLastClickTime(now);
    setIsLoading(true);
    setIsAnimating(true);

    try {
      await onToggle(!pumpOn);
    } catch (error) {
      console.error('Failed to toggle pump:', error);
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
        setIsLoading(false);
      }, 600);
    }
  }, [pumpOn, onToggle, lastClickTime]);

  return (
    <div className="glass-effect rounded-xl p-6 md:p-12 backdrop-blur border border-white/10 w-full max-w-md">
      <div className="text-center">
        <h3 className="text-lg md:text-2xl font-semibold text-white mb-2">Pump Control</h3>
        <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-8">Manually control water circulation</p>

        {/* Large animated pump circle */}
        <div className="relative w-28 h-28 md:w-40 md:h-40 mx-auto mb-6 md:mb-10">
          {/* Outer glow ring */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-500 ${
              pumpOn
                ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 animate-pulse-glow'
                : 'bg-secondary/30'
            }`}
          ></div>

          {/* Middle ring */}
          <div
            className={`absolute inset-2 rounded-full border-2 transition-all duration-500 ${
              pumpOn ? 'border-cyan-400 border-opacity-60' : 'border-muted border-opacity-30'
            }`}
          ></div>

          {/* Center pump button */}
          <button
            onClick={handleToggle}
            disabled={isLoading}
            type="button"
            className={`absolute inset-4 rounded-full font-bold text-sm md:text-lg flex items-center justify-center transition-all duration-500 transform z-10 ${
              pumpOn
                ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-background shadow-lg shadow-cyan-500/50'
                : 'bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300 shadow-lg shadow-gray-900/50'
            } ${
              isLoading
                ? 'cursor-not-allowed opacity-75'
                : 'cursor-pointer hover:scale-105'
            } ${isAnimating && !isLoading ? 'scale-95' : ''}`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              pumpOn ? '✓ ON' : '✕ OFF'
            )}
          </button>

          {/* Rotating pump icon */}
          {pumpOn && (
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400 animate-spin-slow"></div>
          )}

          {/* Animated particles when on */}
          {pumpOn &&
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  animation: `float-up 2s ease-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  marginLeft: `-${4 + Math.cos((i * Math.PI) / 2) * 20}px`,
                  marginTop: `-${4 + Math.sin((i * Math.PI) / 2) * 20}px`,
                }}
              />
            ))}
        </div>

        {/* Status information */}
        <div className="mt-4 md:mt-6">
          <p className={`text-sm md:text-lg font-semibold ${pumpOn ? 'text-emerald-400' : 'text-gray-400'}`}>
            {pumpOn ? 'RUNNING' : 'IDLE'}
          </p>
        </div>
      </div>
    </div>
  );
}
