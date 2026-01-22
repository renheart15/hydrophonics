'use client';

import { useState, useEffect } from 'react';
import MetricCard from '@/components/MetricCard';
import PumpControl from '@/components/PumpControl';
import WaterLevelIndicator from '@/components/WaterLevelIndicator';
import PHLevelIndicator from '@/components/PHLevelIndicator';

export default function Dashboard() {
  const [waterLevel, setWaterLevel] = useState(0);
  const [phLevel, setPhLevel] = useState(0);
  const [pumpOn, setPumpOn] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch real-time sensor data from API
  const fetchSensorData = async () => {
    try {
      const response = await fetch('/api/sensor');
      if (!response.ok) throw new Error('Failed to fetch sensor data');
      const data = await response.json();
      setWaterLevel((data.water_level / 965) * 100); // Convert mm to %
      setPhLevel(data.ph);
      setLastUpdate(new Date(data.lastUpdate));
      setError(null);
    } catch (err) {
      setError('Unable to fetch sensor data from server');
      console.error('Error fetching sensor data:', err);
    }
  };

  // Handle pump control
  const handlePumpToggle = async (newStatus: boolean) => {
    try {
      const response = await fetch('/api/pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pump_status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to control pump');
      setPumpOn(newStatus);
    } catch (err) {
      setError('Unable to control pump');
      console.error('Error controlling pump:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchSensorData(); // Initial fetch
    const interval = setInterval(fetchSensorData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getWaterStatus = () => {
    if (waterLevel < 30) return { label: 'Critical', color: 'text-red-400' };
    if (waterLevel < 50) return { label: 'Low', color: 'text-yellow-400' };
    if (waterLevel > 80) return { label: 'High', color: 'text-orange-400' };
    return { label: 'Optimal', color: 'text-emerald-400' };
  };

  const getPHStatus = () => {
    if (phLevel < 5.5) return { label: 'Too Acidic', color: 'text-red-400' };
    if (phLevel < 6.5) return { label: 'Slightly Acidic', color: 'text-yellow-400' };
    if (phLevel > 7.5) return { label: 'Alkaline', color: 'text-orange-400' };
    return { label: 'Balanced', color: 'text-emerald-400' };
  };

  const waterStatus = getWaterStatus();
  const phStatus = getPHStatus();

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="border-b border-border/50 glass-effect sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-white glow-blue">Hydroponic Monitor</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">Real-time IoT System Control</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Last update</p>
              <p className="text-primary font-semibold">
                {mounted ? lastUpdate.toLocaleTimeString() : 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-center">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <MetricCard
            label="Water Level"
            value={waterLevel.toFixed(1)}
            unit="%"
            status={waterStatus}
            icon="💧"
          />
          <MetricCard
            label="pH Level"
            value={phLevel.toFixed(2)}
            unit="pH"
            status={phStatus}
            icon="🧪"
          />
          <MetricCard
            label="Pump Status"
            value={pumpOn ? 'ON' : 'OFF'}
            unit=""
            status={{
              label: pumpOn ? 'Active' : 'Inactive',
              color: pumpOn ? 'text-emerald-400' : 'text-gray-400',
            }}
            icon="🔄"
          />
        </div>

        {/* Main Control Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Indicators */}
          <div className="space-y-6">
            <WaterLevelIndicator waterLevel={waterLevel} status={waterStatus} />
            <PHLevelIndicator phLevel={phLevel} status={phStatus} />
          </div>

          {/* Right: Pump Control */}
          <div className="flex items-center justify-center">
            <PumpControl pumpOn={pumpOn} onToggle={handlePumpToggle} />
          </div>
        </div>


      </div>
    </main>
  );
}
