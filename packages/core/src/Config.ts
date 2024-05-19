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

  private value: T | null = null;

  constructor({
    defaultValue,
    validator,
    persister,
    serializer = JSON.parse,
    deserializer = JSON.stringify,
  }: ConfigOptions<T> = {}) {
    this.validator = validator ?? null;
    this.persister = persister ?? null;
    this.serializer = serializer;
    this.deserializer = deserializer;

    this.value = structuredClone(defaultValue) ?? null;
  }

  set<Key extends Paths<T>>(name: Key, value: ConfigValue<T, Key>): boolean {
    const path = String(name).split('.');
    let result: any = this.value;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (result[key] === undefined) return false;

      result = result[key];
    }

    const key = path[path.length - 1];
    result[key] = value;

    this.broadcast(name);

    return true;
  }

  get<Key extends Paths<T>>(name: Key): ConfigValue<T, Key> | null {
    if (this.value === null) throw Error('Config value is not set. Pass `defaultValue` or `persister` property to the constructor');

    const path = String(name).split('.');
    let result: any = this.value;

    for (const key of path) {
      if (result === undefined) return null;

      result = result[key];
    }

    return result;
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

  private broadcast(key: Paths<T>) {
    (Object.keys(this.listeners) as Paths<T>[])
      .filter((it) => String(it).startsWith(String(key)))
      .forEach((key) => {
        this.listeners[key]?.forEach((listener) => listener(this.get(key)!));
      });

    this.allListeners.forEach((listener) => listener(this.value!));
  }
}
