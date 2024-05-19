import { assert, describe, expect, it, vi } from 'vitest';

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
const getTestValue = (): TestConfig => ({
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

describe('property', () => {
  it('get', () => {
    const config = new Config<TestConfig>({
      defaultValue: getTestValue(),
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

  it('set', () => {
    const config = new Config<TestConfig>({
      defaultValue: getTestValue(),
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

  it('watch', () => {
    const config = new Config<TestConfig>({
      defaultValue: getTestValue(),
    });

    const fooCallback = vi.fn();
    const someNestValueCallback = vi.fn();

    config.watch('foo', fooCallback);
    config.watch('some.nested.value', someNestValueCallback);
    expect(fooCallback).toBeCalledTimes(0);
    expect(someNestValueCallback).toBeCalledTimes(0);

    config.set('foo', 'newFoo');
    expect(fooCallback).toBeCalledTimes(1);
    expect(someNestValueCallback).toBeCalledTimes(0);
    expect(fooCallback).toBeCalledWith('newFoo');

    config.set('bar', 31);
    expect(fooCallback).toBeCalledTimes(1);
    expect(someNestValueCallback).toBeCalledTimes(0);

    config.set('some.nested.value', 'newValue');
    expect(fooCallback).toBeCalledTimes(1);
    expect(someNestValueCallback).toBeCalledTimes(1);
    expect(someNestValueCallback).toBeCalledWith('newValue');

    config.set('some.nested', { value: 'anotherValue' });
    expect(fooCallback).toBeCalledTimes(1);
    expect(someNestValueCallback).toBeCalledTimes(2);
    expect(someNestValueCallback).toBeCalledWith('anotherValue');
  });

  it('watchAll', () => {
    const config = new Config<TestConfig>({
      defaultValue: getTestValue(),
    });

    const callback = vi.fn();

    config.watchAll(callback);
    expect(callback).toBeCalledTimes(0);

    config.set('foo', 'newFoo');
    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith({
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
    });

    config.set('bar', 31);
    expect(callback).toBeCalledTimes(2);
    expect(callback).toBeCalledWith({
      foo: 'newFoo',
      bar: 31,
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

    config.set('some.nested.value', 'newValue');
    expect(callback).toBeCalledTimes(3);
    expect(callback).toBeCalledWith({
      foo: 'newFoo',
      bar: 31,
      baz: true,
      some: {
        nested: {
          value: 'newValue',
        },
        items: [
          { name: 'item1', value: 1 },
          { name: 'item2', value: 2 },
        ],
      },
      tuple: ['tuple', 42],
    });
  });

  it('unwatch', () => {
    const config = new Config<TestConfig>({
      defaultValue: getTestValue(),
    });

    const fooCallback = vi.fn();
    const callback = vi.fn();
    config.watch('foo', fooCallback);
    config.watchAll(callback);

    config.set('foo', 'newFoo');
    expect(fooCallback).toBeCalledTimes(1);
    expect(callback).toBeCalledTimes(1);

    config.unwatch(fooCallback);
    config.unwatch(callback);

    config.set('foo', 'newFoo2');
    expect(fooCallback).toBeCalledTimes(1);
    expect(callback).toBeCalledTimes(1);
  });
});

describe('extra', () => {
  it('pollution check', () => {
    const value = { value: 1 };
    const config = new Config<{ value: number }>({
      defaultValue: value,
    });

    config.set('value', 2);

    expect(value).toEqual({ value: 1 });
    expect(config.get('value')).toBe(2);
  });

  it('get before initialize', () => {
    const config = new Config<TestConfig>();

    assert.throw(() => config.get('foo'), 'Config value is not set. Pass `defaultValue` or `persister` property to the constructor');
  });
});
