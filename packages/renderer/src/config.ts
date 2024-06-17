import { Channel } from '@electron-persist/shared';

import type { IpcRenderer } from 'electron';

export const getConfig = (name: string, ipcRenderer: IpcRenderer) => {
  ipcRenderer.on(Channel.GET(name), () => {

  });
};
