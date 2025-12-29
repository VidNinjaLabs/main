/* eslint-disable import/no-extraneous-dependencies */
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface SpinnerProps {
  className?: string;
  /** Fixed size in pixels. If not provided, uses responsive default (48px) */
  size?: number;
}

// Standard size: 48px everywhere for consistency
const DEFAULT_SIZE = 48;

export function Spinner(props: SpinnerProps) {
  const size = props.size || DEFAULT_SIZE;

  return (
    <div
      className={`inline-flex ${props.className || ""}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <DotLottieReact src="/Loader.json" loop autoplay />
    </div>
  );
}
