import { Validator } from './Validator';

export const FallbackValidator = <T>(fallback: T): Validator<T> => ({
  validate: (data: unknown): T => data as T,
  fallback,
});
