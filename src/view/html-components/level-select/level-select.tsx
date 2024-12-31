import type { JSX } from "preact";
import styles from "./style.module.scss";

export type LevelSelectProps = {
  levels: { name: string; unlocked: boolean }[];
  selectedLevelName: string;
  onConfirmed?: (selectedId: string) => void;
  onSelectionClicked?: (selectedId: string) => void;
};

export const LevelSelect = ({
  selectedLevelName,
  levels,
  onSelectionClicked,
  onConfirmed,
}: LevelSelectProps): JSX.Element => {
  const inputs = levels.map(({ name, unlocked }) => {
    const checked = name === selectedLevelName;
    return (
      <label key={name}>
        <input
          type="radio"
          name="level-select"
          value={name}
          checked={checked}
          disabled={!unlocked}
          onClick={() => {
            onSelectionClicked?.(name);
          }}
        />
        {name}
      </label>
    );
  });

  return (
    <div className={styles["level-select"]}>
      <div className={styles["level-select__inner"]}>
        <fieldset>
          <legend>Level Select:</legend>
          {inputs}
        </fieldset>
      </div>
      <button
        onClick={() => {
          onConfirmed?.(selectedLevelName);
        }}
      >
        Play Level
      </button>
    </div>
  );
};
