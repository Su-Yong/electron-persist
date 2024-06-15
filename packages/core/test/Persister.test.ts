import { describe, expect, it, vi } from 'vitest';

import { Config, FallbackValidator, Migrator, MemoryPersister } from '../src';
import { wait } from './util';

type OldTestConfig = {
  foo: string;
  bar: number;
  baz: boolean;
  some: {
    nested: string;
    items: number[];
  };
  tuple: [string, string];
};
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
const versionSymbol = Symbol('version');
const testData = {
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
  [versionSymbol]: '0.5.2',
};
const oldData = {
  foo: 'foo',
  bar: 42,
  baz: true,
  some: {
    nested: 'value',
    items: [1, 2],
  },
  tuple: ['tuple', '42'],
  [versionSymbol]: '0.4.0',
};

describe('Persister', () => {
  it('validator', async () => {
    const fallback: TestConfig = {
      foo: '',
      bar: 0,
      baz: false,
      some: {
        nested: {
          value: '',
        },
        items: [],
      },
      tuple: ['', 0],
    };
    const config = new Config<TestConfig>({
      persister: new MemoryPersister({
        reference: null as any,
        validator: FallbackValidator(fallback),
      }),
    });

    await wait(50);

    expect(config.get()).toEqual(fallback);
  });

  it('migrator: default', async () => {
    const count = vi.fn();
    const config = new Config<TestConfig>({
      persister: new MemoryPersister({
        reference: structuredClone(oldData),
        versionSymbol,
        version: '0.5.2',
        migrator: new Migrator<TestConfig>({
          '0.5.0': (prev) => {
            const data = prev as OldTestConfig;
            count();

            return {
              ...data,
              some: {
                nested: {
                  value: data.some.nested as string,
                },
                items: (data.some.items as number[]).map((value, index) => ({
                  name: `item${index + 1}`,
                  value,
                })),
              },
              tuple: [data.tuple[0], Number(data.tuple[1])],
            } satisfies TestConfig;
          },
        }),
      }),
    });

    await wait(50);

    expect(count.mock.results.length).toEqual(1);
    expect(config.get()).toEqual({
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
    });
    expect(count.mock.results.length).toBe(1);
    expect(config.get()).toEqual({ // check for migrator does not run twice
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
    });
    expect(count.mock.results.length).toBe(1);
  });

  it('migrator: complex range', async () => {
    const config = new Config<TestConfig>({
      persister: new MemoryPersister({
        reference: structuredClone(oldData),
        versionSymbol,
        version: '0.5.2',
        migrator: new Migrator<TestConfig>({
          '0.4.0 < && <= 0.5.0': () => {
            return 'unreachable code';
          },
          '<0.5.0': (prev) => {
            const data = prev as OldTestConfig;

            return {
              ...data,
              some: {
                nested: {
                  value: data.some.nested as string,
                },
                items: (data.some.items as number[]).map((value, index) => ({
                  name: `item${index + 1}`,
                  value,
                })),
              },
              tuple: [data.tuple[0], Number(data.tuple[1])],
            } satisfies TestConfig;
          },
          '<=0.8.0': () => {
            return 'unreachable code';
          },
          '*': () => {
            return 'unreachable code';
          },
        }),
      }),
    });

    await wait(50);

    expect(config.get()).toEqual({
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
    });
  });

  it('migrator: special property', async () => {
    const check = vi.fn();

    const config = new Config<TestConfig>({
      persister: new MemoryPersister({
        reference: structuredClone(oldData),
        versionSymbol,
        version: '0.5.2',
        migrator: new Migrator<TestConfig>({
          beforeAll: (prev) => {
            check(prev);
          },
          beforeEach: (prev) => {
            return {
              ...prev as OldTestConfig,
              before: ('before' in (prev as Record<string, number>) ? (prev as Record<string, number>).before : 0) + 1,
            };
          },
          afterEach: (prev) => {
            return {
              ...prev as OldTestConfig,
              after: ('after' in (prev as Record<string, number>) ? (prev as Record<string, number>).after : 0) + 1,
            };
          },
          afterAll: (prev) => {
            check(prev);
          },
          '0.4.0': (prev) => prev,
          '<0.5.0': (prev) => {
            const data = prev as OldTestConfig;

            return {
              ...data,
              some: {
                nested: {
                  value: data.some.nested as string,
                },
                items: (data.some.items as number[]).map((value, index) => ({
                  name: `item${index + 1}`,
                  value,
                })),
              },
              tuple: [data.tuple[0], Number(data.tuple[1])],
            } satisfies TestConfig;
          },
        }),
      }),
    });

    await wait(50);

    expect(check.mock.results.length).toBe(2);
    expect(config.get()).toEqual({
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
      before: 2,
      after: 2,
    });
  });
});

describe('MemoryPersister', () => {
  it('read', async () => {
    const config = new Config<TestConfig>({
      persister: new MemoryPersister({
        versionSymbol,
        reference: structuredClone(testData),
        version: '0.5.2',
      }),
    });

    await wait(50);

    expect(config.get()).toEqual({
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
    });
  });
});
