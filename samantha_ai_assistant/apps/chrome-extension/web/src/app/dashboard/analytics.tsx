'use client';
import React, { useState } from 'react';

// Mock analytics data (replace with real API integration later)
const mockFeatureUsage = [
  { feature: 'voice_orb_start_listening', count: 120, browser: 'Chrome' },
  { feature: 'voice_orb_transcript', count: 95, browser: 'Chrome' },
  { feature: 'theme_switch', count: 60, browser: 'Firefox' },
  { feature: 'notification_shown', count: 80, browser: 'Edge' },
];
const mockErrorRates = [
  { errorType: 'SPEECH_RECOGNITION_ERROR', count: 8, browser: 'Chrome' },
  { errorType: 'NETWORK_TIMEOUT', count: 5, browser: 'Firefox' },
  { errorType: 'API_SERVER_ERROR', count: 3, browser: 'Safari' },
];
const mockPerformance = [
  { metric: 'voice_orb_recognition_duration', avg: 1200, browser: 'Chrome' },
  { metric: 'api_response_time', avg: 800, browser: 'Firefox' },
];
const mockUserPatterns = [
  { pattern: 'active_sessions', value: 42, browser: 'Chrome' },
  { pattern: 'session_length', value: 300, browser: 'Firefox' },
];

const browsers = ['All', 'Chrome', 'Firefox', 'Safari', 'Edge'];

export default function AnalyticsDashboard() {
  const [selectedBrowser, setSelectedBrowser] = useState('All');
  const [dateRange, setDateRange] = useState('Last 7 days');

  // Filter data by browser
  const filterByBrowser = (data: any[]) =>
    selectedBrowser === 'All' ? data : data.filter(d => d.browser === selectedBrowser);

  // Export data as CSV
  const exportCSV = (data: any[], filename: string) => {
    const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export data as JSON
  const exportJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="analytics-dashboard p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Browser</label>
          <select
            value={selectedBrowser}
            onChange={e => setSelectedBrowser(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {browsers.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date Range</label>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      {/* Feature Usage */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Feature Usage</h2>
          <div>
            <button
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded mr-2"
              onClick={() => exportCSV(filterByBrowser(mockFeatureUsage), 'feature_usage.csv')}
            >Export CSV</button>
            <button
              className="text-xs px-2 py-1 bg-green-500 text-white rounded"
              onClick={() => exportJSON(filterByBrowser(mockFeatureUsage), 'feature_usage.json')}
            >Export JSON</button>
          </div>
        </div>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Feature</th>
              <th className="p-2 border">Count</th>
              <th className="p-2 border">Browser</th>
            </tr>
          </thead>
          <tbody>
            {filterByBrowser(mockFeatureUsage).map((row, i) => (
              <tr key={i}>
                <td className="p-2 border">{row.feature}</td>
                <td className="p-2 border">{row.count}</td>
                <td className="p-2 border">{row.browser}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Error Rates */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Error Rates</h2>
          <div>
            <button
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded mr-2"
              onClick={() => exportCSV(filterByBrowser(mockErrorRates), 'error_rates.csv')}
            >Export CSV</button>
            <button
              className="text-xs px-2 py-1 bg-green-500 text-white rounded"
              onClick={() => exportJSON(filterByBrowser(mockErrorRates), 'error_rates.json')}
            >Export JSON</button>
          </div>
        </div>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Error Type</th>
              <th className="p-2 border">Count</th>
              <th className="p-2 border">Browser</th>
            </tr>
          </thead>
          <tbody>
            {filterByBrowser(mockErrorRates).map((row, i) => (
              <tr key={i}>
                <td className="p-2 border">{row.errorType}</td>
                <td className="p-2 border">{row.count}</td>
                <td className="p-2 border">{row.browser}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Performance Metrics */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Performance Metrics</h2>
          <div>
            <button
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded mr-2"
              onClick={() => exportCSV(filterByBrowser(mockPerformance), 'performance_metrics.csv')}
            >Export CSV</button>
            <button
              className="text-xs px-2 py-1 bg-green-500 text-white rounded"
              onClick={() => exportJSON(filterByBrowser(mockPerformance), 'performance_metrics.json')}
            >Export JSON</button>
          </div>
        </div>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Metric</th>
              <th className="p-2 border">Average</th>
              <th className="p-2 border">Browser</th>
            </tr>
          </thead>
          <tbody>
            {filterByBrowser(mockPerformance).map((row, i) => (
              <tr key={i}>
                <td className="p-2 border">{row.metric}</td>
                <td className="p-2 border">{row.avg}</td>
                <td className="p-2 border">{row.browser}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* User Patterns */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">User Patterns</h2>
          <div>
            <button
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded mr-2"
              onClick={() => exportCSV(filterByBrowser(mockUserPatterns), 'user_patterns.csv')}
            >Export CSV</button>
            <button
              className="text-xs px-2 py-1 bg-green-500 text-white rounded"
              onClick={() => exportJSON(filterByBrowser(mockUserPatterns), 'user_patterns.json')}
            >Export JSON</button>
          </div>
        </div>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Pattern</th>
              <th className="p-2 border">Value</th>
              <th className="p-2 border">Browser</th>
            </tr>
          </thead>
          <tbody>
            {filterByBrowser(mockUserPatterns).map((row, i) => (
              <tr key={i}>
                <td className="p-2 border">{row.pattern}</td>
                <td className="p-2 border">{row.value}</td>
                <td className="p-2 border">{row.browser}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
