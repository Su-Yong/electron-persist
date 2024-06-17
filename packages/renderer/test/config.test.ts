import { describe, vi, it, expect } from 'vitest';

import { Config } from '@electron-persist/core';
import { Channel, getChannelName, getChannelType } from '@electron-persist/shared';
import { ipcRenderer, IpcRenderer } from 'electron';

import { getConfig } from '../src';
import { wait } from './util';

const defaultValue = {
  key1: 'value1',
  key2: 0,
  key3: ['array1', 'array2', 'array3'],
  key4: {
    key5: 'value2',
    key6: {
      key7: 'value3',
      key8: ['tuple1', 'tuple2'] as const,
    },
  },
};

describe('getConfig', () => {
  it('default', async () => {
    const config = getConfig('test', ipcRenderer);

    await wait(1000);

    expect(config.get()).toEqual(defaultValue);

    (ipcRenderer as MockIpcRendererType).mockUpdate('test');
    expect(config.get()).toEqual({
      ...defaultValue,
      key2: 1,
    });

    (ipcRenderer as MockIpcRendererType).mockUpdate('empty');
    expect(config.get()).toEqual({
      ...defaultValue,
      key2: 1,
    });

    (ipcRenderer as MockIpcRendererType).mockUpdate('test');
    expect(config.get()).toEqual({
      ...defaultValue,
      key2: 2,
    });
  });
});

// mock
type MockIpcRendererType = IpcRenderer & {
  mockUpdate(name: string): void;
};
vi.mock('electron', async () => {
  const actual = await vi.importActual<typeof import('electron')>('electron');
  const { default: EventEmitter } = await import('node:events');

  const defaultValue = {
    key1: 'value1',
    key2: 0,
    key3: ['array1', 'array2', 'array3'],
    key4: {
      key5: 'value2',
      key6: {
        key7: 'value3',
        key8: ['tuple1', 'tuple2'] as const,
      },
    },
  };
  const configMap: Record<string, Config<any>> = {
    test: new Config({ defaultValue }),
    empty: new Config({ defaultValue: {} }),
  };

  class MockIpcRenderer extends EventEmitter implements IpcRenderer {
    addListener(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): this {
      throw new Error('addListener not implemented.');
    }

    invoke(channel: string, ...args: any[]): Promise<any> {
      throw new Error('invoke not implemented.');
    }

    postMessage(channel: string, message: any, transfer?: MessagePort[] | undefined): void {
      throw new Error('postMessage not implemented.');
    }

    send(channel: string, ...args: any[]): void {
      const type = getChannelType(channel);
      const name = getChannelName(channel);
      if (!name) return;

      const config = configMap[name];

      if (type === 'GET') {
        const value = config.get();

        setTimeout(() => {
          this.emit(channel, {}, value);
        }, ~~(Math.random() * 450) + 50);
      }
      if (type === 'SET') {
        config.set(args[0]);
      }
    }

    sendSync(channel: string, ...args: any[]) {
      throw new Error('sendSync not implemented.');
    }

    sendToHost(channel: string, ...args: any[]): void {
      throw new Error('sendToHost not implemented.');
    }

    setMaxListeners(n: number): this {
      throw new Error('setMaxListeners not implemented.');
    }

    getMaxListeners(): number {
      throw new Error('getMaxListeners not implemented.');
    }

    listeners<K>(eventName: string | symbol): Function[] {
      throw new Error('listeners not implemented.');
    }

    rawListeners<K>(eventName: string | symbol): Function[] {
      throw new Error('rawListeners not implemented.');
    }

    listenerCount<K>(eventName: string | symbol, listener?: Function | undefined): number {
      throw new Error('listenerCount not implemented.');
    }

    prependListener<K>(eventName: string | symbol, listener: (...args: any[]) => void): this {
      throw new Error('prependListener not implemented.');
    }

    prependOnceListener<K>(eventName: string | symbol, listener: (...args: any[]) => void): this {
      throw new Error('prependOnce not implemented.');
    }

    eventNames(): (string | symbol)[] {
      throw new Error('eventNames not implemented.');
    }

    public mockUpdate(name: string) {
      const config = configMap[name];
      if (!config) return;

      this.emit(Channel.SET(name), {}, {
        ...config.get(),
        key2: config.get().key2 + 1,
      });
    }
  }

  return {
    ...actual,
    ipcRenderer: new MockIpcRenderer(),
  };
});
