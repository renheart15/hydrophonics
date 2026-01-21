import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for sensor data (in production, use a database)
let latestSensorData: {
  ph: number;
  water_level: number;
  pump_status: boolean;
  lastUpdate: Date;
} | null = null;

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

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
