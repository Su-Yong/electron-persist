import { defineConfig } from 'vite';

import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'umd'],
      name: 'electronPersistShared',
      fileName: 'index',
    },
    outDir: 'dist',
  },
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
});
