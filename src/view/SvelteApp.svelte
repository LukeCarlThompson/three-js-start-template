<script lang="ts">
  import type { GameLevelName } from "../game-state.svelte";
  import { GameOverlay, LevelSelect, LoadingScreen, TitleScreen } from "./svelte-components";

  import { gameState } from "../game-state.svelte";

  const { state } = gameState;

  const showOverlay = $derived(state.currentScene !== "game");
  const showTitle = $derived(state.currentScene === "title");
  const showLoadingScreen = $derived(state.currentScene === "loading");
  const showLevelSelect = $derived(state.currentScene === "level-select");
</script>

<div>
  {#if showOverlay}
    <GameOverlay>
      {#if showLoadingScreen}
        <LoadingScreen loadingPercentage={state.loadingPercent}></LoadingScreen>
      {/if}
      {#if showTitle}
        <TitleScreen
          onClicked={() => {
            gameState.setGameScene("level-select");
          }}
        ></TitleScreen>
      {/if}
      {#if showLevelSelect}
        <LevelSelect
          levels={state.levels}
          selectedLevelName={state.selectedLevel}
          onSelectionClicked={(selectedLevel) => {
            gameState.setSelectedLevel(selectedLevel as GameLevelName);
          }}
          onConfirmed={() => {
            gameState.setGameScene("game");
          }}
        ></LevelSelect>
      {/if}
    </GameOverlay>
  {/if}
</div>
