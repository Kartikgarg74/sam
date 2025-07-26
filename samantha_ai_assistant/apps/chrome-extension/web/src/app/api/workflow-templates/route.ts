import { NextResponse } from 'next/server';

export async function GET() {
  const templates = [
    {
      name: 'Morning Routine',
      steps: [
        { action: 'openApp', params: { app: 'Mail' } },
        { action: 'openApp', params: { app: 'Calendar' } },
        { action: 'setVolume', params: { value: 30 } },
      ],
    },
    {
      name: 'Focus Mode',
      steps: [
        { action: 'closeApp', params: { app: 'Slack' } },
        { action: 'setVolume', params: { value: 10 } },
        { action: 'openApp', params: { app: 'VSCode' } },
      ],
    },
  ];
  return NextResponse.json({ templates });
}
