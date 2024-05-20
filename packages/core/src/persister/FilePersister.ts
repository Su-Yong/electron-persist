import fs from 'node:fs/promises';

import { Persister, PersisterOptions } from './Persister';

export interface FilePersisterOptions<T> extends PersisterOptions<T> {
  path: string;
  serializer?: typeof JSON.stringify,
  deserializer?: typeof JSON.parse,
}

export class FilePersister<T> extends Persister<T> {
  private path: string;
  private serializer: typeof JSON.stringify = JSON.stringify;
  private deserializer: typeof JSON.parse = JSON.parse;

  constructor(path: string);
  constructor(options: FilePersisterOptions<T>);
  constructor(options: FilePersisterOptions<T> | string) {
    super({
      validator: typeof options !== 'string' ? options.validator : undefined,
    });

    if (typeof options === 'string') {
      this.path = options;
    } else {
      this.path = options.path;
      this.serializer = options.serializer ?? JSON.stringify;
      this.deserializer = options.deserializer ?? JSON.parse;
    }
  }

  async read() {
    const str = await fs.readFile(this.path, 'utf-8');
    return this.deserializer(str);
  }

  async write(data: T) {
    await fs.writeFile(this.path, this.serializer(data), 'utf-8');
  }
}