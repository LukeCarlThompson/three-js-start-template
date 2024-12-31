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

class Count {
  public state: GameState = $state<GameState>() as GameState;
  #effects: ((state: GameState) => void)[] = [];

  public constructor(initialState: GameState) {
    this.state = initialState;
  }

  public addEffect = (effect: (state: GameState) => void): void => {
    this.#effects.push(effect);
    this.#runEffects();
  };

  public setLoadingPercent = (loadingPercent: number): void => {
    this.state.loadingPercent = loadingPercent;
    this.#runEffects();
  };

  public setGameScene = (scene: GameSceneName): void => {
    this.state.currentScene = scene;
    this.#runEffects();
  };

  public setSelectedLevel = (level: GameLevelName): void => {
    this.state.selectedLevel = level;
    this.#runEffects();
  };

  #runEffects = () => {
    this.#effects.forEach((effect) => {
      effect($state.snapshot(this.state));
    });
  };
}

export const gameState = new Count({
  loadingPercent: 0,
  currentScene: "loading",
  levelTimerMs: 0,
  selectedLevel: "level-01",
  levels: [
    { name: "level-01", unlocked: true },
    { name: "level-02", unlocked: false },
  ],
});
