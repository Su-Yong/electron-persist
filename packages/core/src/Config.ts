import { Get, Paths } from 'type-fest';

import { Validator } from './Validator';
import { Persister } from './Persister';

export interface ConfigOptions {
  validator: Validator;
  persister: Persister;
}

export class Config<T> {
  constructor(options: ConfigOptions) {
    throw Error('Not implemented');
  }

  set<Key extends Paths<T>>(name: Key, value: Key extends string | readonly string[] ? Get<T, Key> : never) {
    throw Error('Not implemented');
  }

  get<Key extends Paths<T>>(name: Key): Key extends string | readonly string[] ? Get<T, Key> : never {
    throw Error('Not implemented');
  }

  delete<Key extends Paths<T>>(name: Key) {
    throw Error('Not implemented');
  }

  // Utility
}
