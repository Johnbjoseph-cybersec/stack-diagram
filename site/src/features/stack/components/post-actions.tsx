import { Menu } from "@base-ui/react/menu";
import { CopyIcon, DotsThreeIcon, DownloadSimpleIcon, ExportIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { Button, buttonClass } from "@/components/button.tsx";
import { MenuItem, MenuPopup } from "@/components/menu.tsx";
import { type ReportReason, ReportMenu } from "@/components/report-menu.tsx";
import { VoteControl } from "@/components/vote-control.tsx";
import { cx } from "@/lib/cx.ts";
import { errorText } from "@/lib/error-text.ts";
import type { PublicStack, Theme } from "@/lib/public-stack.ts";

import { reportStack } from "../server/report.ts";
import type { Vote } from "../server/rules.ts";
import { castVote } from "../server/vote.ts";
import { ChallengeClosed, withChallenge } from "../utils/challenge.ts";
import { downloadPng } from "../utils/download.ts";
import { pngFileName, shareData } from "../utils/share.ts";
import { scoreAfterVote } from "../utils/vote.ts";
import { useChallenge } from "./challenge-panel.tsx";

import styles from "./post-actions.module.css";

type Message = { text: string; tone: "info" | "error" };

export function PostActions({
  stack,
  theme,
  myVote,
  hasVoterPass,
  turnstileSiteKey,
}: {
  stack: PublicStack;
  theme: Theme;
  myVote: Vote;
  hasVoterPass: boolean;
  turnstileSiteKey: string;
}) {
  const [tally, setTally] = useState({ score: stack.score, vote: myVote });
  const [hasPass, setHasPass] = useState(hasVoterPass);
  const [message, setMessage] = useState<Message | null>(null);
  const busy = useRef(false);
  const challenge = useChallenge(turnstileSiteKey);

  // One vote or report at a time, so the server sees them in the order they were made.
  const act = async (run: () => Promise<void>, undo?: () => void) => {
    if (busy.current) return;
    busy.current = true;
    setMessage(null);
    try {
      await run();
      setHasPass(true);
    } catch (cause) {
      undo?.();
      if (!(cause instanceof ChallengeClosed)) {
        setMessage({ text: errorText(cause), tone: "error" });
      }
    } finally {
      busy.current = false;
    }
  };

  const vote = (next: Vote) => {
    const before = tally;
    void act(
      async () => {
        setTally({ score: scoreAfterVote(before.score, before.vote, next), vote: next });
        setTally(
          await withChallenge(
            (turnstileToken) => castVote({ data: { id: stack.id, value: next, turnstileToken } }),
            challenge.solve,
            { hasPass },
          ),
        );
      },
      () => setTally(before),
    );
  };

  const report = (reason: ReportReason) => {
    void act(async () => {
      await withChallenge(
        (turnstileToken) => reportStack({ data: { id: stack.id, reason, turnstileToken } }),
        challenge.solve,
        { hasPass },
      );
      setMessage({ text: "Thanks. We'll take a look.", tone: "info" });
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData(stack, window.location.origin).url);
      setMessage({ text: "Link copied", tone: "info" });
    } catch (cause) {
      setMessage({ text: errorText(cause), tone: "error" });
    }
  };

  const share = async () => {
    try {
      await navigator.share(shareData(stack, window.location.origin));
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setMessage({ text: errorText(cause), tone: "error" });
      }
    }
  };

  const download = async () => {
    try {
      await downloadPng(stack.images[theme], pngFileName(stack.title, theme));
    } catch (cause) {
      setMessage({ text: errorText(cause), tone: "error" });
    }
  };

  return (
    <div>
      <div className={styles.actions}>
        <VoteControl score={tally.score} vote={tally.vote} onVote={vote} />
        <div className={styles.tools}>
          <Button
            variant="outline"
            size="lg"
            aria-label="Download PNG"
            onClick={() => void download()}
          >
            <DownloadSimpleIcon weight="bold" aria-hidden />
            PNG
          </Button>
          <Menu.Root>
            <Menu.Trigger
              aria-label="Share"
              className={cx(buttonClass({ variant: "outline", size: "lg" }), styles.share)}
            >
              <ExportIcon weight="bold" aria-hidden />
              <span className={styles.shareLabel}>Share</span>
            </Menu.Trigger>
            <MenuPopup>
              <MenuItem onClick={() => void copyLink()}>
                <CopyIcon weight="bold" aria-hidden />
                Copy link
              </MenuItem>
              {"share" in navigator ? (
                <MenuItem onClick={() => void share()}>
                  <DotsThreeIcon weight="bold" aria-hidden />
                  More options
                </MenuItem>
              ) : null}
            </MenuPopup>
          </Menu.Root>
          <ReportMenu onReport={report} />
        </div>
      </div>
      {challenge.panel}
      <p role="status" className={styles.message} data-tone={message?.tone}>
        {message?.text}
      </p>
    </div>
  );
}
