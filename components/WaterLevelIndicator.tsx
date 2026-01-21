interface WaterLevelIndicatorProps {
  waterLevel: number;
  status: {
    label: string;
    color: string;
  };
}

export default function WaterLevelIndicator({ waterLevel, status }: WaterLevelIndicatorProps) {
  const clampedLevel = Math.max(0, Math.min(100, waterLevel));

  return (
    <div className="glass-effect rounded-xl p-8 backdrop-blur border border-white/10">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Water Level Monitor</h3>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">{clampedLevel.toFixed(1)}%</span>
          <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Animated Water Tank Visualization */}
      <div className="relative w-full h-64 bg-gradient-to-b from-secondary to-black rounded-lg overflow-hidden border border-white/10 mb-6">
        {/* Tank glass effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30"></div>

        {/* Water level fill */}
        <div
          className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 via-cyan-400 to-blue-400 transition-all duration-500 ease-out"
          style={{
            height: `${clampedLevel}%`,
            boxShadow: `0 -10px 30px rgba(102, 205, 255, 0.4)`,
          }}
        >
          {/* Animated water waves */}
          <div className="absolute inset-0 opacity-50">
            <svg viewBox="0 0 100 20" className="w-full h-full animate-pulse">
              <path
                d="M0,10 Q25,5 50,10 T100,10 L100,20 L0,20 Z"
                fill="rgba(255,255,255,0.3)"
              />
            </svg>
          </div>

          {/* Floating particles */}
          {[...Array(3)].map((_, i) => {
            // Use deterministic values to avoid hydration mismatch
            const particleConfigs = [
              { width: 3.5, height: 3.2, left: 25, bottom: 40, delay: 0 },
              { width: 2.8, height: 4.1, left: 70, bottom: 25, delay: 0.3 },
              { width: 4.2, height: 2.9, left: 45, bottom: 15, delay: 0.6 },
            ];
            const config = particleConfigs[i];
            return (
              <div
                key={i}
                className="absolute rounded-full bg-white/30 animate-float-up"
                style={{
                  width: `${config.width}px`,
                  height: `${config.height}px`,
                  left: `${config.left}%`,
                  bottom: `${config.bottom}%`,
                  animationDelay: `${config.delay}s`,
                }}
              />
            );
          })}
        </div>

        {/* Level markers */}
        <div className="absolute right-4 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Capacity</span>
          <span className="text-primary">{clampedLevel.toFixed(1)} / 100 L</span>
        </div>
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${clampedLevel}%` }}
          />
        </div>
      </div>

      {/* Status indicators */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground mb-1">Flow Rate</p>
          <p className="text-sm font-semibold text-primary">2.5 L/m</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground mb-1">Pressure</p>
          <p className="text-sm font-semibold text-accent">1.2 bar</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground mb-1">Usage</p>
          <p className="text-sm font-semibold text-emerald-400">45%</p>
        </div>
      </div>
    </div>
  );
}
