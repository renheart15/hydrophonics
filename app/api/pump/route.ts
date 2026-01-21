import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for pump status (in production, use a database)
let pumpStatus = false;

export async function GET() {
  return NextResponse.json({ pump_status: pumpStatus });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (typeof data.pump_status !== 'boolean') {
      return NextResponse.json({ error: 'Invalid pump_status' }, { status: 400 });
    }

    pumpStatus = data.pump_status;
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
