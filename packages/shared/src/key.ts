export const Channel = {
  GET: (name: string) => `electron-persist:${name}:get`,
  SET: (name: string) => `electron-persist:${name}:set`,
};
