import type { JSX } from "preact";
import styles from "./style.module.scss";

export type TitleScreenProps = {
  onClicked: () => void;
};

export const TitleScreen = ({ onClicked }: TitleScreenProps): JSX.Element => {
  return (
    <div className={styles["title-screen"]}>
      <div className={styles["title-screen__inner"]}>
        <button onClick={onClicked}>Start game</button>
      </div>
    </div>
  );
};
