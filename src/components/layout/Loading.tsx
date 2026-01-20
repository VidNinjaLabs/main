export interface LoadingProps {
  text?: string;
  className?: string;
}

// Standard size: 96px to match player spinner
const DEFAULT_SIZE = 48;

export function Loading(props: LoadingProps) {
  return (
    <div className={props.className}>
      <div className="flex flex-col items-center justify-center">
        {/* Simple CSS spinner */}
        <div
          className="border-8 border-white/20 border-t-white rounded-full animate-spin"
          style={{
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE,
          }}
        />
        {props.text && props.text.length ? (
          <p className="mt-3 max-w-xs text-sm opacity-75">{props.text}</p>
        ) : null}
      </div>
    </div>
  );
}
