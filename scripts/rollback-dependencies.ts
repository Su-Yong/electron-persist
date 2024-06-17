import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exclude = ['node_modules', 'dist', 'coverage', '.'];

const modify = (obj: Record<string, string>, newVersion = 'workspace:*') => Object.fromEntries(
  Object.entries(obj)
    .map(([name, version]) => {
      if (name.startsWith('@electron-persist/')) return [name, newVersion];
      return [name, version];
    }),
);

const stack = [root];
let nowPath: string | undefined;
while (nowPath = stack.pop()) {
  if (!nowPath) break;

  const children = fs.readdirSync(nowPath)
    .filter((it) => !exclude.some((not) => it.startsWith(not)))
    .map((file) => path.join(nowPath!, file));

  children.forEach((it) => {
    if (!it.endsWith('package.json')) return;

    const pkg = JSON.parse(fs.readFileSync(it, 'utf8'));
    if (pkg.dependencies) pkg.dependencies = modify(pkg.dependencies);
    if (pkg.devDependencies) pkg.devDependencies = modify(pkg.devDependencies);
    if (pkg.peerDependencies) pkg.peerDependencies = modify(pkg.peerDependencies, '*');

    fs.writeFileSync(it, JSON.stringify(pkg, null, 2) + '\n');
    console.log('Rollback dependency:', it);
  });

  const folders = children.filter((it) => fs.lstatSync(it).isDirectory());
  stack.push(...folders);
}

console.log('Rollback all dependencies to workspace.');
