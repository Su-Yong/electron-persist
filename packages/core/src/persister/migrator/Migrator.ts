import semver from 'semver';
import { isDev } from '../../util';

type MigrationData = {
  run: MigrationFunction;
  priority: number;
  versionMatcher: string;
}
type MigrationFunction = (prev: unknown) => unknown;
type MigrationFunctionWithOptions = {
  run: MigrationFunction;
  priority?: number;
}
export type Migration = MigrationFunction | MigrationFunctionWithOptions;
export type MigrationKey = string | 'beforeEach' | 'afterEach' | 'beforeAll' | 'afterAll';
export type Migrations = Record<MigrationKey, Migration>;

export interface MigratorOptions {
  /**
   * Set migrations strategy
   * @description
   *  - `min`: the migrator will run the migrations in ascending order.
   *  - `max`: the migrator will run the migrations in descending order.
   *  - `no-sort`: the migrator will run the migrations in the order they are defined.
   * @default min
   */
  strategy?: 'min' | 'max' | 'no-sort';
  /**
   * Whether to compare versions loosely
   * @default false
   */
  loose?: boolean;
}

export class Migrator<T> {
  private migrations: MigrationData[] & {
    beforeAll?: Omit<MigrationData, 'versionMatcher'>,
    afterAll?: Omit<MigrationData, 'versionMatcher'>,
    beforeEach?: Omit<MigrationData, 'versionMatcher'>,
    afterEach?: Omit<MigrationData, 'versionMatcher'>
  };
  private options: MigratorOptions;

  constructor(migrations: Migrations, options: MigratorOptions = {}) {
    this.migrations = Object.entries(migrations)
      .filter(([versionMatcher]) => {
        const isValid = semver.valid(versionMatcher);
        if (!isValid && isDev) console.warn(`Invalid version "${versionMatcher}"`);

        return !!isValid;
      })
      .map(([versionMatcher, value]) => this.migrationToData(value, versionMatcher))
      .filter((it) => (
        it.versionMatcher !== 'beforeAll'
        && it.versionMatcher !== 'afterAll'
        && it.versionMatcher !== 'beforeEach'
        && it.versionMatcher !== 'afterEach'
      ));
    if (migrations.afterAll) this.migrations.afterAll = this.migrationToData(migrations.afterAll);
    if (migrations.beforeAll) this.migrations.beforeAll = this.migrationToData(migrations.beforeAll);
    if (migrations.beforeEach) this.migrations.beforeEach = this.migrationToData(migrations.beforeEach);
    if (migrations.afterEach) this.migrations.afterEach = this.migrationToData(migrations.afterEach);

    this.options = {
      loose: false,
      strategy: 'min',
      ...options,
    };
  }

  migrate(prevConfig: unknown, configVersion: string, applicationVersion: string): T {
    let nowConfig = structuredClone(prevConfig);
    const migrationQueue = this.getMigrationQueue();

    nowConfig = this.migrations.beforeAll?.run(nowConfig) ?? nowConfig;

    for (const migration of migrationQueue) {
      if (!semver.satisfies(configVersion, migration.versionMatcher)) continue;
      if (semver.satisfies(applicationVersion, migration.versionMatcher)) continue;

      nowConfig = this.migrations.beforeEach?.run(nowConfig) ?? nowConfig;
      nowConfig = migration.run(nowConfig);
      nowConfig = this.migrations.afterEach?.run(nowConfig) ?? nowConfig;
    }

    nowConfig = this.migrations.afterAll?.run(nowConfig) ?? nowConfig;

    return nowConfig as T;
  }

  getMigrationQueue(): MigrationData[] {
    const migrationQueue: MigrationData[] = [...this.migrations];

    migrationQueue.sort((a, b) => {
      const priority = (a.priority ?? 0) - (b.priority ?? 0);
      if (priority !== 0) return priority;

      if (this.options.strategy === 'no-sort') return 0;

      if (!semver.valid(a.versionMatcher)) {
        if (isDev) console.warn(`Invalid version "${a.versionMatcher}"`);
        return 1;
      }
      if (!semver.valid(b.versionMatcher)) {
        if (isDev) console.warn(`Invalid version "${b.versionMatcher}"`);
        return -1;
      }

      const versionA = semver.minVersion(a.versionMatcher)?.version ?? semver.clean(a.versionMatcher) ?? a.versionMatcher;
      const versionB = semver.minVersion(b.versionMatcher)?.version ?? semver.clean(b.versionMatcher) ?? b.versionMatcher;

      return (this.options.strategy === 'min' ? -1 : 1) * semver.compare(versionA, versionB, this.options.loose);
    });

    return migrationQueue;
  }

  private migrationToData(migration: Migration): Omit<MigrationData, 'versionMatcher'>
  private migrationToData(migration: Migration, versionMatcher: string): MigrationData
  private migrationToData(migration: Migration, versionMatcher?: string): MigrationData | Omit<MigrationData, 'versionMatcher'> {
    let omitData: Omit<MigrationData, 'versionMatcher'>;
    if (typeof migration === 'function') {
      omitData = {
        run: migration,
        priority: 0,
      };
    } else {
      omitData = {
        run: migration.run,
        priority: migration.priority ?? 0,
      };
    }

    if (versionMatcher) {
      let versionRange = versionMatcher;
      if (!this.isRange(versionMatcher)) versionRange = `<${versionMatcher}`;

      return {
        ...omitData,
        versionMatcher: versionRange,
      };
    }

    return omitData;
  }

  private isRange(version: string): boolean {
    return semver.valid(version) === null && semver.validRange(version) !== null;
  }
}
