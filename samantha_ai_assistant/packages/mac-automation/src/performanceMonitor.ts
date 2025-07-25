/**
 * Performance Monitoring Module
 * Tracks resource usage, performance, and system health
 */

import os from 'os';
import process from 'process';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

/**
 * Track resource usage (CPU, memory, disk)
 * @returns Promise resolving to resource stats
 */
export async function trackResources(): Promise<any> {
  try {
    // CPU usage
    const cpus = os.cpus();
    const cpuLoad = cpus.reduce((acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq, 0) / cpus.length;
    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    // Disk usage (macOS: use df -h)
    const { stdout } = await execAsync('df -h /');
    const diskLine = stdout.split('\n')[1];
    const diskUsage = diskLine ? diskLine.split(/\s+/)[4] : 'N/A';
    return {
      cpuLoad,
      totalMem,
      usedMem,
      freeMem,
      diskUsage
    };
  } catch (error) {
    return { error: (error as any).message };
  }
}

/**
 * Get performance metrics (aggregate execution time, resource usage)
 * @returns Promise resolving to metrics
 */
export async function getPerformanceMetrics(): Promise<any> {
  try {
    const resources = await trackResources();
    const uptime = process.uptime();
    return {
      ...resources,
      uptime
    };
  } catch (error) {
    return { error: (error as any).message };
  }
}

/**
 * Monitor system health (basic checks)
 * @returns Promise resolving to health status
 */
export async function monitorSystemHealth(): Promise<any> {
  try {
    const { usedMem, totalMem, cpuLoad, diskUsage } = await trackResources();
    const memPercent = (usedMem / totalMem) * 100;
    const healthy = memPercent < 90 && cpuLoad < 80 && diskUsage !== '100%';
    return {
      healthy,
      memPercent,
      cpuLoad,
      diskUsage
    };
  } catch (error) {
    return { error: (error as any).message };
  }
}

/**
 * Recommend optimizations based on resource usage
 * @returns Promise resolving to recommendations
 */
export async function recommendOptimizations(): Promise<string[]> {
  const recs: string[] = [];
  const { usedMem, totalMem, cpuLoad, diskUsage } = await trackResources();
  if ((usedMem / totalMem) * 100 > 80) {
    recs.push('High memory usage: consider closing unused applications.');
  }
  if (cpuLoad > 80) {
    recs.push('High CPU load: check for background processes.');
  }
  if (diskUsage === '100%') {
    recs.push('Disk is full: free up space on your system drive.');
  }
  if (recs.length === 0) {
    recs.push('System resources are healthy.');
  }
  return recs;
}
