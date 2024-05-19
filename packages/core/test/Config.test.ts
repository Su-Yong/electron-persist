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
    expect(config.get('foo')).not.toBe('bar');
    expect(config.get('bar')).toBe(42);
    expect(config.get('bar')).not.toBe(41);
    expect(config.get('baz')).toBe(true);
    expect(config.get('baz')).not.toBe(false);
    expect(config.get('some.nested')).toEqual({ value: 'value' });
    expect(config.get('some.nested')).not.toEqual({ value: 'newValue' });
    expect(config.get('some.nested.value')).toBe('value');
    expect(config.get('some.nested.value')).not.toBe('newValue');
    expect(config.get('some.items')).toEqual([
      { name: 'item1', value: 1 },
      { name: 'item2', value: 2 },
    ]);
    expect(config.get('some.items')).not.toEqual([
      { name: 'item2', value: 2 },
      { name: 'item1', value: 1 },
    ]);
    expect(config.get('some.items.0')).toEqual({ name: 'item1', value: 1 });
    expect(config.get('some.items.0')).not.toEqual({ name: 'item2', value: 2 });
    expect(config.get('some.items.0.name')).toBe('item1');
    expect(config.get('some.items.0.name')).not.toBe('item2');
    expect(config.get('some.items.0.value')).toBe(1);
    expect(config.get('some.items.0.value')).not.toBe(2);
    expect(config.get('some.items.1')).toEqual({ name: 'item2', value: 2 });
    expect(config.get('some.items.1')).not.toEqual({ name: 'item1', value: 1 });
    expect(config.get('some.items.1.name')).toBe('item2');
    expect(config.get('some.items.1.name')).not.toBe('item1');
    expect(config.get('some.items.1.value')).toBe(2);
    expect(config.get('some.items.1.value')).not.toBe(1);
    expect(config.get('tuple')).toEqual(['tuple', 42]);
    expect(config.get('tuple')).not.toEqual(['tuple', 43]);
    expect(config.get('tuple.0')).toBe('tuple');
    expect(config.get('tuple.0')).not.toBe('tuple2');
    expect(config.get('tuple.1')).toBe(42);
    expect(config.get('tuple.1')).not.toBe(43);

    // @ts-expect-error
    expect(config.get('not.exists')).toBe(null);
    // @ts-expect-error
    expect(config.get('not.exists')).not.toBe(undefined);
  });

  it ('set', () => {
    const config = new Config<TestConfig>({
      defaultValue: testValue,
    });

    config.set('foo', 'newFoo');
    expect(config.get('foo')).toBe('newFoo');
    expect(config.get('foo')).not.toBe('foo');

    config.set('bar', 43);
    expect(config.get('bar')).toBe(43);
    expect(config.get('bar')).not.toBe(42);

    config.set('baz', false);
    expect(config.get('baz')).toBe(false);
    expect(config.get('baz')).not.toBe(true);

    config.set('some.nested.value', 'newValue');
    expect(config.get('some.nested')).toEqual({ value: 'newValue' });
    expect(config.get('some.nested')).not.toEqual({ value: 'value' });

    // @ts-expect-error
    expect(config.set('not.exists', 'newValue')).toBe(false);
  });
});
