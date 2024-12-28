import sceneUrl from "./assets/scene-example.glb?url";

export const assetManifest = {
  texture: [],
  audio: [],
  gltf: [{ name: "scene", url: sceneUrl }],
} as const;
// Should be labelled as const so we get type safety in the asset cache
