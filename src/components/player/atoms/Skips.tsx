/* eslint-disable import/no-extraneous-dependencies */
import { GoBackward10SecIcon, GoForward10SecIcon } from "@hugeicons/react";
import { useCallback } from "react";

import { HugeiconsIcon } from "@/components/HugeiconsIcon";
import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";

export function SkipForward(props: {
  size?: "sm" | "md" | "lg" | "xl";
  onAction?: (action: "forward") => void;
}) {
  const display = usePlayerStore((s) => s.display);
  const time = usePlayerStore((s) => s.progress.time);
  const enableDoubleClickToSeek = usePreferencesStore(
    (s) => s.enableDoubleClickToSeek,
  );

  const commit = useCallback(() => {
    display?.setTime(time + 10);
    props.onAction?.("forward");
  }, [display, time, props]);

  if (enableDoubleClickToSeek) return null;

  return (
    <VideoPlayerButton onClick={commit}>
      <HugeiconsIcon
        icon={GoForward10SecIcon}
        size={props.size || "lg"}
        strokeWidth={2}
      />
    </VideoPlayerButton>
  );
}

export function SkipBackward(props: {
  size?: "sm" | "md" | "lg" | "xl";
  onAction?: (action: "backward") => void;
}) {
  const display = usePlayerStore((s) => s.display);
  const time = usePlayerStore((s) => s.progress.time);
  const enableDoubleClickToSeek = usePreferencesStore(
    (s) => s.enableDoubleClickToSeek,
  );

  const commit = useCallback(() => {
    display?.setTime(time - 10);
    props.onAction?.("backward");
  }, [display, time, props]);

  if (enableDoubleClickToSeek) return null;

  return (
    <VideoPlayerButton onClick={commit}>
      <HugeiconsIcon
        icon={GoBackward10SecIcon}
        size={props.size || "lg"}
        strokeWidth={2}
      />
    </VideoPlayerButton>
  );
}
