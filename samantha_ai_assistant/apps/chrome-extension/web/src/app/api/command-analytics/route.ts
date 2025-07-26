import { NextResponse } from 'next/server';

const commandNames = ['Open Safari', 'Play Music', 'Focus Mode', 'Shutdown', 'Open Mail'];

export async function GET() {
  const now = Date.now();
  const timeline = Array.from({ length: 10 }).map((_, i) => ({
    command: commandNames[Math.floor(Math.random() * commandNames.length)],
    time: now - i * 30000,
    success: Math.random() > 0.1,
  })).reverse();
  const byHour: Record<string, number> = {};
  for (let i = 0; i < 10; i++) {
    const hour = new Date(now - i * 30000).getHours().toString();
    byHour[hour] = (byHour[hour] || 0) + 1;
  }
  const mostFrequent = timeline[Math.floor(Math.random() * timeline.length)].command;
  const total = timeline.length;
  const successCount = timeline.filter(t => t.success).length;
  const failCount = total - successCount;
  return NextResponse.json({
    timeline,
    patterns: { mostFrequent, byHour },
    success: { total, success: successCount, fail: failCount },
  });
}
