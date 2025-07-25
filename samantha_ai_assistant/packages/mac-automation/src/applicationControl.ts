/**
 * Application Control Module
 * Unified app management for system, browser, Spotify, and third-party apps
 */

import { runAppleScript } from './systemIntegration.js';

/**
 * Control Spotify (play, pause, next, previous)
 * @param command - 'play', 'pause', 'next', 'previous'
 * @param options - Additional options (e.g., playlist)
 * @returns Promise resolving to success/failure
 */
export async function controlSpotify(command: string, options?: any): Promise<boolean> {
  try {
    let script = '';
    switch (command) {
      case 'play':
        script = 'tell application "Spotify" to play';
        break;
      case 'pause':
        script = 'tell application "Spotify" to pause';
        break;
      case 'next':
        script = 'tell application "Spotify" to next track';
        break;
      case 'previous':
        script = 'tell application "Spotify" to previous track';
        break;
      default:
        return false;
    }
    await runAppleScript(script);
    return true;
  } catch {
    return false;
  }
}

/**
 * Control browser (Safari: open tab, close tab, navigate)
 * @param command - 'openTab', 'closeTab', 'navigate'
 * @param options - {url}
 * @returns Promise resolving to success/failure
 */
export async function controlBrowser(command: string, options?: any): Promise<boolean> {
  try {
    let script = '';
    switch (command) {
      case 'openTab':
        script = 'tell application "Safari" to make new tab at end of tabs of front window';
        break;
      case 'closeTab':
        script = 'tell application "Safari" to close current tab of front window';
        break;
      case 'navigate':
        if (!options?.url) return false;
        script = `tell application \"Safari\" to set URL of current tab of front window to \"${options.url}\"`;
        break;
      default:
        return false;
    }
    await runAppleScript(script);
    return true;
  } catch {
    return false;
  }
}

/**
 * Control system app (launch example)
 * @param appName - Name of the system app (e.g., 'Safari')
 * @param command - Action to perform (currently only 'launch' supported)
 * @returns Promise resolving to success/failure
 */
export async function controlSystemApp(appName: string, command: string): Promise<boolean> {
  if (command === 'launch') {
    try {
      // AppleScript to launch the app
      await runAppleScript(`tell application \"${appName}\" to activate`);
      return true;
    } catch (error) {
      // Optionally log error
      return false;
    }
  }
  // Other commands not yet implemented
  return false;
}

/**
 * Integrate third-party app (generic AppleScript sender)
 * @param appName - Name of the third-party app
 * @param command - AppleScript command to execute (e.g., 'activate', 'quit')
 * @param options - Additional options (optional)
 * @returns Promise resolving to success/failure
 */
export async function controlThirdPartyApp(appName: string, command: string, options?: any): Promise<boolean> {
  try {
    // Build a generic AppleScript command
    let script = `tell application \"${appName}\" to ${command}`;
    if (options?.args) {
      script += ' ' + options.args.join(' ');
    }
    await runAppleScript(script);
    return true;
  } catch {
    return false;
  }
}
