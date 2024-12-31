<script module lang="ts">
  export type LevelSelectProps = {
    levels: { name: string; unlocked: boolean }[];
    selectedLevelName: string;
    onConfirmed?: (selectedId: string) => void;
    onSelectionClicked?: (selectedId: string) => void;
  };
</script>

<script lang="ts">
  let { levels, selectedLevelName, onConfirmed, onSelectionClicked }: LevelSelectProps = $props();
</script>

<div class={"level-select"}>
  <div class={"level-select__inner"}>
    <fieldset>
      <legend>Level Select:</legend>
      {#each levels as { name, unlocked } (name)}
        <label>
          <input
            type="radio"
            name="level-select"
            value={name}
            checked={name === selectedLevelName}
            disabled={!unlocked}
            onclick={() => {
              onSelectionClicked?.(name);
            }}
          />
          {name}
        </label>
      {/each}
    </fieldset>
  </div>
  <button
    onclick={() => {
      onConfirmed?.(selectedLevelName);
    }}
  >
    Play Level
  </button>
</div>

<style lang="scss">
  .level-select {
    position: absolute;
    display: flex;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &__inner {
      position: relative;
      display: flex;
      gap: 5px;
      width: 100%;
      max-width: 300px;
      flex-direction: column;
      align-items: center;
      opacity: 1;
      padding: 20px;
    }
  }
</style>
