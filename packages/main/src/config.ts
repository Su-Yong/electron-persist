import { Config } from '@electron-persist/core';

import { ipcMain } from 'electron';

import { Channel } from './key';

export const registerConfig = <K extends string, T>(name: K, config: Config<T>) => {
  ipcMain.handle(Channel.GET(name), async (_, key) => config.get(key));
  ipcMain.handle(Channel.SET(name), async (_, key, value) => config.set(key, value));
};
