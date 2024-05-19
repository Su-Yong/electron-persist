import { Validator } from './Validator';
import { Persister } from './persister';

import type { Get, Paths } from 'type-fest';

type Serializer = typeof JSON.parse;
type Deserializer = typeof JSON.stringify;

export interface ConfigOptions<T> {
  defaultValue?: T;

  validator?: Validator;
  persister?: Persister;
  serializer?: Serializer;
  deserializer?: Deserializer;
}

type ConfigValue<T, Key, Fallback = never> = Key extends string | readonly string[] ? Get<T, Key> : Fallback;

export class Config<T> {
  private listeners: {
    [Key in Paths<T>]?: ((value: ConfigValue<T, Key>) => void)[];
  } = {};
  private allListeners: ((value: T) => void)[] = [];

  private validator: Validator | null = null;
  private persister: Persister | null = null;
  private serializer: Serializer;
  private deserializer: Deserializer;

  constructor({
    validator,
    persister,
    serializer = JSON.parse,
    deserializer = JSON.stringify,
  }: ConfigOptions<T> = {}) {
    this.validator = validator ?? null;
    this.persister = persister ?? null;
    this.serializer = serializer;
    this.deserializer = deserializer;
  }

  set<Key extends Paths<T>>(name: Key, value: ConfigValue<T, Key>) {
    throw Error('Not implemented');
  }

  get<Key extends Paths<T>>(name: Key): ConfigValue<T, Key> {
    throw Error('Not implemented');
  }

  // Utility
  watch<Key extends Paths<T>>(name: Key, callback: (value: ConfigValue<T, Key>) => void) {
    const listeners = [...this.listeners[name] ?? []];
    listeners.push(callback);

    this.listeners[name] = listeners;
  }

  watchAll(callback: (value: T) => void) {
    this.allListeners.push(callback);
  }

  unwatch<Key extends Paths<T>>(callback: (value: ConfigValue<T, Key> | T) => void) {
    if (this.allListeners.includes(callback)) {
      this.allListeners = this.allListeners.filter((cb) => cb !== callback);
    }

    if (Object.values(this.listeners).flat().includes(callback)) {
      for (const key in this.listeners) {
        this.listeners[key as Paths<T>] = this.listeners[key as Paths<T>]?.filter((cb) => cb !== callback) ?? [];
      }
    }
  }
}
