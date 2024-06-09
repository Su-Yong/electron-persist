import fs from 'node:fs/promises';

import { Persister, PersisterOptions } from './Persister';
import { isDev } from '../util';

export interface FilePersisterOptions<T> extends PersisterOptions<T> {
  path: string;
  versionField?: string;
  serializer?: typeof JSON.stringify,
  deserializer?: typeof JSON.parse,
}

export class FilePersister<T> extends Persister<T> {
  private path: string;
  private serializer: typeof JSON.stringify = JSON.stringify;
  private deserializer: typeof JSON.parse = JSON.parse;
  private versionField = '__version__';

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
      this.versionField = options.versionField ?? '__version__';
      this.serializer = options.serializer ?? JSON.stringify;
      this.deserializer = options.deserializer ?? JSON.parse;
    }
  }

  async read() {
    const str = await fs.readFile(this.path, 'utf-8');
    const result = this.deserializer(str);

    if (typeof result === 'object') delete result[this.versionField];
    else if (isDev) console.warn('The config file is not an object. Please make sure it is a valid JSON object.');

    return result;
  }

  async write(data: T) {
    if (isDev) {
      if (data && typeof data === 'object' && this.versionField in data) {
        console.warn(`The field "${this.versionField}" is reserved for the version of the config. Please remove it from your config.`);
      }
      if (!this.version) {
        console.warn('No version detected. Please set a version for the Application.');
      }
    }

    const str = this.serializer({
      ...data,
      [this.versionField]: this.version,
    });
    await fs.writeFile(this.path, str, 'utf-8');
  }
}