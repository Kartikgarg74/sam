'use client';
import { useEffect, useState } from 'react';

interface SystemStatus {
  system: { healthy: boolean; cpu: number; memory: number; disk: number };
  usage: { commandsToday: number; mostUsed: string; trend: string };
  performance: { avgResponse: number; successRate: number };
  loading?: boolean;
}

export function useSystemStatus() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/system-status');
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return data || {
    system: { healthy: true, cpu: 0, memory: 0, disk: 0 },
    usage: { commandsToday: 0, mostUsed: '-', trend: '0%' },
    performance: { avgResponse: 0, successRate: 0 },
    loading,
  };
}
