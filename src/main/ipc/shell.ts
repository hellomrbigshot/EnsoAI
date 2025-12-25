import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { shellDetector } from '../services/terminal/ShellDetector';

export function registerShellHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SHELL_DETECT, async () => {
    return await shellDetector.detectShells();
  });
}
