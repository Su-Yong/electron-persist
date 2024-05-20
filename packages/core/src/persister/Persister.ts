import { Validator } from './validator';

export interface PersisterOptions<T> {
  validator?: Validator<T>;
}

export abstract class Persister<T> {
  private validator: Validator<T> | null;

  constructor({ validator }: PersisterOptions<T>) {
    this.validator = validator ?? null;
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
