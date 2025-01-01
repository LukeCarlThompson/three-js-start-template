<script lang="ts">
  import { GameOverlay, LevelComplete, LevelSelect, LoadingScreen, TitleScreen } from "./svelte-components";

  import type { GameLevelName } from "../game-state.svelte";
  import { gameState } from "../game-state.svelte";

  export type AppProps = {
    onStartLevelClicked?: () => void;
  };

  let { onStartLevelClicked }: AppProps = $props();

  const showOverlay = $derived(gameState.currentScene !== "game");
  const showTitle = $derived(gameState.currentScene === "title");
  const showLoadingScreen = $derived(gameState.currentScene === "loading");
  const showLevelSelect = $derived(gameState.currentScene === "level-select");
  const showLevelComplete = $derived(gameState.currentScene === "level-complete");
</script>

<div>
  {#if showOverlay}
    <GameOverlay>
      {#if showLoadingScreen}
        <LoadingScreen loadingPercentage={gameState.loadingPercent} />
      {/if}
      {#if showTitle}
        <TitleScreen
          onClicked={() => {
            gameState.currentScene = "level-select";
          }}
        />
      {/if}
      {#if showLevelSelect}
        <LevelSelect
          levels={gameState.levels}
          selectedLevelName={gameState.selectedLevel}
          onSelectionClicked={(selectedLevel) => {
            gameState.selectedLevel = selectedLevel as GameLevelName;
          }}
          onConfirmed={() => {
            onStartLevelClicked?.();
          }}
        />
      {/if}

      {#if showLevelComplete}
        <LevelComplete
          timeMs={100}
          onClicked={() => {
            gameState.currentScene = "game";
          }}
        />
      {/if}
    </GameOverlay>
  {/if}
</div>
