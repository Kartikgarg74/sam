import { NextResponse } from 'next/server';

export async function GET() {
  // Simulate system status data
  const data = {
    system: {
      healthy: Math.random() > 0.05,
      cpu: Math.round(10 + Math.random() * 30),
      memory: Math.round(30 + Math.random() * 50),
      disk: Math.round(60 + Math.random() * 30),
    },
    usage: {
      commandsToday: 18 + Math.floor(Math.random() * 10),
      mostUsed: ['Open Safari', 'Play Music', 'Focus Mode'][Math.floor(Math.random() * 3)],
      trend: (Math.random() > 0.5 ? '+' : '-') + Math.round(Math.random() * 20) + '%',
    },
    performance: {
      avgResponse: +(0.5 + Math.random() * 0.5).toFixed(2),
      successRate: Math.round(95 + Math.random() * 5),
    },
  };
  return NextResponse.json(data);
}
