import { Persister } from './persister';

import type { Get, Paths } from 'type-fest';

export interface ConfigOptions<T> {
  defaultValue?: T;

  persister?: Persister<T>;
}

type ConfigValue<T, Key, Fallback = never> = Key extends string | readonly string[] ? Get<T, Key> : Fallback;

export class Config<T> {
  private listeners: {
    [Key in Paths<T>]?: ((value: ConfigValue<T, Key>) => void)[];
  } = {};
  private allListeners: ((value: T) => void)[] = [];

  private persister: Persister<T> | null = null;

  private value: T | null = null;

  constructor({
    defaultValue,
    persister,
  }: ConfigOptions<T> = {}) {
    this.persister = persister ?? null;

    this.value = structuredClone(defaultValue) ?? null;

    (async () => {
      if (this.persister === null) return;

      const value = await this.persister.read().catch(() => null);
      this.value = structuredClone(this.persister.validate(value));
      this.broadcast();
    })();
  }

  set(value: T): void;
  set<Key extends Paths<T>>(name: Key, value: ConfigValue<T, Key>): void;
  set<Key extends Paths<T>>(param: Key | T, value?: ConfigValue<T, Key>) {
    if (value === undefined) {
      this.value = structuredClone(param as T);
      this.broadcast();
      this.persister?.write(this.value!);
      return;
    }

    const name = param as Key;
    const path = String(name).split('.');
    let result: any = this.value;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (result[key] === undefined) throw Error(`"${path.join('.')}" is not found in the config value`);

      result = result[key];
    }

    const key = path[path.length - 1];
    result[key] = value;

    this.broadcast(name);
    this.persister?.write(this.value!);
  }

  get(): T;
  get(name: Paths<T>): ConfigValue<T, Paths<T>>;
  get<Key extends Paths<T>>(name?: Key): ConfigValue<T, Key> | T {
    if (this.value === null) throw Error('Config value is not set. Pass `defaultValue` or `persister` property to the constructor');
    if (name === undefined) return this.value;

    const path = String(name).split('.');
    let result: any = this.value;

    for (const key of path) {
      if (result === undefined) throw Error(`"${path.join('.')}" is not found in the config value`);

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

  private broadcast(): void;
  private broadcast(key: Paths<T>): void;
  private broadcast(key?: Paths<T>) {
    if (key !== undefined) {
      (Object.keys(this.listeners) as Paths<T>[])
        .filter((it) => String(it).startsWith(String(key)))
        .forEach((key) => {
          this.listeners[key]?.forEach((listener) => listener(this.get(key)!));
        });
    }

    this.allListeners.forEach((listener) => listener(this.value!));
  }
}
