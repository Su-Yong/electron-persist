import { Validator } from './validator';
import { Migrator } from './migrator';

export interface PersisterOptions<T> {
  validator?: Validator<T>;
  migrator?: Migrator<T>;
  version?: string;
}

export abstract class Persister<T> {
  private validator: Validator<T> | null;

  protected version: string | null;

  constructor({ validator, version }: PersisterOptions<T>) {
    this.validator = validator ?? null;
    this.version = version ?? null;
  }

  validate(data: unknown): T {
    if (!this.validator) return data as T;

    try {
      return this.validator.validate(data) ?? this.validator.fallback;
    } catch {
      return this.validator.fallback;
    }
  }

  abstract read(): Promise<T>;

  abstract write(data: T): Promise<void>;
}
