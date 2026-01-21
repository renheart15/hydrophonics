import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for sensor data (in production, use a database)
let latestSensorData: {
  ph: number;
  water_level: number;
  pump_status: boolean;
  lastUpdate: Date;
} | null = null;

// Alert thresholds
const ALERT_THRESHOLDS = {
  ph_low: 5.0,
  ph_warning_high: 7.5, // Warning level
  ph_high: 8.0, // Critical level
  water_level_low: 20, // percentage
  water_level_high: 90, // percentage
};

// Alert tracking to avoid spam
let lastAlerts: { [key: string]: Date } = {};
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown between same alerts

export async function GET() {
  if (!latestSensorData) {
    return NextResponse.json({ error: 'No sensor data available' }, { status: 404 });
  }

  return NextResponse.json(latestSensorData);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (typeof data.ph !== 'number' || typeof data.water_level !== 'number' || typeof data.pump_status !== 'boolean') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    latestSensorData = {
      ph: data.ph,
      water_level: data.water_level,
      pump_status: data.pump_status,
      lastUpdate: new Date(),
    };

    // Check for alerts and send SMS if needed
    await checkAlerts(data.ph, data.water_level);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

async function checkAlerts(ph: number, waterLevel: number) {
  const now = new Date();
  const alerts: string[] = [];

  // Check pH alerts
  if (ph < ALERT_THRESHOLDS.ph_low) {
    const alertKey = 'ph_low';
    if (!lastAlerts[alertKey] || (now.getTime() - lastAlerts[alertKey].getTime()) > ALERT_COOLDOWN) {
      alerts.push(`⚠️ ALERT: pH level too low! Current: ${ph.toFixed(2)} (below ${ALERT_THRESHOLDS.ph_low}). Replace water and fertilizer.`);
      lastAlerts[alertKey] = now;
    }
  } else if (ph >= ALERT_THRESHOLDS.ph_warning_high && ph <= ALERT_THRESHOLDS.ph_high) {
    const alertKey = 'ph_warning_high';
    if (!lastAlerts[alertKey] || (now.getTime() - lastAlerts[alertKey].getTime()) > ALERT_COOLDOWN) {
      alerts.push(`⚠️ WARNING: pH level approaching high limit! Current: ${ph.toFixed(2)} (between ${ALERT_THRESHOLDS.ph_warning_high}-${ALERT_THRESHOLDS.ph_high}). Monitor closely.`);
      lastAlerts[alertKey] = now;
    }
  } else if (ph > ALERT_THRESHOLDS.ph_high) {
    const alertKey = 'ph_high';
    if (!lastAlerts[alertKey] || (now.getTime() - lastAlerts[alertKey].getTime()) > ALERT_COOLDOWN) {
      alerts.push(`🚨 ALERT: pH level critically high! Current: ${ph.toFixed(2)} (above ${ALERT_THRESHOLDS.ph_high}). Replace water and fertilizer immediately.`);
      lastAlerts[alertKey] = now;
    }
  }

  // Check water level alerts
  if (waterLevel < ALERT_THRESHOLDS.water_level_low) {
    const alertKey = 'water_low';
    if (!lastAlerts[alertKey] || (now.getTime() - lastAlerts[alertKey].getTime()) > ALERT_COOLDOWN) {
      alerts.push(`🚨 ALERT: Water level critically low! Current: ${waterLevel.toFixed(1)}% (below ${ALERT_THRESHOLDS.water_level_low}%). Refill water and fertilizer.`);
      lastAlerts[alertKey] = now;
    }
  } else if (waterLevel > ALERT_THRESHOLDS.water_level_high) {
    const alertKey = 'water_high';
    if (!lastAlerts[alertKey] || (now.getTime() - lastAlerts[alertKey].getTime()) > ALERT_COOLDOWN) {
      alerts.push(`⚠️ ALERT: Water level too high! Current: ${waterLevel.toFixed(1)}% (above ${ALERT_THRESHOLDS.water_level_high}%). Check pump operation.`);
      lastAlerts[alertKey] = now;
    }
  }

  // Send SMS for each alert
  for (const message of alerts) {
    try {
      await sendSMSAlert(message);
    } catch (error) {
      console.error('Failed to send SMS alert:', error);
    }
  }
}

async function sendSMSAlert(message: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      console.error('SMS API returned error:', response.status);
    }
  } catch (error) {
    console.error('Failed to send SMS alert:', error);
  }
}
