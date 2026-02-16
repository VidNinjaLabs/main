import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface SpinnerProps {
  className?: string;
  /** Fixed size in pixels. If not provided, uses responsive default (56px) */
  size?: number;
}

const DEFAULT_SIZE = 220;

export function Spinner(props: SpinnerProps) {
  const size = props.size || DEFAULT_SIZE;

  return (
    <div
      className={`inline-flex items-center justify-center ${props.className || ""}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <div style={{ width: size, height: size }}>
        <DotLottieReact
          src="https://lottie.host/e27e063a-4a5b-4dfc-98ae-d020be243ae2/f5IkMteKHg.lottie"
          loop
          autoplay
        />
      </div>
    </div>
  );
}
