export type Config = {
  stats: boolean;
  debugControls: boolean;
  physicsDebugRender: boolean;
};

export const getConfig = (): Config => {
  if (import.meta.env.DEV) {
    return {
      stats: true,
      debugControls: true,
      physicsDebugRender: true,
    };
  }

  return {
    stats: false,
    debugControls: false,
    physicsDebugRender: false,
  };
};
