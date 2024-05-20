export interface Validator<T> {
  validate: (data: unknown) => T;
  fallback: T;
}
