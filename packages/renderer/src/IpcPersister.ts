import { Persister, PersisterOptions } from '@electron-persist/core';
import { Channel } from '@electron-persist/shared';

import type { IpcRenderer } from 'electron';

export interface IpcRendererOptions<T> extends PersisterOptions<T> {
  name: string;
  ipcRenderer: IpcRenderer;
}
export class IpcRendererPersister<T> extends Persister<T> {
  private ipcRenderer: IpcRenderer;
  private name: string;
  private init = false;

  constructor({
    name,
    ipcRenderer,
    ...options
  }: IpcRendererOptions<T>) {
    super(options);

    this.ipcRenderer = ipcRenderer;
    this.name = name;
  }

  protected getConfigVersion(): Promise<string | null> {
    return Promise.resolve(null);
  }

  async readData(): Promise<T> {
    this.ipcRenderer.send(Channel.GET(this.name));

    return new Promise<T>((resolve) => {
      this.ipcRenderer.once(Channel.GET(this.name), (_, value: T) => {
        resolve(value);
        this.init = true;
      });
    });
  }

  async writeData(value: T): Promise<void> {
    this.ipcRenderer.send(Channel.SET(this.name), value);
  }

  get isInit() {
    return this.init;
  }
}