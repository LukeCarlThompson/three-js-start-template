import { signal } from "@preact/signals";

export type GameLevelName = "level-01" | "level-02";
export type GameSceneName = "game" | "level-select" | "loading" | "title";
export type GameLevel = { name: GameLevelName; unlocked: boolean };

export type GameState = {
  loadingPercent: number;
  currentScene: GameSceneName;
  levelTimerMs: number;
  selectedLevel: GameLevelName;
  levels: GameLevel[];
};
export const gameState = signal<GameState>({
  loadingPercent: 0,
  currentScene: "loading",
  levelTimerMs: 0,
  selectedLevel: "level-01",
  levels: [
    { name: "level-01", unlocked: true },
    { name: "level-02", unlocked: false },
  ],
});

export const getGameState = (): GameState => gameState.value;

const assignGameState = () => {
  gameState.value = { ...gameState.value };
};

export const setLoadingPercent = (percent: number): void => {
  gameState.value.loadingPercent = percent;
  assignGameState();
};

export const setGameScene = (scene: GameSceneName): void => {
  gameState.value.currentScene = scene;
  assignGameState();
};

export const setSelectedLevel = (level: GameLevelName): void => {
  gameState.value.selectedLevel = level;
  assignGameState();
};
