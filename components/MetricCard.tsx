interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  status: {
    label: string;
    color: string;
  };
  icon: string;
}

export default function MetricCard({ label, value, unit, status, icon }: MetricCardProps) {
  return (
    <div className="glass-effect rounded-xl p-6 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-300 animate-slide-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{value}</span>
            <span className="text-lg text-muted-foreground">{unit}</span>
          </div>
          <p className={`text-xs mt-3 font-semibold ${status.color}`}>{status.label}</p>
        </div>
        <span className="text-4xl animate-float-up">{icon}</span>
      </div>
    </div>
  );
}
