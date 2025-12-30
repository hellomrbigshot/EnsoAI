import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { IPC_CHANNELS } from '@shared/types';
import { app, ipcMain } from 'electron';

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json');
}

/**
 * Read settings from disk (for use in main process)
 */
export function readSettings(): Record<string, unknown> | null {
  try {
    const settingsPath = getSettingsPath();
    if (existsSync(settingsPath)) {
      const data = readFileSync(settingsPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // Return null if file doesn't exist or is corrupted
  }
  return null;
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_READ, async () => {
    try {
      const settingsPath = getSettingsPath();
      if (existsSync(settingsPath)) {
        const data = readFileSync(settingsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch {
      // Return null if file doesn't exist or is corrupted
    }
    return null;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_WRITE, async (_, data: unknown) => {
    try {
      const settingsPath = getSettingsPath();
      writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch {
      return false;
    }
  });
}
