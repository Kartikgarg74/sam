/**
 * Security Management Module
 * Handles credentials, permissions, sandboxing, and audit logging
 */

import keytar from 'keytar';
import { appendFile } from 'fs/promises';

// In-memory allow/deny list
const allowedActions = new Set<string>(['launch', 'play', 'pause', 'next', 'previous', 'openTab', 'closeTab', 'navigate', 'click', 'getWindowTitle', 'setSystemPreference', 'controlThirdPartyApp']);

// In-memory rate limiter: max 10 commands per minute per user
const userCommandTimestamps: Record<string, number[]> = {};
const COMMAND_LIMIT = 10;
const TIME_WINDOW_MS = 60 * 1000;

/**
 * Check permission for an action, with optional user consent callback
 * @param action - Action to check
 * @param userId - User identifier (for rate limiting)
 * @param requestConsent - Optional callback to request user consent
 * @returns Promise resolving to true if permitted
 */
export async function checkPermission(action: string, userId?: string, requestConsent?: () => Promise<boolean>): Promise<boolean> {
  // Check allow/deny list
  if (!allowedActions.has(action)) return false;
  // Rate limiting
  if (userId) {
    const now = Date.now();
    if (!userCommandTimestamps[userId]) userCommandTimestamps[userId] = [];
    // Remove timestamps outside the window
    userCommandTimestamps[userId] = userCommandTimestamps[userId].filter(ts => now - ts < TIME_WINDOW_MS);
    if (userCommandTimestamps[userId].length >= COMMAND_LIMIT) return false;
    userCommandTimestamps[userId].push(now);
  }
  // Request user consent if callback provided
  if (requestConsent) {
    const consent = await requestConsent();
    if (!consent) return false;
  }
  return true;
}

/**
 * Store credential securely in macOS Keychain
 * @param key - Credential key
 * @param value - Credential value
 * @returns Promise resolving to success/failure
 */
export async function storeCredential(key: string, value: string): Promise<boolean> {
  try {
    await keytar.setPassword('SamanthaAI', key, value);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Retrieve credential from macOS Keychain
 * @param key - Credential key
 * @returns Promise resolving to credential value or null
 */
export async function getCredential(key: string): Promise<string | null> {
  try {
    return await keytar.getPassword('SamanthaAI', key);
  } catch (error) {
    return null;
  }
}

/**
 * Execution sandboxing: restrict allowed AppleScript commands
 */
const allowedAppleScriptCommands = new Set<string>(['activate', 'quit', 'play', 'pause', 'next track', 'previous track', 'make new tab', 'close current tab', 'set URL', 'set volume', 'do shell script']);

export async function executeSandboxed(command: string): Promise<string> {
  if (![...allowedAppleScriptCommands].some(allowed => command.includes(allowed))) {
    throw new Error('Command not allowed by sandbox policy');
  }
  const { runAppleScript } = await import('./systemIntegration.js');
  return runAppleScript(command);
}

/**
 * Audit logging: append all actions to a log file
 */
export async function logAuditEvent(event: string, details?: any): Promise<boolean> {
  try {
    const logEntry = `[${new Date().toISOString()}] ${event} ${details ? JSON.stringify(details) : ''}\n`;
    await appendFile('automation_audit.log', logEntry);
    return true;
  } catch {
    return false;
  }
}
