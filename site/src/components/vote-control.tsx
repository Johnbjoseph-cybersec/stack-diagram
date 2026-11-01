import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { ArrowFatDownIcon, ArrowFatUpIcon } from "@phosphor-icons/react";

import styles from "./vote-control.module.css";

type Vote = -1 | 0 | 1;
type Direction = "up" | "down";

const toDirections = (vote: Vote): Direction[] => {
  if (vote === 1) return ["up"];
  if (vote === -1) return ["down"];
  return [];
};

const toVote = (direction: Direction | undefined): Vote => {
  if (direction === "up") return 1;
  if (direction === "down") return -1;
  return 0;
};

/** Up and down votes; pressing the active arrow again clears the vote. */
export function VoteControl({
  score,
  vote,
  onVote,
  disabled = false,
}: {
  score: number;
  vote: Vote;
  onVote: (next: Vote) => void;
  disabled?: boolean;
}) {
  const value = toDirections(vote);

  return (
    <ToggleGroup
      value={value}
      onValueChange={([next]) => onVote(toVote(next))}
      disabled={disabled}
      aria-label="Vote"
      className={styles.vote}
      data-vote={value[0]}
    >
      <Toggle value="up" aria-label="Upvote" className={styles.arrow}>
        <ArrowFatUpIcon weight={vote === 1 ? "fill" : "regular"} aria-hidden />
      </Toggle>
      <span className={styles.score}>{score}</span>
      <Toggle value="down" aria-label="Downvote" className={styles.arrow}>
        <ArrowFatDownIcon weight={vote === -1 ? "fill" : "regular"} aria-hidden />
      </Toggle>
    </ToggleGroup>
  );
}
