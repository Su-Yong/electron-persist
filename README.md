# electron-persist
> Scalable storage solution for Electron Application

> [!IMPORTANT]  
> Note that this package isn't published yet.
> This package will be published very soon.

# Feature
- 🚀 Fully typed with TypeScript
- 🫙 Nearly zero dependencies: ([type-fest](https://github.com/sindresorhus/type-fest), [semver](https://github.com/npm/node-semver))
- 📦 Fully customizable storage method
- 🚛 Support migration from previous version
- ✅ Support configuration validation

# Installation
```bash
pnpm add @electron-persist/core @electron-persist/main @electron-persist/renderer
```
or npm
```bash
npm install @electron-persist/core @electron-persist/main @electron-persist/renderer
````

# Usage
## Config
```ts
import { Config } from '@electron-persist/core';
import { FilePersister } from '@electron-persist/main';

type ConfigType = {
  key: string;
  type: {
    magic: {
      a: number;
      b: [string, number];
    };
  }
};
const config = new Config<ConfigType>({
  persister: new FilePersister({
    path: 'config.json',
    migrator: {
      '1.0.0': (data) => {
        // migrate from 1.0.0 to 1.0.1
        return data;
      },
      '1.0.1': (data) => {
        // migrate from 1.0.1 to 1.0.2
        return data;
      },
    },
  }),
});

config.get(); // -> ConfigType
config.get('key'); // -> string
config.get('key.type.magic.a'); // -> number
config.get('key.type.magic'); // -> { a: number; b: [string, number]; }

config.set('key', 'value');
config.set('key.type.magic.b', ['string', 1]);
```

## Electron
- In Main
    ```ts
    import { Config } from '@electron-persist/core';
    import { registerConfig } from '@electron-persist/main';
    import { BrowserWindow } from 'electron';
    
    const config = new Config<ConfigType>(/* ... */);
    
    const init = () => {
      const win = new BrowserWindow(/* ... */);
      
      registerConfig(win, 'config', config);
    };
    ```
- In Renderer
  ```ts
  import { Config } from '@electron-persist/core';
  import { getConfig } from '@electron-persist/renderer';
  
  // provide ipcRenderer
  const config = getConfig<ConfigType>('config', window.ipcRenderer);
  
  config.get('key.type.magic.a') // -> number;
  ```

# API
> [!NOTE]  
> TODO
## Core
### Config
### Persister
- MemoryPersister
### Validator
### Migrator

## Main
- registerConfig
### FilePersister

## Renderer
- getConfig
### IpcRendererPersister


# FAQ
## How to use custom persister?
```ts
import { Config, Persister } from '@electron-persist/core';

class CustomPersister<T> extends Persister<T> {
  async getConfigVersion() {
    // load version from custom storage
  }
  
  async readData(key) {
    // read from custom storage
  }
  
  async writeData(key, value) {
    // write to custom storage
  }
}

const config = new Config<ConfigType>({
  persister: new CustomPersister(),
});
```
You can create a custom persister by extending `Persister` class and implement `getConfigVersion`, `readData`, `writeData` methods.
For example, if you want to use `localStorage` as a storage method, you can implement `readData` and `writeData` methods like this:
```ts
class LocalStoragePersister<T> extends Persister<T> {
  async getConfigVersion() {
    return localStorage.getItem('config-version');
  }
  
  async readData(key) {
    return JSON.parse(localStorage.getItem(key));
  }
  
  async writeData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
```

## How to use custom validator?
```ts
import { Config, Validator } from '@electron-persist/core';

const validator = {
  validate: (data: unknown) => {
    if ('never' in data) throw Error('never should not be in data');
    
    return data;
  },
  fallback: {},
};
```
You just pass the object that has `validate` and `fallback` properties to `Config` constructor.
