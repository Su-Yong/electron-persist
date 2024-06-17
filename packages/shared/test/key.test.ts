import { describe, expect, it } from 'vitest';
import { Channel, getChannelName, getChannelType } from '../src';

describe('key', () => {
  it('Channel', () => {
    expect(Channel.GET('name')).toBe('electron-persist:name:get');
    expect(Channel.SET('name')).toBe('electron-persist:name:set');
  });

  it('getChannelName', () => {
    expect(getChannelName('electron-persist:name:get')).toBe('name');
    expect(getChannelName('electron-persist:name:set')).toBe('name');
    expect(getChannelName('electron-persist:name')).toBe(null);
    expect(getChannelName('electron-persist:name:')).toBe(null);
    expect(getChannelType('electron-persist:name:type:long')).toBe(null);
  });

  it('getChannelType', () => {
    expect(getChannelType('electron-persist:name:get')).toBe('GET');
    expect(getChannelType('electron-persist:name:set')).toBe('SET');
    expect(getChannelType('electron-persist:name')).toBe(null);
    expect(getChannelType('electron-persist:name:')).toBe(null);
    expect(getChannelType('electron-persist:name:type:long')).toBe(null);
  });
});
