import { Config } from '@electron-persist/core';
import { Channel } from '@electron-persist/shared';

import { ipcMain, BrowserWindow } from 'electron';

export const registerConfig = <K extends string, T>(win: BrowserWindow, name: K, config: Config<T>) => {
  const windows: BrowserWindow[] = [];

  ipcMain.handle(Channel.GET(name), async (_, key) => config.get(key));
  ipcMain.handle(Channel.SET(name), async (_, key, value) => config.set(key, value));

  config.watchAll((value) => {
    windows.forEach((win) => win.webContents.send(Channel.SET(name), value));
  });

  return {
    addWindow: (win: BrowserWindow) => {
      windows.push(win);
    },
    removeWindow: (win: BrowserWindow) => {
      const index = windows.indexOf(win);
      if (index !== -1) {
        windows.splice(index, 1);
      }
    },
  };
};
