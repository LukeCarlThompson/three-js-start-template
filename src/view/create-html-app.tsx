import { GameOverlay, LoadingScreen } from "./html-components";
import { Suspense, lazy } from "preact/compat";
import { gameState, setGameScene, setSelectedLevel } from "../game-state";

import type { GameLevelName } from "../game-state";
import { render } from "preact";

const App = () => {
  const { loadingPercent, currentScene, levels, selectedLevel } = gameState.value;

  const TitleScreen = lazy(() => import("./html-components").then(({ TitleScreen }) => TitleScreen));
  const LevelSelect = lazy(() => import("./html-components").then(({ LevelSelect }) => LevelSelect));

  const showOverlay = currentScene !== "game";
  const showTitle = currentScene === "title";
  const showLoadingScreen = currentScene === "loading";
  const showLevelSelect = currentScene === "level-select";

  return (
    showOverlay && (
      <GameOverlay>
        <>
          {showLoadingScreen && <LoadingScreen loadingPercentage={loadingPercent} />}
          <Suspense fallback={undefined}>
            {showTitle && (
              <TitleScreen
                onClicked={() => {
                  setGameScene("level-select");
                }}
              />
            )}
            {showLevelSelect && (
              <LevelSelect
                levels={levels}
                selectedLevelName={selectedLevel}
                onSelectionClicked={(selectedLevelName) => {
                  setSelectedLevel(selectedLevelName as GameLevelName);
                }}
                onConfirmed={() => {
                  setGameScene("game");
                }}
              />
            )}
          </Suspense>
        </>
      </GameOverlay>
    )
  );
};

export const createHtmlApp = (el: HTMLElement): void => {
  render(<App />, el);
};
