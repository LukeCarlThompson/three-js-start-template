import type { JSX } from "preact";
import styles from "./style.module.scss";

export type LoadingScreenProps = {
  loadingPercentage: number;
};

export const LoadingScreen = ({ loadingPercentage }: LoadingScreenProps): JSX.Element => {
  const finishedLoading = loadingPercentage === 100;
  const classNames = styles["loading"] + (finishedLoading ? " " + styles["loading--hidden"] : "");
  return (
    <div className={classNames}>
      <div className={styles["loading__inner"]}>
        <h4>Loading</h4>
        <p>{Math.round(loadingPercentage)}%</p>
        <progress value={loadingPercentage} max="100" />
      </div>
    </div>
  );
};
