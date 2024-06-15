import fs from 'node:fs/promises';

import { assert, describe, expect, it, vi } from 'vitest';
import { Config } from '@electron-persist/core';

import { FilePersister } from '../src';
import { wait } from './util';

type TestConfig = {
  foo: string;
  bar: number;
  baz: boolean;
  some: {
    nested: {
      value: string;
    };
    items: {
      name: string;
      value: number;
    }[];
  };
  tuple: [string, number];
};

describe('FilePersister', () => {
  it('read', async () => {
    const config = new Config<TestConfig>({
      persister: new FilePersister('test.json'),
    });

    assert.throw(() => config.get(), 'Config value is not set. Pass `defaultValue` or `persister` property to the constructor');

    await wait(50);

    expect(config.get('foo')).toBe('foo');
  });

  it('write', async () => {
    const config = new Config<TestConfig>({
      persister: new FilePersister('test.json'),
    });

    await wait(50);

    config.set('foo', 'newFoo');

    await wait(50);

    expect(await fs.readFile('test.json')).toEqual(JSON.stringify({
      foo: 'newFoo',
      bar: 42,
      baz: true,
      some: {
        nested: {
          value: 'value',
        },
        items: [
          { name: 'item1', value: 1 },
          { name: 'item2', value: 2 },
        ],
      },
      tuple: ['tuple', 42],
      __version__: null,
    }));
  });

  it('serializer', async () => {
    const config = new Config<TestConfig>({
      persister: new FilePersister({
        path: 'test.json',
        serializer: (data) => JSON.stringify(data, null, 2),
      }),
    });

    await wait(50);

    config.set('foo', 'newFoo');

    await wait(50);

    expect(await fs.readFile('test.json')).toEqual(JSON.stringify({
      foo: 'newFoo',
      bar: 42,
      baz: true,
      some: {
        nested: {
          value: 'value',
        },
        items: [
          { name: 'item1', value: 1 },
          { name: 'item2', value: 2 },
        ],
      },
      tuple: ['tuple', 42],
      __version__: null,
    }, null, 2));
  });

  it('deserializer', async () => {
    const config = new Config<TestConfig>({
      persister: new FilePersister({
        path: 'test.json',
        deserializer: (str) => ({
          ...JSON.parse(str),
          __test: true,
        }),
      }),
    });

    await wait(50);

    config.set('foo', 'newFoo');

    await wait(50);

    expect(await fs.readFile('test.json')).toEqual(JSON.stringify({
      foo: 'newFoo',
      bar: 42,
      baz: true,
      some: {
        nested: {
          value: 'value',
        },
        items: [
          { name: 'item1', value: 1 },
          { name: 'item2', value: 2 },
        ],
      },
      tuple: ['tuple', 42],
      __test: true,
      __version__: null,
    }));
  });
});

// mock

vi.mock('node:fs/promises', async () => {
  const testData = JSON.stringify({
    foo: 'foo',
    bar: 42,
    baz: true,
    some: {
      nested: {
        value: 'value',
      },
      items: [
        { name: 'item1', value: 1 },
        { name: 'item2', value: 2 },
      ],
    },
    tuple: ['tuple', 42],
    __version__: '0.5.2',
  });
  const oldData = JSON.stringify({
    foo: 'foo',
    bar: 42,
    baz: true,
    some: {
      nested: 'value',
      items: [1, 2],
    },
    tuple: ['tuple', '42'],
    __version__: '0.3.7',
  });
  const data: Record<string, unknown> = {
    'test.json': testData,
    'old.json': oldData,
  };

  return {
    // ...(await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')),
    default: {
      readFile: async (path: string) => {
        await wait(Math.random() * 30);

        return data[path];
      },
      writeFile: async (path: string, content: string) => {
        await wait(Math.random() * 30);

        data[path] = content;
      },
      reset() {
        data['test.json'] = testData;
        data['old.json'] = oldData;
      }
    },
  };
});
