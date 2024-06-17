import { Channel } from '@electron-persist/shared';
import { Config } from '@electron-persist/core';

import { IpcRendererPersister } from './IpcPersister';

import type { IpcRenderer } from 'electron';

export const getConfig = <T>(name: string, ipcRenderer: IpcRenderer): Config<T> => {
  const persister = new IpcRendererPersister<T>({
    name,
    ipcRenderer,
  });
  const config = new Config<T>({ persister });

  ipcRenderer.on(Channel.SET(name), (_, value: T) => {
    if (persister.isInit) {
      config.set(value);
    }
  });
  config.watchAll((value) => {
    ipcRenderer.send(Channel.SET(name), value);
  });

  return config;
};
