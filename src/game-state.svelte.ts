export type GameLevelName = "tutorial" | "level-01" | "level-02";
export type GameSceneName = "game" | "level-select" | "loading" | "title" | "level-complete" | "game-over";
export type GameLevelEntry = { name: GameLevelName; unlocked: boolean; completed: boolean; bestTime?: number };
export type GameState = {
  renderQuality: number;
  loadingPercent: number;
  currentScene: GameSceneName;
  levelTimerMs: number;
  selectedLevel: GameLevelName;
  levels: GameLevelEntry[];
};

export const gameState: GameState = $state({
  renderQuality: 100,
  loadingPercent: 0,
  currentScene: "loading",
  levelTimerMs: 0,
  selectedLevel: "tutorial",
  levels: [
    { name: "tutorial", unlocked: true, completed: false, bestTime: undefined },
    { name: "level-01", unlocked: true, completed: false, bestTime: undefined },
    { name: "level-02", unlocked: true, completed: false, bestTime: undefined },
  ],
});
