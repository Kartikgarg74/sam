/**
 * Mac Automation Core Entry Point
 * Integrates system, app, security, and performance modules
 */

export * from './systemIntegration.js';
export * from './applicationControl.js';
export * from './securityManager.js';
export * from './performanceMonitor.js';

import { checkPermission, logAuditEvent } from './securityManager.js';
import { controlSystemApp, controlSpotify, controlBrowser, controlThirdPartyApp } from './applicationControl.js';
import { setSystemPreference, performAccessibilityAction } from './systemIntegration.js';
import { trackResources, getPerformanceMetrics, monitorSystemHealth, recommendOptimizations } from './performanceMonitor.js';

/**
 * Handle incoming automation command
 * @param command - Parsed command from voice/AI engine
 * @param params - Additional parameters
 * @returns Promise resolving to result/status
 */
export async function handleAutomationCommand(command: string, params?: any): Promise<any> {
  const start = Date.now();
  let result: any = null;
  let status = 'success';
  let errorMsg = '';
  // Permission check
  const permitted = await checkPermission(command);
  if (!permitted) {
    status = 'denied';
    errorMsg = 'Permission denied for this action.';
    await logAuditEvent('permission_denied', { command, params });
    return { status, error: errorMsg };
  }
  try {
    switch (command) {
      case 'launch':
        result = await controlSystemApp(params?.appName, 'launch');
        break;
      case 'play':
      case 'pause':
      case 'next':
      case 'previous':
        result = await controlSpotify(command);
        break;
      case 'openTab':
      case 'closeTab':
      case 'navigate':
        result = await controlBrowser(command, params);
        break;
      case 'setSystemPreference':
        result = await setSystemPreference(params?.setting, params?.value);
        break;
      case 'click':
      case 'getWindowTitle':
        result = await performAccessibilityAction(command, params);
        break;
      case 'controlThirdPartyApp':
        result = await controlThirdPartyApp(params?.appName, params?.action, params?.options);
        break;
      case 'trackResources':
        result = await trackResources();
        break;
      case 'getPerformanceMetrics':
        result = await getPerformanceMetrics();
        break;
      case 'monitorSystemHealth':
        result = await monitorSystemHealth();
        break;
      case 'recommendOptimizations':
        result = await recommendOptimizations();
        break;
      default:
        status = 'unknown_command';
        errorMsg = 'Unknown command.';
        result = null;
    }
    await logAuditEvent(command, { params, result, status });
  } catch (error: any) {
    status = 'error';
    errorMsg = error.message || String(error);
    await logAuditEvent('error', { command, params, error: errorMsg });
  }
  const duration = Date.now() - start;
  return {
    status,
    result,
    error: errorMsg || undefined,
    durationMs: duration
  };
}
