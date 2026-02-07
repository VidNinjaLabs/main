import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";

// Custom enter fullscreen SVG
function EnterFullscreenSVG({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15.5 21C16.8956 21 17.5933 21 18.1611 20.8278C19.4395 20.44 20.44 19.4395 20.8278 18.1611C21 17.5933 21 16.8956 21 15.5M21 8.5C21 7.10444 21 6.40666 20.8278 5.83886C20.44 4.56046 19.4395 3.56004 18.1611 3.17224C17.5933 3 16.8956 3 15.5 3M8.5 21C7.10444 21 6.40666 21 5.83886 20.8278C4.56046 20.44 3.56004 19.4395 3.17224 18.1611C3 17.5933 3 16.8956 3 15.5M3 8.5C3 7.10444 3 6.40666 3.17224 5.83886C3.56004 4.56046 4.56046 3.56004 5.83886 3.17224C6.40666 3 7.10444 3 8.5 3" />
    </svg>
  );
}

// Custom exit fullscreen SVG
function ExitFullscreenSVG({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 3L9 6C9 7.6569 7.6569 9 6 9L3 9" />
      <path d="M15 3L15 6C15 7.6569 16.3431 9 18 9L21 9" />
      <path d="M9 21L9 18C9 16.3431 7.6569 15 6 15L3 15" />
      <path d="M15 21L15 18C15 16.3431 16.3431 15 18 15L21 15" />
    </svg>
  );
}

export function Fullscreen(props: { size?: "sm" | "md" | "lg" | "xl" }) {
  const { isFullscreen } = usePlayerStore((s) => s.interface);
  const display = usePlayerStore((s) => s.display);

  // Size mapping for the custom SVG
  const sizeMap = {
    sm: { base: 20, lg: 25 },
    md: { base: 32, lg: 40 },
    lg: { base: 40, lg: 48 },
    xl: { base: 56, lg: 64 },
  };
  const sizes = sizeMap[props.size || "md"];

  return (
    <VideoPlayerButton
      onClick={() => display?.toggleFullscreen()}
      className="text-white/70 hover:text-white transition-colors"
    >
      {isFullscreen ? (
        <>
          <ExitFullscreenSVG size={sizes.base} className="lg:hidden" />
          <ExitFullscreenSVG size={sizes.lg} className="hidden lg:block" />
        </>
      ) : (
        <>
          <EnterFullscreenSVG size={sizes.base} className="lg:hidden" />
          <EnterFullscreenSVG size={sizes.lg} className="hidden lg:block" />
        </>
      )}
    </VideoPlayerButton>
  );
}
