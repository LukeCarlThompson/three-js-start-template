import type { GameLevelName } from "./game-state.svelte";
import levelOneUrl from "./assets/level_one.glb?url";
import levelTwoUrl from "./assets/level_two.glb?url";
import playerUrl from "./assets/player.glb?url";
import tutorialUrl from "./assets/tutorial.glb?url";

export const commonAssetManifest = {
  texture: [],
  audio: [],
  gltf: [{ name: "player", url: playerUrl }],
} as const;

export const tutorialAssetManifest = {
  texture: [],
  audio: [],
  gltf: [{ name: "tutorial", url: tutorialUrl }],
} as const;

export const levelOneAssetManifest = {
  texture: [],
  audio: [],
  gltf: [{ name: "level-01", url: levelOneUrl }],
} as const;

export const levelTwoAssetManifest = {
  texture: [],
  audio: [],
  gltf: [{ name: "level-02", url: levelTwoUrl }],
} as const;

export type AssetManifest =
  | typeof commonAssetManifest
  | typeof tutorialAssetManifest
  | typeof levelOneAssetManifest
  | typeof levelTwoAssetManifest;

export const assetManifest: Record<"common" | GameLevelName, AssetManifest> = {
  common: commonAssetManifest,
  tutorial: tutorialAssetManifest,
  "level-01": levelOneAssetManifest,
  "level-02": levelTwoAssetManifest,
} as const;
