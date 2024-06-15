import { JsonObject } from 'type-fest';

import { Persister, PersisterOptions } from './Persister';

const MEMORY_VERSION_SYMBOL = Symbol('version');

export interface MemoryPersisterOptions<T> extends PersisterOptions<T> {
  reference: JsonObject;
  versionSymbol?: symbol;
}

export class MemoryPersister<T> extends Persister<T> {
  private versionSymbol = MEMORY_VERSION_SYMBOL;
  private reference: any | null = null;

  constructor(options: MemoryPersisterOptions<T>) {
    super(options);

    if (options.reference) this.reference = options.reference;
    if (options.versionSymbol) this.versionSymbol = options.versionSymbol;
  }

  get VERSION_SYMBOL() {
    return this.versionSymbol;
  }

  // implement abstract methods
  protected getConfigVersion() {
    return this.reference?.[this.VERSION_SYMBOL] ?? null;
  }

  protected async readData() {
    return structuredClone(this.reference);
  }

  protected async writeData(data: T) {
    Object.keys(this.reference).forEach((key) => delete this.reference[key]);
    Object.assign(this.reference, data);
  }
}