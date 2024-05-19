export interface Persister {
  read(): Promise<Record<string, unknown>>;
  write(data: Record<string, unknown>): Promise<void>;
}
