/**
 * System Integration Module
 * Provides native macOS API and AppleScript access
 */

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

/**
 * Execute an AppleScript command
 * @param script - AppleScript code as string
 * @returns Promise resolving to script output
 */
export async function runAppleScript(script: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`osascript -e ${JSON.stringify(script)}`);
    if (stderr) {
      throw new Error(stderr);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`AppleScript execution failed: ${error.message}`);
  }
}

/**
 * Control system preferences (Wi-Fi toggle, volume)
 * @param setting - 'wifi' or 'volume'
 * @param value - true/false for wifi, 0-100 for volume
 * @returns Promise resolving to success/failure
 */
export async function setSystemPreference(setting: string, value: any): Promise<boolean> {
  try {
    if (setting === 'wifi') {
      // Toggle Wi-Fi using AppleScript (calls networksetup)
      const state = value ? 'on' : 'off';
      await runAppleScript(`do shell script \"networksetup -setairportpower en0 ${state}\" with administrator privileges`);
      return true;
    } else if (setting === 'volume') {
      // Set system output volume
      await runAppleScript(`set volume output volume ${value}`);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Perform accessibility action (click, get window title)
 * @param action - 'click', 'getWindowTitle'
 * @param params - {appName, windowName, buttonName}
 * @returns Promise resolving to result
 */
export async function performAccessibilityAction(action: string, params: any): Promise<any> {
  try {
    if (action === 'click') {
      // Click a button in an app window
      const { appName, buttonName } = params;
      await runAppleScript(`tell application \"System Events\" to tell process \"${appName}\" to click button \"${buttonName}\" of window 1`);
      return true;
    } else if (action === 'getWindowTitle') {
      // Get the title of the frontmost window
      const { appName } = params;
      const title = await runAppleScript(`tell application \"System Events\" to tell process \"${appName}\" to get title of window 1`);
      return title;
    }
    return null;
  } catch {
    return null;
  }
}
