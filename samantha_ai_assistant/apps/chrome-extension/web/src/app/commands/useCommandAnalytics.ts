'use client';
import { useEffect, useState } from 'react';

type ByHour = { [hour: string]: number };
interface TimelineItem {
  command: string;
  time: number;
  success: boolean;
}
interface AnalyticsData {
  timeline: TimelineItem[];
  patterns: { mostFrequent: string; byHour: ByHour };
  success: { total: number; success: number; fail: number };
  loading?: boolean;
}

export function useCommandAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/command-analytics');
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 2000);
    return () => clearInterval(interval);
  }, []);

  return data || {
    timeline: [],
    patterns: { mostFrequent: '-', byHour: {} },
    success: { total: 0, success: 0, fail: 0 },
    loading,
  };
}
