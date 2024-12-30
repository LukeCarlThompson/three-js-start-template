import playerUrl from "./assets/player.glb?url";
import terrainUrl from "./assets/terrain.glb?url";

export const assetManifest = {
  texture: [],
  audio: [],
  gltf: [
    { name: "terrain", url: terrainUrl },
    { name: "player", url: playerUrl },
  ],
} as const;
// Should be labelled as const so we get type safety in the asset cache
