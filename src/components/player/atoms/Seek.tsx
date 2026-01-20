import { Icon, Icons } from "@/components/Icon";

export type SeekDirection = "backward" | "forward";

export function Seek(props: { direction: SeekDirection }) {
  return (
    <div
      className={`pointer-events-none flex h-28 w-28 items-center justify-center rounded-full text-white ${
        props.direction === "backward"
          ? "animate-seek-left"
          : "animate-seek-right"
      }`}
    >
      <Icon
        icon={
          props.direction === "backward"
            ? Icons.SKIP_BACKWARD
            : Icons.SKIP_FORWARD
        }
        className="text-5xl"
      />
    </div>
  );
}
