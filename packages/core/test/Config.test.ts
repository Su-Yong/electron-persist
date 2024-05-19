import { describe, expect, it } from 'vitest';

import { Config } from '../src/Config';

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
const testValue: TestConfig = {
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
};

describe('Config', () => {
  it('get', () => {
    const config = new Config<TestConfig>({
      defaultValue: testValue,
    });

    expect(config.get('foo')).toBe('foo');
    expect(config.get('bar')).toBe(42);
    expect(config.get('baz')).toBe(true);
    expect(config.get('some.nested')).toEqual({ value: 'value' });
    expect(config.get('some.nested.value')).toBe('value');
    expect(config.get('some.items')).toEqual([
      { name: 'item1', value: 1 },
      { name: 'item2', value: 2 },
    ]);
    expect(config.get('some.items.0')).toEqual({ name: 'item1', value: 1 });
    expect(config.get('some.items.0.name')).toBe('item1');
    expect(config.get('some.items.0.value')).toBe(1);
    expect(config.get('some.items.1')).toEqual({ name: 'item2', value: 2 });
    expect(config.get('some.items.1.name')).toBe('item2');
    expect(config.get('some.items.1.value')).toBe(2);
    expect(config.get('tuple')).toEqual(['tuple', 42]);
    expect(config.get('tuple.0')).toBe('tuple');
    expect(config.get('tuple.1')).toBe(42);
  });
});
