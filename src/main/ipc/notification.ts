import { IPC_CHANNELS } from '@shared/types';
import { BrowserWindow, ipcMain, Notification } from 'electron';

interface NotificationOptions {
  title: string;
  body?: string;
  silent?: boolean;
  sessionId?: string;
}

export function registerNotificationHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.NOTIFICATION_SHOW,
    async (event, options: NotificationOptions): Promise<void> => {
      if (!Notification.isSupported()) {
        return;
      }

      const notification = new Notification({
        title: options.title,
        body: options.body,
        silent: options.silent ?? false,
      });

      // 点击通知时激活窗口并通知渲染进程
      if (options.sessionId) {
        notification.on('click', () => {
          const window = BrowserWindow.fromWebContents(event.sender);
          if (window && !window.isDestroyed()) {
            // 激活窗口
            if (window.isMinimized()) window.restore();
            window.focus();
            // 通知渲染进程切换到对应 session
            window.webContents.send(IPC_CHANNELS.NOTIFICATION_CLICK, options.sessionId);
          }
        });
      }

      notification.show();
    }
  );
}
