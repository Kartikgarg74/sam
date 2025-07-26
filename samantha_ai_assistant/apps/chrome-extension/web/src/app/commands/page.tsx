'use client';
import { useCommandAnalytics } from './useCommandAnalytics';

interface TimelineItem {
  command: string;
  time: number;
  success: boolean;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

function timelineToCSV(timeline: TimelineItem[]) {
  const header = 'Command,Time,Success\n';
  const rows = timeline.map(item =>
    `${item.command},${new Date(item.time).toISOString()},${item.success ? 'Success' : 'Fail'}`
  );
  return header + rows.join('\n');
}

export default function CommandsPage() {
  const { timeline, patterns, success } = useCommandAnalytics();

  function handleExport() {
    const csv = timelineToCSV(timeline as TimelineItem[]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'command-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Command History & Analytics</h1>
      <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="font-semibold mb-2">Command Timeline</h2>
        <ul className="h-24 overflow-y-auto text-sm">
          {(timeline as TimelineItem[]).map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={item.success ? 'text-green-600' : 'text-red-600'}>
                {item.success ? '✔' : '✖'}
              </span>
              <span>{item.command}</span>
              <span className="ml-auto text-gray-400">{formatTime(item.time)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="font-semibold mb-2">Usage Patterns</h2>
        <div className="flex flex-col gap-1">
          <span>Most Frequent: <span className="font-bold">{patterns.mostFrequent}</span></span>
          <span>By Hour: {Object.entries(patterns.byHour).map(([h, c]) => `${h}:00 (${c})`).join(', ')}</span>
        </div>
      </section>
      <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="font-semibold mb-2">Success Metrics</h2>
        <div className="flex gap-4">
          <span>Total: <span className="font-bold">{success.total}</span></span>
          <span>Success: <span className="text-green-600 font-bold">{success.success}</span></span>
          <span>Fail: <span className="text-red-600 font-bold">{success.fail}</span></span>
        </div>
      </section>
      <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="font-semibold mb-2">Export Data</h2>
        <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={handleExport}>Export CSV</button>
      </section>
    </div>
  );
}
