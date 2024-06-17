import { Config } from '@electron-persist/core';
import { Channel } from '@electron-persist/shared';

import { ipcMain } from 'electron';

export const registerConfig = <K extends string, T>(name: K, config: Config<T>) => {
  ipcMain.handle(Channel.GET(name), async (_, key) => config.get(key));
  ipcMain.handle(Channel.SET(name), async (_, key, value) => config.set(key, value));
};
