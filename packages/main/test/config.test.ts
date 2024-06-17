import { describe, it, vi, expect } from 'vitest';
import { Config } from '@electron-persist/core';
import { Channel } from '@electron-persist/shared';

import { ipcMain, IpcMain } from 'electron';

import { registerConfig } from '../src';

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

describe('config', () => {
  it('registerConfig', () => {
    const config = new Config({
      defaultValue,
    });

    const win1 = {
      webContents: {
        send: vi.fn(),
      },
    };
    const win2 = {
      webContents: {
        send: vi.fn(),
      },
    };

    const { addWindow, removeWindow } = registerConfig(win1 as any, 'test', config);

    config.set('key1', 'newValue1');
    expect(win1.webContents.send).toHaveBeenCalledTimes(1);
    expect(win2.webContents.send).toHaveBeenCalledTimes(0);
    expect(win1.webContents.send).toHaveBeenCalledWith(Channel.SET('test'), {
      ...defaultValue,
      key1: 'newValue1',
    });

    removeWindow(win1 as any);
    config.set('key1', 'newValue2');
    expect(win1.webContents.send).toHaveBeenCalledTimes(1);
    expect(win2.webContents.send).toHaveBeenCalledTimes(0);

    addWindow(win2 as any);
    config.set('key1', 'newValue3');
    expect(win1.webContents.send).toHaveBeenCalledTimes(1);
    expect(win2.webContents.send).toHaveBeenCalledTimes(1);
    expect(win2.webContents.send).toHaveBeenCalledWith(Channel.SET('test'), {
      ...defaultValue,
      key1: 'newValue3',
    });
  });

  it('registerConfig: ipcMain', async () => {
    const config = new Config({
      defaultValue,
    });

    const win1 = {
      webContents: {
        send: vi.fn(),
      },
    };
    registerConfig(win1 as any, 'test', config);

    expect(config.get()).toEqual(defaultValue);
    await (ipcMain as MockIpcMainType).mockRendererInvoke(Channel.SET('test'), 'key1', 'newValue1');
    expect(config.get()).toEqual({
      ...defaultValue,
      key1: 'newValue1',
    });

    await (ipcMain as MockIpcMainType).mockRendererInvoke(Channel.SET('test'), {
      ...config.get(),
      key1: 'newValue2',
    });
    expect(config.get()).toEqual({
      ...defaultValue,
      key1: 'newValue2',
    });

    const value = await (ipcMain as MockIpcMainType).mockRendererInvoke(Channel.GET('test'), 'key1');
    expect(value).toBe('newValue2');

    const allValue = await (ipcMain as MockIpcMainType).mockRendererInvoke(Channel.GET('test'));
    expect(allValue).toEqual({
      ...defaultValue,
      key1: 'newValue2',
    });
  });
});

// mock
type MockIpcMainType = IpcMain & {
  mockRendererInvoke(channel: string, ...args: any[]): Promise<any>;
};
vi.mock('electron', async () => {
  const actual = await vi.importActual<typeof import('electron')>('electron');
  const { default: EventEmitter } = await import('node:events');

  class MockIpcMain extends EventEmitter implements IpcMain {
    private handleListeners: Record<string, (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any> = {};

    handle(channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any): void {
      this.handleListeners[channel] = listener;
    }
    handleOnce(channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any): void {
      throw new Error('handleOnce not implemented.');
    }
    removeHandler(channel: string): void {
      delete this.handleListeners[channel];
    }

    public async mockRendererInvoke(channel: string, ...args: any[]) {
      return this.handleListeners[channel]({} as Electron.IpcMainInvokeEvent, ...args);
    }
  }

  return {
    ...actual,
    ipcMain: new MockIpcMain(),
  };
});
