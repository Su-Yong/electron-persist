export type MigrationFunction = (prev: unknown) => unknown;
export type Migrations = Record<string, MigrationFunction>;

export interface MigratorOptions {
  strategy?: 'switch';
}

export class Migrator<T> {
  private migrations: Migrations;
  private options: MigratorOptions;

  constructor(migrations: Migrations, options: MigratorOptions = {}) {
    this.migrations = migrations;
    this.options = options;
  }

  migrate(prev: unknown, configVersion: string): T {
    throw Error('Not implemented yet');
  }
}
