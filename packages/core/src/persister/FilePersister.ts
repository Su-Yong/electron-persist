import fs from 'node:fs/promises';

import { Persister } from './Persister';

export interface FilePersisterOptions {
  path: string;
  serializer?: typeof JSON.stringify,
  deserializer?: typeof JSON.parse,
}

export class FilePersister implements Persister {
  private path: string;
  private serializer: typeof JSON.stringify = JSON.stringify;
  private deserializer: typeof JSON.parse = JSON.parse;

  constructor(path: string);
  constructor(options: FilePersisterOptions);
  constructor(options: FilePersisterOptions | string) {
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

  async write(data: Record<string, unknown>) {
    await fs.writeFile(this.path, this.serializer(data), 'utf-8');
  }
}