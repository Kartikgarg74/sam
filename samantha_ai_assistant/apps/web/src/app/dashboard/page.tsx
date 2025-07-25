'use client';
import { useSystemStatus } from './useSystemStatus';

export default function DashboardPage() {
  const { system, usage, performance } = useSystemStatus();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded shadow">
          <h2 className="font-semibold mb-2">System Status</h2>
          <div className="h-16 flex flex-col items-center justify-center">
            <span className={`font-bold ${system.healthy ? 'text-green-600' : 'text-red-600'}`}>{system.healthy ? 'Healthy' : 'Issue Detected'}</span>
            <span className="text-sm">CPU: {system.cpu}% | Memory: {system.memory}% | Disk: {system.disk}%</span>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded shadow">
          <h2 className="font-semibold mb-2">Usage Analytics</h2>
          <div className="h-16 flex flex-col items-center justify-center">
            <span className="font-bold">{usage.commandsToday} commands today</span>
            <span className="text-sm">Most used: {usage.mostUsed} ({usage.trend})</span>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded shadow">
          <h2 className="font-semibold mb-2">Performance Metrics</h2>
          <div className="h-16 flex flex-col items-center justify-center">
            <span className="font-bold">Avg. Response: {performance.avgResponse}s</span>
            <span className="text-sm">Success Rate: {performance.successRate}%</span>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded shadow">
          <h2 className="font-semibold mb-2">Quick Actions</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-blue-600 text-white">Run Routine</button>
            <button className="px-3 py-1 rounded bg-green-600 text-white">Open Settings</button>
          </div>
        </div>
      </section>
    </div>
  );
}
