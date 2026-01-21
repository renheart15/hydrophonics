interface PHLevelIndicatorProps {
  phLevel: number;
  status: {
    label: string;
    color: string;
  };
}

export default function PHLevelIndicator({ phLevel, status }: PHLevelIndicatorProps) {
  const clampedPH = Math.max(0, Math.min(14, phLevel));
  const percentage = (clampedPH / 14) * 100;

  const getGradientStyle = () => {
    if (percentage < 35) return 'from-red-500 to-red-400'; // Acidic
    if (percentage < 50) return 'from-yellow-500 to-yellow-400'; // Slightly acidic
    if (percentage < 65) return 'from-emerald-500 to-emerald-400'; // Neutral
    if (percentage < 80) return 'from-cyan-500 to-cyan-400'; // Slightly alkaline
    return 'from-blue-500 to-blue-400'; // Alkaline
  };

  return (
    <div className="glass-effect rounded-xl p-8 backdrop-blur border border-white/10">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">pH Level Monitor</h3>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">{clampedPH.toFixed(2)}</span>
          <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* pH Scale Visualization */}
      <div className="space-y-4">
        {/* Color gradient scale */}
        <div className="relative h-20 rounded-lg overflow-hidden border border-white/10 bg-gradient-to-r from-red-600 via-emerald-500 to-blue-600">
          {/* Indicator needle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white transition-all duration-500"
            style={{ left: `${percentage}%` }}
          >
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-white rounded-full shadow-lg"></div>
          </div>

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>

        {/* pH range labels */}
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>0 (Very Acidic)</span>
          <span>7 (Neutral)</span>
          <span>14 (Very Alkaline)</span>
        </div>
      </div>

      {/* Detailed metrics */}
      <div className="mt-8 space-y-4">
        {/* Acidity/Alkalinity gauge */}
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Acidic</span>
            <span className="text-sm font-semibold">{percentage.toFixed(1)}%</span>
            <span className="text-sm text-muted-foreground">Alkaline</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getGradientStyle()} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Status panels */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Buffer Capacity</p>
            <p className="text-sm font-semibold text-primary">High</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Stability</p>
            <p className="text-sm font-semibold text-emerald-400">Stable</p>
          </div>
        </div>

        {/* Recommended range */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Recommended Range</p>
          <p className="text-sm font-semibold text-primary">6.0 - 7.5 pH</p>
          <div className="mt-2 flex gap-2">
            {clampedPH < 6.0 && <span className="text-xs text-red-400">⚠️ Too acidic - add base</span>}
            {clampedPH > 7.5 && <span className="text-xs text-orange-400">⚠️ Too alkaline - add acid</span>}
            {clampedPH >= 6.0 && clampedPH <= 7.5 && <span className="text-xs text-emerald-400">✓ Perfect range</span>}
          </div>
        </div>
      </div>

      {/* Pulse animation for status */}
      <div className="mt-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse`}></div>
        <span className="text-xs text-muted-foreground">Monitoring: Real-time</span>
      </div>
    </div>
  );
}
