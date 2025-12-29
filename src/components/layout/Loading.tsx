import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export interface LoadingProps {
  text?: string;
  className?: string;
}

// Standard size: 48px for consistency with Spinner
const DEFAULT_SIZE = 48;

export function Loading(props: LoadingProps) {
  return (
    <div className={props.className}>
      <div className="flex flex-col items-center justify-center">
        <div
          style={{
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE,
          }}
        >
          <DotLottieReact src="/Loader.json" loop autoplay />
        </div>
        {props.text && props.text.length ? (
          <p className="mt-3 max-w-xs text-sm opacity-75">{props.text}</p>
        ) : null}
      </div>
    </div>
  );
}
