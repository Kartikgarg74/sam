import { NextRequest, NextResponse } from 'next/server';

let settings = {
  voice: { recognition: 'Whisper', synthesis: 'ElevenLabs', volume: 70 },
  service: { geminiApiKey: '', elevenLabsApiKey: '' },
  user: { theme: 'light', notifications: true },
  security: { permissions: ['admin'], accessControl: true },
};

export async function GET() {
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  settings = { ...settings, ...body };
  return NextResponse.json(settings);
}
