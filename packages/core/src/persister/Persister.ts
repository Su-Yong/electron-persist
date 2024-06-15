import { Validator } from './validator';
import { Migrator } from './migrator';
import { isDev } from '../util';

export interface PersisterOptions<T> {
  validator?: Validator<T>;
  migrator?: Migrator<T>;
  version?: string;
}

export abstract class Persister<T> {
  private validator: Validator<T> | null;

  protected migrator: Migrator<T> | null;
  protected version: string | null;

  constructor({ validator, migrator, version }: PersisterOptions<T>) {
    this.validator = validator ?? null;
    this.migrator = migrator ?? null;
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

  public async read(): Promise<T> {
    const configVersion  = await this.getConfigVersion() ?? '0.0.0';
    const result = await this.readData();

    if (this.version && configVersion !== this.version) {
      if (this.migrator) {
        const migratedResult = this.migrator.migrate(result, configVersion, this.version);
        await this.writeData(migratedResult);

        return migratedResult;
      } else if (isDev) {
        console.warn(`The version of the config (${configVersion}) does not match the version of the Application (${this.version}).`);
      }
    }

    return result;
  }

  public async write(data: T): Promise<boolean> {
    if (isDev) {
      if (!this.version) {
        console.warn('No version detected. Please set a version for the Application.');
      }
    }

    return await this.writeData(data).catch(() => false).then(() => true);
  }

  protected abstract getConfigVersion(): Promise<string | null>;

  protected abstract readData(): Promise<T>;

  protected abstract writeData(data: T): Promise<void>;
}
