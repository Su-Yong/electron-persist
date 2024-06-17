export const Channel = {
  GET: (name: string) => `electron-persist:${name}:get`,
  SET: (name: string) => `electron-persist:${name}:set`,
};

export const getChannelName = (channel: string): string | null => {
  const matched = channel.match(/electron-persist:([^:]*):[^:]+$/);

  return matched?.[1] ?? null;
};

export const getChannelType = (channel: string): keyof typeof Channel | null => {
  const matched = channel.match(/electron-persist:[^:]*:([^:]+)$/);

  return (matched?.[1]?.toUpperCase() ?? null) as keyof typeof Channel | null;
};
